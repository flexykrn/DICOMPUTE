package blockchain

import (
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"go.uber.org/zap"
)

// Client wraps an Ethereum client for DICOMPUTE JobEscrow interactions
type Client struct {
	client        *ethclient.Client
	jobEscrow     *bind.BoundContract
	jobEscrowAddr common.Address
	auth          *bind.TransactOpts
	chainID       *big.Int
	logger        *zap.Logger
}

// JobEscrowABI is the minimal ABI for claimJob and submitResults
const JobEscrowABI = `[
	{
		"inputs": [{"internalType": "uint256", "name": "jobId", "type": "uint256"}],
		"name": "claimJob",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{"internalType": "uint256", "name": "jobId", "type": "uint256"},
			{"internalType": "string", "name": "resultCID", "type": "string"},
			{"internalType": "uint256", "name": "instructionCount", "type": "uint256"}
		],
		"name": "submitResults",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [{"internalType": "uint256", "name": "jobId", "type": "uint256"}],
		"name": "getJob",
		"outputs": [{
			"components": [
				{"internalType": "uint256", "name": "id", "type": "uint256"},
				{"internalType": "address", "name": "user", "type": "address"},
				{"internalType": "uint8", "name": "state", "type": "uint8"},
				{"internalType": "address", "name": "provider", "type": "address"},
				{"internalType": "string", "name": "resultCID", "type": "string"}
			],
			"internalType": "struct JobEscrow.Job",
			"name": "",
			"type": "tuple"
		}],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "internalType": "uint256", "name": "jobId", "type": "uint256"},
			{"indexed": true, "internalType": "address", "name": "provider", "type": "address"},
			{"indexed": false, "internalType": "uint256", "name": "startedAt", "type": "uint256"}
		],
		"name": "JobClaimed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{"indexed": true, "internalType": "uint256", "name": "jobId", "type": "uint256"},
			{"indexed": true, "internalType": "address", "name": "provider", "type": "address"},
			{"indexed": false, "internalType": "uint256", "name": "payout", "type": "uint256"}
		],
		"name": "JobCompleted",
		"type": "event"
	}
]`

// NewClient creates a blockchain client for the DICOMPUTE JobEscrow
func NewClient(rpcURL string, jobEscrowAddr string, privateKeyHex string, chainID int64, logger *zap.Logger) (*Client, error) {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to dial RPC: %w", err)
	}

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if _, err := client.BlockNumber(ctx); err != nil {
		return nil, fmt.Errorf("RPC not responding: %w", err)
	}

	// Parse private key
	privateKey, err := crypto.HexToECDSA(strings.TrimPrefix(privateKeyHex, "0x"))
	if err != nil {
		return nil, fmt.Errorf("invalid private key: %w", err)
	}

	publicKey := privateKey.Public().(*ecdsa.PublicKey)
	address := crypto.PubkeyToAddress(*publicKey)
	logger.Info("blockchain client initialized", zap.String("address", address.Hex()))

	// Create transactor
	auth, err := bind.NewKeyedTransactorWithChainID(privateKey, big.NewInt(chainID))
	if err != nil {
		return nil, fmt.Errorf("failed to create transactor: %w", err)
	}

	// Parse ABI
	parsedABI, err := abi.JSON(strings.NewReader(JobEscrowABI))
	if err != nil {
		return nil, fmt.Errorf("failed to parse ABI: %w", err)
	}

	// Create bound contract
	addr := common.HexToAddress(jobEscrowAddr)
	contract := bind.NewBoundContract(addr, parsedABI, client, client, client)

	return &Client{
		client:        client,
		jobEscrow:     contract,
		jobEscrowAddr: addr,
		auth:          auth,
		chainID:       big.NewInt(chainID),
		logger:        logger,
	}, nil
}

// ClaimJob calls claimJob(uint256 jobId) on the JobEscrow contract
func (c *Client) ClaimJob(ctx context.Context, jobID *big.Int) (*types.Transaction, error) {
	c.logger.Info("claiming job on-chain", zap.String("jobId", jobID.String()))

	// Update auth nonce
	nonce, err := c.client.PendingNonceAt(ctx, c.auth.From)
	if err != nil {
		return nil, fmt.Errorf("failed to get nonce: %w", err)
	}
	c.auth.Nonce = big.NewInt(int64(nonce))

	// Call claimJob
	tx, err := c.jobEscrow.Transact(c.auth, "claimJob", jobID)
	if err != nil {
		return nil, fmt.Errorf("claimJob transaction failed: %w", err)
	}

	c.logger.Info("claimJob transaction sent", zap.String("tx", tx.Hash().Hex()))

	// Wait for confirmation
	receipt, err := bind.WaitMined(ctx, c.client, tx)
	if err != nil {
		return tx, fmt.Errorf("claimJob mining timeout: %w", err)
	}

	if receipt.Status != types.ReceiptStatusSuccessful {
		return tx, fmt.Errorf("claimJob transaction failed on-chain")
	}

	c.logger.Info("job claimed successfully", zap.String("tx", tx.Hash().Hex()))
	return tx, nil
}

// SubmitResults calls submitResults(uint256 jobId, string resultCID, uint256 instructionCount)
func (c *Client) SubmitResults(ctx context.Context, jobID *big.Int, resultCID string, instructionCount *big.Int) (*types.Transaction, error) {
	c.logger.Info("submitting results on-chain",
		zap.String("jobId", jobID.String()),
		zap.String("cid", resultCID),
	)

	// Update auth nonce
	nonce, err := c.client.PendingNonceAt(ctx, c.auth.From)
	if err != nil {
		return nil, fmt.Errorf("failed to get nonce: %w", err)
	}
	c.auth.Nonce = big.NewInt(int64(nonce))

	// Call submitResults
	tx, err := c.jobEscrow.Transact(c.auth, "submitResults", jobID, resultCID, instructionCount)
	if err != nil {
		return nil, fmt.Errorf("submitResults transaction failed: %w", err)
	}

	c.logger.Info("submitResults transaction sent", zap.String("tx", tx.Hash().Hex()))

	// Wait for confirmation
	receipt, err := bind.WaitMined(ctx, c.client, tx)
	if err != nil {
		return tx, fmt.Errorf("submitResults mining timeout: %w", err)
	}

	if receipt.Status != types.ReceiptStatusSuccessful {
		return tx, fmt.Errorf("submitResults transaction failed on-chain")
	}

	c.logger.Info("results submitted successfully", zap.String("tx", tx.Hash().Hex()))
	return tx, nil
}

// GetJobState reads the current state of a job from the contract
func (c *Client) GetJobState(ctx context.Context, jobID *big.Int) (uint8, error) {
	var result struct {
		Id         *big.Int
		User       common.Address
		State      uint8
		Provider   common.Address
		ResultCID  string
	}

	err := c.jobEscrow.Call(&bind.CallOpts{Context: ctx}, &result, "getJob", jobID)
	if err != nil {
		return 0, fmt.Errorf("getJob call failed: %w", err)
	}

	return result.State, nil
}

// Address returns the client's wallet address
func (c *Client) Address() common.Address {
	return c.auth.From
}

// Close closes the underlying client connection
func (c *Client) Close() {
	c.client.Close()
}
