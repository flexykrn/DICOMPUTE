package contract

const jobEscrowABI = `[{"inputs":[{"internalType":"uint256","name":"jobId","type":"uint256"}],"name":"claimJob","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"jobId","type":"uint256"},{"internalType":"string","name":"resultCID","type":"string"},{"internalType":"uint256","name":"instructionCount","type":"uint256"}],"name":"submitResults","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"jobId","type":"uint256"}],"name":"getJob","outputs":[{"components":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"user","type":"address"},{"components":[{"internalType":"string","name":"dockerUri","type":"string"},{"internalType":"uint256","name":"cpuMilli","type":"uint256"},{"internalType":"uint256","name":"ramMiB","type":"uint256"},{"internalType":"uint256","name":"vramMiB","type":"uint256"},{"internalType":"uint256","name":"durationBlocks","type":"uint256"},{"internalType":"uint256","name":"maxPricePerBlock","type":"uint256"}],"internalType":"struct JobEscrow.JobSpec","name":"spec","type":"tuple"},{"internalType":"uint256","name":"deposit","type":"uint256"},{"internalType":"enum JobEscrow.JobState","name":"state","type":"uint8"},{"internalType":"address","name":"provider","type":"address"},{"internalType":"uint256","name":"startedAt","type":"uint256"},{"internalType":"uint256","name":"completedAt","type":"uint256"},{"internalType":"uint256","name":"lastHeartbeatBlock","type":"uint256"},{"internalType":"string","name":"resultCID","type":"string"},{"internalType":"uint256","name":"instructionCount","type":"uint256"}],"internalType":"struct JobEscrow.Job","name":"","type":"tuple"}],"stateMutability":"view","type":"function"}]`
	"context"
	"crypto/ecdsa"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"go.uber.org/zap"
)

// JobEscrowContract wraps the on-chain JobEscrow contract
type JobEscrowContract struct {
	client     *ethclient.Client
	address    common.Address
	abi        abi.ABI
	privateKey *ecdsa.PrivateKey
	fromAddr   common.Address
	chainID    *big.Int
	logger     *zap.Logger
}

// NewJobEscrowContract creates a contract wrapper
func NewJobEscrowContract(rpcURL, contractAddress, privateKeyHex string, chainID int64, logger *zap.Logger) (*JobEscrowContract, error) {
	client, err := ethclient.Dial(rpcURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RPC: %w", err)
	}

	abiJSON, err := abi.JSON(strings.NewReader(jobEscrowABI))
	if err != nil {
		return nil, fmt.Errorf("failed to parse ABI: %w", err)
	}

	pkHex := strings.TrimPrefix(privateKeyHex, "0x")
	privateKey, err := crypto.HexToECDSA(pkHex)
	if err != nil {
		return nil, fmt.Errorf("invalid private key: %w", err)
	}

	publicKey := privateKey.Public().(*ecdsa.PublicKey)
	fromAddr := crypto.PubkeyToAddress(*publicKey)

	logger.Info("JobEscrow contract ready",
		zap.String("address", contractAddress),
		zap.String("from", fromAddr.Hex()),
	)

	return &JobEscrowContract{
		client:     client,
		address:    common.HexToAddress(contractAddress),
		abi:        abiJSON,
		privateKey: privateKey,
		fromAddr:   fromAddr,
		chainID:    big.NewInt(chainID),
		logger:     logger,
	}, nil
}

// ClaimJob calls claimJob on the contract
func (c *JobEscrowContract) ClaimJob(ctx context.Context, jobID uint64) (*types.Transaction, error) {
	c.logger.Info("claiming job on-chain", zap.Uint64("job_id", jobID))

	data, err := c.abi.Pack("claimJob", big.NewInt(int64(jobID)))
	if err != nil {
		return nil, fmt.Errorf("pack claimJob: %w", err)
	}

	return c.sendTransaction(ctx, data)
}

// SubmitResults calls submitResults on the contract
func (c *JobEscrowContract) SubmitResults(ctx context.Context, jobID uint64, resultCID string, instructionCount uint64) (*types.Transaction, error) {
	c.logger.Info("submitting results on-chain",
		zap.Uint64("job_id", jobID),
		zap.String("result_cid", resultCID),
		zap.Uint64("instruction_count", instructionCount),
	)

	data, err := c.abi.Pack("submitResults", big.NewInt(int64(jobID)), resultCID, big.NewInt(int64(instructionCount)))
	if err != nil {
		return nil, fmt.Errorf("pack submitResults: %w", err)
	}

	return c.sendTransaction(ctx, data)
}

