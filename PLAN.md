# DICOMPUTE — Architectural Blueprint & Execution Plan

## Executive Summary

**DICOMPUTE** is a decentralized GPU compute marketplace with an on-chain proof-of-training receipt layer settled on XDC. It differentiates from Akash/Render/io.net not on price, but on **verifiability** — every training job produces a cryptographically signed, on-chain receipt suitable for model provenance, compliance, and grant accountability.

This is a **12-hour vertical slice**: job submission → decentralized compute → on-chain proof-of-training receipt on XDC. The full marketplace is a multi-quarter roadmap.

---

## 1. Reference Architecture Analysis (What We Fork vs. Build)

### 1.1 Repos Audited

| Repo | Relevance | What We Take | What We Discard |
|------|-----------|--------------|-----------------|
| **Lilypad-Tech/lilypad** | High | Contract state machine (Deal/Agreement/Result structs), Go executor interface, WebSocket reconnection logic, Hardhat deploy pipeline | Bacalhau dependency, LilypadToken, mediation randomness, Arbitrum-specific config |
| **stc-community/CloudX3** | Medium | Vue dashboard patterns, API marketplace concepts, Hardhat scripts | Soul-bound NFTs, DAO governance, Chinese i18n |
| **pali101/GPUHub** | Low | Basic GPU listing struct | No escrow, no verifiability, Truffle (outdated) |
| **Himesh-29/GPUConnect** | Medium | Django backend patterns, WebSocket consumers, payment service structure | Django-specific ORM, no on-chain receipts |
| **igorperic17/obrigado-is-near** | Low | Worker-node job polling pattern, IPFS upload | NEAR-specific SDK, no verifiability |

### 1.2 Fork Strategy: Lilypad as Foundation

Lilypad is the closest match to our requirements. Its architecture has:
- **Escrow + state machine** (Pending → Active → Completed/Slashed)
- **Go-based resource provider daemon** with executor interface
- **Controller-pattern contracts** with role-based access
- **Web3 SDK integration** with auto-reconnect

**Key modifications for DICOMPUTE:**
1. Replace LilypadToken with **XDC-compatible ERC-20 stablecoin** (or XDC native)
2. Replace Bacalhau executor with **Docker-native provisioner** + cgroup limits
3. Add **EIP-712 heartbeat signatures** for verifiability
4. Add **ReputationSystem** contract
5. Add **ProofReceipt NFT** (ERC-721) for on-chain training receipts
6. Port from Arbitrum/ETH to **XDC Network** (chainId: 50 mainnet, 51 testnet)

---

## 2. Component Architecture & Data Flow

