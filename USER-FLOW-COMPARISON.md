# User Flow Comparison: Akash Network vs NoCapCompute

> **Purpose:** Compare end-to-end user flows between Akash Network and NoCapCompute for reference and improvement.

---

## Table of Contents

1. [Akash Network User Flow](#akash-network-user-flow)
2. [NoCapCompute User Flow](#nocompute-user-flow)
3. [Side-by-Side Comparison](#side-by-side-comparison)
4. [What NoCapCompute Can Learn](#what-nocompute-can-learn)

---

## Akash Network User Flow

### Step 1: Provider Registration

```
Provider (GPU Owner)
    │
    ▼
Visit Akash Console or CLI
    │
    ▼
Create Provider Account
    │
    ▼
Set Pricing (CPU/RAM/GPU per hour)
    │
    ▼
Register Provider on Blockchain
    │
    ▼
Provider Appears in Marketplace
```

**Details:**
- Provider installs `akash-provider` software
- Configures hardware specs and pricing
- Submits `Provider` transaction on-chain
- Provider becomes visible in marketplace

---

### Step 2: User Browses Marketplace

```
User (Need GPU)
    │
    ▼
Visit console.akash.network
    │
    ▼
Connect Wallet (Keplr/Leap/Managed)
    │
    ▼
Browse Available Providers
    │
    ▼
Filter by: GPU, CPU, RAM, Price, Region
    │
    ▼
Select Provider
```

**Details:**
- User sees list of providers with specs and pricing
- Can compare providers side-by-side
- Real-time availability shown

---

### Step 3: User Creates Deployment

```
User
    │
    ▼
Select Provider
    │
    ▼
Upload Docker Image / SDL File
    │
    ▼
Set Resource Requirements
    │
    ▼
Review Cost Estimate
    │
    ▼
Submit Deployment Transaction
```

**Details:**
- User defines Docker container to run
- Specifies CPU, RAM, GPU, storage needs
- Akash calculates deposit required
- Transaction submitted to blockchain

---

### Step 4: Escrow & Fund Locking

```
User
    │
    ▼
Deposit AKT Tokens (or managed wallet)
    │
    ▼
Funds Locked in Escrow
    │
    ▼
Deployment Order Created
    │
    ▼
Provider Accepts Order
```

**Details:**
- User deposits enough AKT for deployment duration
- Funds held in on-chain escrow
- Provider must accept within timeout
- If no provider accepts, user gets refund

---

### Step 5: Provider Deploys Container

```
Provider
    │
    ▼
Accepts Deployment Order
    │
    ▼
Pulls Docker Image
    │
    ▼
Runs Container on GPU
    │
    ▼
Sends Deployment Active Status
    │
    ▼
User Can Access Service
```

**Details:**
- Provider pulls user's Docker image
- Runs container with requested resources
- Reports status back to blockchain
- User gets access URL/endpoint

---

### Step 6: Usage & Monitoring

```
User
    │
    ▼
Access Deployed Service
    │
    ▼
Monitor Usage & Logs
    │
    ▼
Funds Deducted Periodically from Escrow
    │
    ▼
Provider Gets Paid Continuously
```

**Details:**
- User uses the deployed application
- Funds deducted from escrow every block/period
- Provider receives payment automatically
- User can top-up escrow if needed

---

### Step 7: Release Funds / Close Deployment

```
User
    │
    ▼
Closes Deployment
    │
    ▼
Remaining Escrow Refunded to User
    │
    ▼
Provider Stops Container
    │
    ▼
Final Settlement on Blockchain
    │
    ▼
Transaction Complete
```

**Details:**
- User closes deployment when done
- Unused funds returned to user
- Provider receives final payment
- Container stopped and resources freed

---

## NoCapCompute User Flow

### Step 1: Provider Registration

```
Provider (GPU Owner)
    │
    ▼
Visit /provider/register
    │
    ▼
Connect Wallet (MetaMask / XDCPay)
    │
    ▼
Enter Hardware Specs
    │
    ▼
Stake XDC Tokens
    │
    ▼
Submit registerProvider() Transaction
    │
    ▼
Provider Added to GPURegistry
```

**Details:**
- Provider connects wallet
- Enters GPU model, CPU, RAM, VRAM
- Stakes minimum XDC as collateral
- Transaction recorded on XDC Apothem
- Backend indexer captures ProviderRegistered event

---

### Step 2: User Browses / Submits Job

```
User (Need GPU for ML)
    │
    ▼
Visit /wizard
    │
    ▼
Connect Wallet
    │
    ▼
Enter Job Specs:
    - Docker URI
    - CPU/RAM/VRAM
    - Duration (blocks)
    - Max price per block
    │
    ▼
Review Deposit Estimate
    │
    ▼
Submit submitJob() Transaction
```

**Details:**
- User configures ML training job
- System calculates total deposit
- Deposit = duration_blocks × max_price_per_block
- Job submitted to JobEscrow contract

---

### Step 3: Escrow & Fund Locking

```
User
    │
    ▼
Approve XDC Spend
    │
    ▼
Deposit Locked in JobEscrow
    │
    ▼
JobState = Pending
    │
    ▼
Event: JobSubmitted emitted
    │
    ▼
Backend Indexer Stores Job
```

**Details:**
- User approves JobEscrow to spend XDC
- Deposit locked in smart contract
- Job becomes available for providers
- Backend indexer captures JobSubmitted event

---

### Step 4: Provider Claims Job

```
Provider Daemon
    │
    ▼
Listens for JobSubmitted Events
    │
    ▼
Matches Job with Hardware Capabilities
    │
    ▼
Calls claimJob()
    │
    ▼
JobState = Active
    │
    ▼
Pulls Docker Image & Runs Container
```

**Details:**
- Provider daemon polls/listens blockchain
- Claims jobs matching available resources
- Backend indexer captures JobClaimed event
- Docker container started on provider machine

---

### Step 5: Heartbeats & Proof of Work

```
Provider Daemon
    │
    ▼
Runs Docker Container
    │
    ▼
Sends Heartbeat Every N Blocks
    │
    ▼
EIP-712 Signed Heartbeat
    │
    ▼
Backend Stores Heartbeat
    │
    ▼
User Monitors via /jobs/{id}
```

**Details:**
- Provider sends signed heartbeats
- Includes CPU/RAM/VRAM usage
- Backend stores heartbeats in DB
- Frontend shows real-time heartbeat chart

---

### Step 6: Job Completion & Results

```
Provider Daemon
    │
    ▼
Container Finishes Execution
    │
    ▼
Captures Docker Logs
    │
    ▼
Uploads Results to IPFS (Pinata/local)
    │
    ▼
Gets Result CID
    │
    ▼
Calls submitResults(resultCID)
```

**Details:**
- Container output captured
- Logs/results uploaded to IPFS
- CID submitted to blockchain
- Backend indexer captures ResultsSubmitted event

---

### Step 7: Receipt NFT Mint & Fund Release

```
JobEscrow Contract
    │
    ▼
Verifies Heartbeats & Results
    │
    ▼
JobState = Completed
    │
    ▼
Mints ProofReceipt NFT
    │
    ▼
Event: ReceiptMinted
    │
    ▼
Provider Gets Paid from Escrow
    │
    ▼
User Views Receipt at /receipts/{id}
```

**Details:**
- Contract verifies all heartbeats received
- Mints ERC-721 receipt NFT
- Provider receives payment
- User gets immutable proof of compute

---

## Side-by-Side Comparison

| Feature | Akash Network | NoCapCompute |
|---------|---------------|--------------|
| **Target Use Case** | General cloud compute | ML training with proof |
| **Blockchain** | Cosmos (Akash) | XDC Network |
| **Payment Token** | AKT | XDC |
| **Provider Registration** | On-chain provider tx | On-chain + stake |
| **User browses** | Marketplace listing | Direct job submission |
| **Job Spec** | SDL / Docker | Docker + resource specs |
| **Escrow** | Deposit AKT | Deposit XDC |
| **Provider Selection** | User chooses provider | Provider claims job |
| **Proof of Work** | ❌ None | ✅ EIP-712 heartbeats |
| **Receipt** | ❌ None | ✅ ProofReceipt NFT |
| **Fund Release** | Continuous per block | On job completion |
| **Refund** | On close/cancel | On cancel (pending only) |
| **Dispute/Slashing** | Limited | Challenge + slash bounty |

---

## What NoCapCompute Can Learn from Akash

### ✅ Adopt from Akash:

1. **Provider Marketplace UI**
   - Akash has excellent provider browsing/filtering
   - NoCapCompute can add `/providers` page with search/filter

2. **SDL-like Job Spec**
   - Akash uses SDL YAML for complex deployments
   - NoCapCompute could support multi-container jobs

3. **Continuous Payment**
   - Akash pays per block continuously
   - NoCapCompute currently pays only on completion

4. **Better Wallet UX**
   - Akash Console supports multiple wallets
   - NoCapCompute can add more wallet options

5. **Provider Dashboard**
   - Akash providers have rich dashboards
   - NoCapCompute `/provider/dashboard` can be enhanced

### ✅ NoCapCompute's Unique Advantages:

1. **ProofReceipt NFT** - Akash has no equivalent
2. **EIP-712 Heartbeats** - Cryptographic proof of execution
3. **XDC Fast Blocks** - 2s block time vs Akash's slower blocks
4. **ML Training Focus** - Purpose-built for researchers
5. **Grant Compliance** - Receipts suitable for NSF/NIH audits

---

## Recommended Improvements for NoCapCompute

| Priority | Improvement | Inspired By |
|----------|-------------|-------------|
| 🔴 High | Provider marketplace page | Akash Console |
| 🔴 High | Better job wizard UI | Akash deployment flow |
| 🟡 Medium | Continuous payment option | Akash per-block payments |
| 🟡 Medium | Multi-wallet support | Akash wallet integration |
| 🟢 Low | SDL/YAML job specs | Akash SDL |

---

## References

- Akash Console: https://github.com/akash-network/console
- Akash Network: https://akash.network
- Akash Docs: https://docs.akash.network

---

**Document created for reference. Not implementation spec.**