// GetJobState returns the current state of a job (0=Pending, 1=Active, 2=Completed, 3=Slashed, 4=Cancelled)
func (c *JobEscrowContract) GetJobState(ctx context.Context, jobID uint64) (uint8, error) {
	data, err := c.abi.Pack("getJob", big.NewInt(int64(jobID)))
	if err != nil {
		return 0, fmt.Errorf("pack getJob: %w", err)
	}

	msg := ethereum.CallMsg{
		To:   &c.address,
		Data: data,
	}

	result, err := c.client.CallContract(ctx, msg, nil)
	if err != nil {
		return 0, fmt.Errorf("call getJob: %w", err)
	}

	// Unpack the tuple result - we only need the state field (index 4)
	var jobResult struct {
		ID              *big.Int
		User            common.Address
		Spec            struct {
			DockerURI       string
			CPUMilli        *big.Int
			RAMMiB          *big.Int
			VRAMMiB         *big.Int
			DurationBlocks  *big.Int
			MaxPricePerBlock *big.Int
		}
		Deposit         *big.Int
		State           uint8
		Provider        common.Address
		StartedAt       *big.Int
		CompletedAt     *big.Int
		LastHeartbeat   *big.Int
		ResultCID       string
		InstructionCount *big.Int
	}

	err = c.abi.UnpackIntoInterface(&jobResult, "getJob", result)
	if err != nil {
		return 0, fmt.Errorf("unpack getJob: %w", err)
	}

	return jobResult.State, nil
}

// sendTransaction signs and sends a transaction to the contract
func (c *JobEscrowContract) sendTransaction(ctx context.Context, data []byte) (*types.Transaction, error) {
	nonce, err := c.client.PendingNonceAt(ctx, c.fromAddr)
	if err != nil {
		return nil, fmt.Errorf("get nonce: %w", err)
	}

	gasPrice, err := c.client.SuggestGasPrice(ctx)
	if err != nil {
		return nil, fmt.Errorf("get gas price: %w", err)
	}

	// Add 20% to gas price for faster inclusion
	gasPrice = new(big.Int).Mul(gasPrice, big.NewInt(12))
	gasPrice = new(big.Int).Div(gasPrice, big.NewInt(10))

	gasLimit, err := c.client.EstimateGas(ctx, ethereum.CallMsg{
		From: c.fromAddr,
		To:   &c.address,
		Data: data,
	})
	if err != nil {
		c.logger.Warn("gas estimation failed, using default", zap.Error(err))
		gasLimit = 500000
	}

	gasLimit = uint64(float64(gasLimit) * 1.2) // 20% buffer

	tx := types.NewTransaction(nonce, c.address, big.NewInt(0), gasLimit, gasPrice, data)

	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(c.chainID), c.privateKey)
	if err != nil {
		return nil, fmt.Errorf("sign tx: %w", err)
	}

	err = c.client.SendTransaction(ctx, signedTx)
	if err != nil {
		return nil, fmt.Errorf("send tx: %w", err)
	}

	c.logger.Info("transaction sent", zap.String("tx_hash", signedTx.Hash().Hex()))

	// Wait for receipt with timeout
	ctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	receipt, err := c.waitForReceipt(ctx, signedTx.Hash())
	if err != nil {
		return signedTx, fmt.Errorf("wait for receipt: %w", err)
	}

	if receipt.Status == 0 {
		return signedTx, fmt.Errorf("transaction reverted")
	}

	c.logger.Info("transaction confirmed",
		zap.String("tx_hash", signedTx.Hash().Hex()),
		zap.Uint64("block", receipt.BlockNumber.Uint64()),
	)

	return signedTx, nil
}

func (c *JobEscrowContract) waitForReceipt(ctx context.Context, txHash common.Hash) (*types.Receipt, error) {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-ticker.C:
			receipt, err := c.client.TransactionReceipt(ctx, txHash)
			if err != nil {
				continue
			}
			if receipt != nil {
				return receipt, nil
			}
		}
	}
}

// Close closes the RPC client
func (c *JobEscrowContract) Close() {
	c.client.Close()
}