### 2.1 System Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 3: CLIENT INTERFACE (Next.js 14, Wagmi v2, Shadcn/ui)       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Job Wizard   │  │ Uptime Dash  │  │ Receipt Explorer         │  │
│  │ (submit job) │  │ (provider    │  │ (verify on-chain proof)  │  │
│  └──────┬───────┘  │  health)     │  └──────────────────────────┘  │
│         │          └──────────────┘                                  │
│         ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Wagmi v2 + Viem → XDC RPC (https://rpc.xinfin.network)     │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 2: PROVIDER DAEMON (Go 1.22)                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Docker       │  │ Crypto       │  │ Heartbeat                │  │
│  │ Provisioner  │  │ Verifier     │  │ Broadcaster              │  │
│  │ (pull/run/   │  │ (EIP-712     │  │ (periodic on-chain       │  │
│  │  teardown)   │  │  signing)    │  │  signature submission)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                     │                  │
│         └─────────────────┴─────────────────────┘                  │
│                           │                                        │
│                           ▼                                        │
│              ┌────────────────────────┐                           │
│              │  go-ethereum → XDC RPC │                           │
│              └────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1: SMART CONTRACTS (Solidity ^0.8.24, Foundry)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ JobEscrow    │  │ GPURegistry  │  │ ReputationSystem         │  │
│  │ (escrow +    │  │ (provider    │  │ (score + slash history)  │  │
│  │  state mach) │  │  staking)    │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘  │
│         │                 │                     │                  │
│         └─────────────────┴─────────────────────┘                  │
│                           │                                        │
│                           ▼                                        │
│              ┌────────────────────────┐                           │
│              │  ProofReceipt (ERC-721)│  ← on-chain training     │
│              │  "Verifiable Receipt"  │    receipt NFT           │
│              └────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Job Lifecycle Sequence Flow

```
Phase 1: SUBMISSION
───────────────────
User → Client Dashboard
  └─> Fills Job Wizard (Docker URI, GPU/CPU/RAM sliders, duration, max price)
  └─> Wagmi calls JobEscrow.submitJob(JobSpec, depositAmount)
  └─> ERC-20 approve + transferFrom into escrow
  └─> Contract emits JobSubmitted(jobId, specHash, deposit)

Phase 2: MATCHING
─────────────────
Provider Daemon (Go)
  └─> Polls GPURegistry for available jobs OR listens to JobSubmitted events
  └─> Calls JobEscrow.claimJob(jobId) with provider stake
  └─> Contract checks: provider registered, stake sufficient, not slashed
  └─> State: Pending → Active
  └─> Emits JobClaimed(jobId, provider, startedAt)

Phase 3: EXECUTION
──────────────────
Provider Daemon
  └─> Docker Provisioner pulls image, enforces cgroups (CPU/RAM/VRAM)
  └─> Container runs training job
  └─> Background goroutine: Crypto Verifier signs EIP-712 heartbeat every N blocks
  └─> Heartbeat payload: {jobId, blockNumber, uptimeSeconds, resourceSnapshot}
  └─> Submits signed heartbeat to JobEscrow.submitHeartbeat(sig, payload)

Phase 4: VERIFICATION
─────────────────────
JobEscrow (Solidity)
  └─> Verifies EIP-712 signature against provider's registered pubkey
  └─> Checks blockNumber is within MAX_BLOCK_TIMEOUT of last heartbeat
  └─> Updates lastHeartbeatBlock[jobId]
  └─> Emits HeartbeatReceived(jobId, blockNumber, uptime)

Phase 5: COMPLETION OR SLASHING
───────────────────────────────
Path A: Normal Completion
  Provider → submitResults(jobId, resultCID, instructionCount)
  Contract → verifies job duration met, heartbeats consistent
  Contract → mints ProofReceipt NFT to user (receipt metadata: jobId, provider, duration, cost, resultCID)
  Contract → releases escrow to provider (cost) + returns excess to user
  Contract → updates ReputationSystem (+completion, +heartbeat consistency)
  State: Active → Completed

Path B: Challenge (Slashing)
  Anyone → challengeProvider(jobId)
  Contract → checks: lastHeartbeatBlock < currentBlock - MAX_BLOCK_TIMEOUT
  Contract → slashes provider stake (bounty to challenger, remainder burned)
  Contract → returns user deposit
  Contract → updates ReputationSystem (-slash, penalize)
  State: Active → Slashed
  Emits ProviderSlashed(jobId, provider, challenger, bounty)

Phase 6: RECEIPT
────────────────
User owns ProofReceipt NFT
  └─> Metadata: training proof with cryptographic attestation
  └─> Verifiable by anyone: query JobEscrow + ReputationSystem + heartbeats
  └─> Used for: model provenance, grant accountability, compliance audits
```

---

## 3. Strict Interface Definitions (The "Glue")

### 3.1 EIP-712 Schema: Heartbeat Payload

```solidity
// Domain Separator
bytes32 constant HEARTBEAT_DOMAIN_TYPEHASH = keccak256(
    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
);

// Domain values
string  name              = "DICOMPUTE";
string  version           = "1";
uint256 chainId           = 50; // XDC mainnet (51 for testnet)
address verifyingContract = address(jobEscrow);

// Struct Type Hash
bytes32 constant HEARTBEAT_TYPEHASH = keccak256(
    "Heartbeat(uint256 jobId,uint256 blockNumber,uint256 uptimeSeconds,uint256 cpuPercent,uint256 ramPercent,uint256 vramPercent,uint256 timestamp)"
);

// Struct
struct Heartbeat {
    uint256 jobId;
    uint256 blockNumber;
    uint256 uptimeSeconds;
    uint256 cpuPercent;    // 0-10000 (basis points)
    uint256 ramPercent;    // 0-10000
    uint256 vramPercent;   // 0-10000
    uint256 timestamp;     // Unix timestamp
}
```

### 3.2 Solidity Interface: IComputeMarketplace.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IComputeMarketplace {
    // ─── Custom Errors ───
    error InvalidJobId();
    error JobNotPending();
    error JobNotActive();
    error JobAlreadyClaimed();
    error InsufficientDeposit();
    error InsufficientStake();
    error ProviderNotRegistered();
    error ProviderSlashed();
    error InvalidHeartbeatSignature();
    error HeartbeatTimeout();
    error ChallengeWindowClosed();
    error UnauthorizedChallenger();
    error ResultsNotSubmitted();
    error TransferFailed();

    // ─── Enums ───
    enum JobState { Pending, Active, Completed, Slashed, Cancelled }

    // ─── Structs ───
    struct JobSpec {
        string dockerUri;
        uint256 cpuMilli;      // milli-CPU
        uint256 ramMiB;        // MiB
        uint256 vramMiB;       // MiB (0 if CPU-only)
        uint256 durationBlocks;
        uint256 maxPricePerBlock;
    }

    struct Job {
        uint256 id;
        address user;
        JobSpec spec;
        uint256 deposit;
        JobState state;
        address provider;
        uint256 startedAt;
        uint256 completedAt;
        uint256 lastHeartbeatBlock;
        string resultCID;
        uint256 instructionCount;
    }

    struct Provider {
        address addr;
        string metadataURI;
        uint256 stake;
        bool isRegistered;
        bool isSlashed;
    }

    // ─── Events ───
    event JobSubmitted(uint256 indexed jobId, address indexed user, uint256 deposit);
    event JobClaimed(uint256 indexed jobId, address indexed provider, uint256 startedAt);
    event HeartbeatReceived(uint256 indexed jobId, uint256 blockNumber, uint256 uptimeSeconds);
    event ResultsSubmitted(uint256 indexed jobId, string resultCID, uint256 instructionCount);
    event JobCompleted(uint256 indexed jobId, address indexed provider, uint256 payout);
    event ProviderSlashed(uint256 indexed jobId, address indexed provider, address indexed challenger, uint256 bounty);
    event ProviderRegistered(address indexed provider, uint256 stake);
    event ProviderUnregistered(address indexed provider, uint256 stakeReturned);

    // ─── User Functions ───
    function submitJob(JobSpec calldata spec, uint256 deposit) external returns (uint256 jobId);
    function cancelJob(uint256 jobId) external;

    // ─── Provider Functions ───
    function registerProvider(string calldata metadataURI) external payable;
    function unregisterProvider() external;
    function claimJob(uint256 jobId) external;
    function submitHeartbeat(uint256 jobId, bytes calldata signature, bytes32 digest) external;
    function submitResults(uint256 jobId, string calldata resultCID, uint256 instructionCount) external;

    // ─── Challenger Functions ───
    function challengeProvider(uint256 jobId) external;

    // ─── View Functions ───
    function getJob(uint256 jobId) external view returns (Job memory);
    function getProvider(address provider) external view returns (Provider memory);
    function getJobCount() external view returns (uint256);
    function getPendingJobs() external view returns (uint256[] memory);
}
```

### 3.3 Go Core Interfaces

```go
// provisioner.go
package daemon

import "context"

type ResourceLimits struct {
    CPUMilli    int64
    RAMMiB      int64
    VRAMMiB     int64
    GPUDevices  []string
}

type ContainerConfig struct {
    ImageURI    string
    EnvVars     map[string]string
    Limits      ResourceLimits
    WorkDir     string
}

type JobResult struct {
    ExitCode        int
    StdoutCID       string
    StderrCID       string
    InstructionCount uint64
    DurationSec     uint64
}

type DockerProvisioner interface {
    PullImage(ctx context.Context, imageURI string) error
    RunContainer(ctx context.Context, cfg ContainerConfig) (containerID string, err error)
    StreamLogs(ctx context.Context, containerID string) (stdout, stderr <-chan string, err error)
    GetResourceSnapshot(ctx context.Context, containerID string) (*ResourceSnapshot, error)
    StopAndRemove(ctx context.Context, containerID string) error
    GetResult(ctx context.Context, containerID string) (*JobResult, error)
}

type ResourceSnapshot struct {
    CPUPercent    uint16 // basis points (0-10000)
    RAMPercent    uint16
    VRAMPercent   uint16
    Timestamp     int64
}
```

```go
// verifier.go
package daemon

import (
    "crypto/ecdsa"
    "math/big"
)

type HeartbeatPayload struct {
    JobID         uint64         `json:"jobId"`
    BlockNumber   uint64         `json:"blockNumber"`
    UptimeSeconds uint64         `json:"uptimeSeconds"`
    CPUPercent    uint16         `json:"cpuPercent"`
    RAMPercent    uint16         `json:"ramPercent"`
    VRAMPercent   uint16         `json:"vramPercent"`
    Timestamp     int64          `json:"timestamp"`
}

type SignedHeartbeat struct {
    Payload   HeartbeatPayload
    Signature []byte // 65-byte ECDSA sig: r (32) + s (32) + v (1)
    Digest    [32]byte // keccak256 hash of EIP-712 struct
}

type CryptoVerifier interface {
    SignHeartbeat(payload HeartbeatPayload) (*SignedHeartbeat, error)
    VerifyOnChain(jobID uint64, signed SignedHeartbeat) error
    GetAddress() common.Address
}

// Implementation uses go-ethereum/crypto for secp256k1 signing
// and go-ethereum/signer/core/apitypes for EIP-712 typed data hashing
```

---

## 4. Edge Case & Security Mitigation

### 4.1 RPC Outage During Active Docker Run

**Scenario:** Provider daemon loses Web3 RPC connection while a container is running.

**Fallback Behavior:**
1. **Heartbeat buffer:** Daemon maintains an in-memory ring buffer of last N heartbeats. On RPC reconnect, it attempts to batch-submit missed heartbeats.
2. **Local persistence:** Write heartbeats to local SQLite/WAL file every tick. On restart, read back and continue.
3. **Grace period:** Contract allows `MAX_BLOCK_TIMEOUT + GRACE_BLOCKS` before challenge is valid. Grace = 12 blocks (~1 min on XDC).
4. **Container continuation:** Docker run continues independently. If RPC is down at job end, daemon queues `submitResults` for retry with exponential backoff.
5. **Circuit breaker:** After 3 failed RPC calls, daemon enters "degraded" mode — stops claiming new jobs but continues running active jobs and buffering heartbeats.

### 4.2 Preventing "Lazy Provider" Fake Heartbeats

**Problem:** Provider signs heartbeats without actually running the Docker container.

**Mitigations:**
1. **Resource snapshot attestation:** Heartbeat includes live cgroup metrics (cpuPercent, ramPercent). Contract doesn't verify these on-chain (too expensive), but the client dashboard displays them. A provider consistently reporting 0% CPU while claiming to run training is flagged.
2. **Result CID verification:** Final `submitResults` requires a valid IPFS/Filecoin CID. The client can pull and inspect the result. Garbage CIDs = reputation penalty.
3. **Proof-of-Useful-Work (future):** Require provider to include a verifiable computation proof (e.g., zk-proof of training step). Out of scope for 12h slice.
4. **Reputation threshold:** Only providers with >N completed jobs and >X% heartbeat consistency can claim high-value jobs. New providers start with small jobs.
5. **Challenger incentive:** Anyone can challenge. The bounty makes it economically rational to monitor and challenge fake providers.

---

## 5. Sequential Execution Plan (PR Roadmap)

### PR 1: Monorepo Scaffold & XDC Tooling
**Scope:** Initialize repo, configure Foundry for XDC, set up Go module, Next.js app.

**Tasks:**
- [ ] `mkdir -p contracts/ daemon/ client/ shared/`
- [ ] Foundry: `forge init contracts/` + configure `foundry.toml` for XDC (chainId 50/51, RPC endpoints)
- [ ] Go: `go mod init github.com/dicompute/daemon` + add deps (go-ethereum, docker SDK, viper)
- [ ] Next.js: `npx create-next-app@14 client/` + Tailwind + Shadcn + Wagmi v2
- [ ] Add `docker-compose.yml` for local XDC devnet (or use Apothem testnet)
- [ ] Add root `README.md` with architecture diagram

**XDC Config:**
```toml
# foundry.toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
chain_id = 51 # Apothem testnet
# RPC: https://rpc.apothem.network
# Explorer: https://explorer.apothem.network
```

### PR 2: Smart Contract Core (Solidity)
**Scope:** JobEscrow, GPURegistry, ReputationSystem, ProofReceipt NFT.

**Tasks:**
- [ ] `JobEscrow.sol`: submitJob, claimJob, submitHeartbeat, submitResults, challengeProvider
- [ ] `GPURegistry.sol`: registerProvider, unregisterProvider, stake/unstake
- [ ] `ReputationSystem.sol`: score tracking, slash history, completion rate
- [ ] `ProofReceipt.sol`: ERC-721 minting on job completion, metadata with job proof
- [ ] `IComputeMarketplace.sol`: interfaces + custom errors + events
- [ ] Foundry tests: state transitions, slashing logic, heartbeat verification
- [ ] Deploy script for Apothem testnet

### PR 3: Go Daemon Engine
**Scope:** Docker provisioner, crypto verifier, heartbeat broadcaster.

**Tasks:**
- [ ] `provisioner.go`: Docker Engine API wrapper, cgroup enforcement, image pull/run/teardown
- [ ] `verifier.go`: EIP-712 typed data signing with secp256k1
- [ ] `heartbeat.go`: Background ticker, RPC submission with retry + backoff
- [ ] `watcher.go`: Event listener for JobSubmitted, JobClaimed
- [ ] `main.go`: Cobra CLI, config via env/flags, graceful shutdown
- [ ] Unit tests for provisioner (mock Docker client)

### PR 4: Client Dashboard (Next.js)
**Scope:** Job wizard, uptime dashboard, receipt explorer.

**Tasks:**
- [ ] `JobWizard.tsx`: Docker URI input, resource sliders (CPU/RAM/VRAM), price estimation
- [ ] `UptimeDashboard.tsx`: Real-time grid of providers, health status (Healthy/Degraded/Slashed)
- [ ] `ReceiptExplorer.tsx`: Search proof receipts by jobId, verify on-chain
- [ ] Wagmi hooks: useSubmitJob, useClaimJob, useSubmitHeartbeat, useChallengeProvider
- [ ] Connect to XDC via Wagmi custom chain config

### PR 5: Integration & End-to-End Test
**Scope:** Wire all layers, run full job lifecycle on Apothem testnet.

**Tasks:**
- [ ] Deploy contracts to Apothem
- [ ] Run daemon locally, register provider
- [ ] Submit job via dashboard
- [ ] Verify heartbeat flow
- [ ] Complete job, mint receipt
- [ ] Test challenge/slash path
- [ ] Record demo video / screenshots

---

## 6. XDC-Specific Considerations

| Aspect | XDC Mainnet | XDC Apothem (Testnet) |
|--------|-------------|----------------------|
| Chain ID | 50 | 51 |
| RPC | https://rpc.xinfin.network | https://rpc.apothem.network |
| Block Time | ~2 seconds | ~2 seconds |
| Gas Token | XDC | XDC |
| EVM Compatible | Yes (Istanbul) | Yes |
| Explorer | https://explorer.xinfin.network | https://explorer.apothem.network |

**Notes:**
- XDC uses `XDC` prefix addresses (not `0x`). Web3 libraries handle this transparently.
- Gas is cheap (~0.0001 XDC per standard tx). No L2 needed.
- For hackathon demo: use Apothem testnet + faucet.

---

## 7. 12-Hour Time Budget

| Phase | Hours | Deliverable |
|-------|-------|-------------|
| Planning & scaffold | 1h | This plan + monorepo structure |
| PR 2: Contracts | 3h | 4 contracts + tests + deploy |
| PR 3: Daemon | 3h | Go binary with Docker + heartbeat |
| PR 4: Dashboard | 3h | Next.js app with 3 screens |
| PR 5: Integration | 2h | E2E test + demo |

---

## 8. Immediate Next Steps

1. **Approve this plan** — I will scaffold the monorepo (PR 1)
2. **Confirm XDC network** — Apothem testnet for dev? Mainnet for demo?
3. **Docker environment** — Do you have Docker Desktop running on WSL?
4. **XDC wallet** — Do you have an XDC wallet address for deployer?

Once confirmed, I begin PR 1 immediately.
