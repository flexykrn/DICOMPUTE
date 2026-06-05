# DICOMPUTE — Complete Product Specification, Roadmap & Resource Guide

> **Purpose:** Single source of truth for DICOMPUTE — user flows, routes, competitive analysis, versioned roadmap, zero-cost resources, and credential requirements.

---

## Table of Contents

1. [Product Overview & Competitive Position](#1-product-overview--competitive-position)
2. [User Flow & Personas](#2-user-flow--personas)
3. [Website Routes & Feature Matrix](#3-website-routes--feature-matrix)
4. [API & Endpoint Specification](#4-api--endpoint-specification)
5. [Competitive Analysis: Akash vs DICOMPUTE](#5-competitive-analysis-akash-vs-dicompute)
6. [Versioned Roadmap (V1 → V4)](#6-versioned-roadmap-v1--v4)
7. [Zero-Cost Resource Stack](#7-zero-cost-resource-stack)
8. [What I Need From You (Credential Checklist)](#8-what-i-need-from-you-credential-checklist)
9. [One-Day Execution Plan (12 Hours)](#9-one-day-execution-plan-12-hours)
10. [Risk Mitigation & Fallbacks](#10-risk-mitigation--fallbacks)
11. [Appendix: Database Schema](#11-appendix-database-schema)

---

## 1. Product Overview & Competitive Position

**DICOMPUTE** is a decentralized GPU compute marketplace with an on-chain proof-of-training receipt layer settled on XDC. It differentiates from Akash/Render/io.net not on price, but on **verifiability** — every training job produces a cryptographically signed, on-chain receipt suitable for model provenance, compliance, and grant accountability.

### Core Value Proposition

| Feature | Why It Matters | Competitive Moat |
|---------|---------------|-------------------|
| **ProofReceipt NFT (ERC-721)** | Immutable proof of compute execution, duration, cost, and provider | No competitor has this |
| **EIP-712 Heartbeat Signatures** | Real-time cryptographic attestation that provider is actually running the job | No competitor has this |
| **Open Challenge + Slash Bounty** | Anyone can challenge a lazy provider — no KYC, no central authority | Economically self-enforcing |
| **On-Chain Reputation System** | Transparent, immutable provider history | Akash has none |
| **XDC Network (2s block time)** | Cheap, fast heartbeat verification | Ethereum mainnet too expensive |

### Honest Reality Check

> DICOMPUTE is **not** a better Akash overall. Akash is a 5-year-old production network with thousands of providers, CLI tools, SDKs, Kubernetes orchestration, and a mature marketplace. DICOMPUTE wins **only** in one niche: **auditable ML training** where researchers need cryptographic proof of compute for grant compliance. That niche is real, underserved, and defensible if executed correctly.

---

## 2. User Flow & Personas

### 2.1 Personas

| Persona | Goal | Primary Routes | Wallet Required |
|---------|------|----------------|---------------|
| **Job Submitter (User)** | Rent GPU/CPU for ML training, get verifiable receipt | `/jobs`, `/wizard`, `/receipts` | ✅ Yes |
| **Compute Provider** | Offer hardware, earn fees, maintain reputation | `/provider`, `/provider/dashboard`, `/provider/register` | ✅ Yes |
| **Challenger / Auditor** | Verify provider honesty, earn slash bounties | `/explorer`, `/jobs/:id` | ✅ Optional |
| **Visitor / Researcher** | Learn about DICOMPUTE, browse public receipts | `/`, `/docs`, `/explorer` | ❌ No |
| **Grant Funder / Compliance** | Audit training receipts for fund disbursement | `/explorer`, `/receipts/:id` | ❌ No |

### 2.2 Job Submitter Flow (Primary Revenue Path)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Landing   │────▶│  Job Wizard  │────▶│  Wallet Auth │────▶│  Job Submit  │
│     /       │     │   /wizard    │     │  (Wagmi/v2)  │     │  (on-chain)  │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
                                                                       ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Receipt    │◀────│   Job Done   │◀────│  Watch Job   │◀────│  Provider    │
│  /receipts  │     │  Notification│     │  /jobs/:id   │     │  Claims Job  │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

| Step | Screen | Action | On-Chain Tx | Off-Chain API |
|------|--------|--------|-------------|---------------|
| 1 | `/` | Visitor clicks "Launch Job" | — | `GET /api/health` |
| 2 | `/wizard` | Configure Docker URI, CPU/RAM/VRAM, duration, max price | — | `GET /api/providers/active` |
| 3 | `/wizard` | Price estimation fetched | — | `POST /api/quote` |
| 4 | `/connect` | Wallet connect (MetaMask / XDCPay) | — | `GET /api/chains/xdc` |
| 5 | `/wizard` | Approve ERC-20 / deposit XDC | `approve()` + `submitJob()` | `POST /api/jobs` (indexing) |
| 6 | `/jobs/:id` | Wait for provider claim | Listen `JobClaimed` event | `GET /api/jobs/:id/status` |
| 7 | `/jobs/:id` | Monitor heartbeats in real-time | Listen `HeartbeatReceived` | WebSocket `/ws/jobs/:id` (V2) or polling (V1) |
| 8 | `/jobs/:id` | Job completes, results ready | Listen `JobCompleted` | `GET /api/ipfs/:cid` |
| 9 | `/receipts/:id` | View & download ProofReceipt NFT | `ownerOf()` query | `GET /api/receipts/:id` |
| 10 | `/receipts/:id` | Share/verify receipt publicly | — | `GET /api/receipts/:id/verify` |

### 2.3 Compute Provider Flow

| Step | Screen | Action | On-Chain Tx | Off-Chain (Daemon) |
|------|--------|--------|-------------|-------------------|
| 1 | `/provider` | Read requirements, download daemon | — | `GET /api/releases` |
| 2 | `/provider/register` | Fill metadata (GPU model, region, etc.) | — | `POST /api/providers/pre-register` |
| 3 | `/provider/register` | Submit stake + register | `registerProvider()` | — |
| 4 | `/provider/dashboard` | Daemon running, status "Healthy" | — | Daemon WebSocket `/ws/daemon` (V2) |
| 5 | Auto | Poll/listen for `JobSubmitted` events | Event listener | `GET /api/jobs/pending` |
| 6 | `/provider/dashboard` | Claim job (manual or auto-bid) | `claimJob()` | `POST /api/jobs/:id/claim` |
| 7 | Daemon | Pull Docker image, enforce cgroups | — | Docker Engine API |
| 8 | Daemon | Sign & broadcast heartbeat every N blocks | `submitHeartbeat()` | EIP-712 signing |
| 9 | Daemon | Upload results to IPFS, submit CID | `submitResults()` | IPFS node/client (V2) |
| 10 | `/provider/dashboard` | View earnings, reputation score, history | `getReputation()` | `GET /api/providers/me/stats` |

### 2.4 Challenger / Auditor Flow

| Step | Screen | Action | On-Chain Tx | Notes |
|------|--------|--------|-------------|-------|
| 1 | `/explorer` | Browse all jobs (pending/active/completed/slashed) | — | Filterable, sortable table |
| 2 | `/jobs/:id` | View job details + heartbeat history | `getJob()` | Graph of heartbeat intervals |
| 3 | `/jobs/:id` | Check `lastHeartbeatBlock` vs current | `MAX_BLOCK_TIMEOUT` | UI shows "Challenge Open" if stale |
| 4 | `/jobs/:id` | Click "Challenge Provider" | `challengeProvider()` | Requires active wallet + gas |
| 5 | `/jobs/:id` | View slash result, bounty earned | Event listener | Challenger gets 20% of stake |

### 2.5 Grant Funder / Compliance Flow

| Step | Screen | Action | On-Chain Query | Off-Chain |
|------|--------|--------|----------------|-----------|
| 1 | `/receipts/:id` | View receipt metadata (job, provider, cost, CID) | `receipts(tokenId)` | IPFS preview |
| 2 | `/receipts/:id` | Verify NFT ownership and chain of custody | `ownerOf()` | `GET /api/receipts/:id/verify` |
| 3 | `/receipts/:id` | Cross-reference provider reputation | `getReputation()` | `GET /api/providers/:addr` |
| 4 | `/receipts/:id` | Download full audit PDF/JSON (V2+) | — | `GET /api/receipts/:id/audit` |

---

## 3. Website Routes & Feature Matrix

### 3.1 Public Routes (No Wallet Required)

| Route | Purpose | Key Components | Data Source | V1 | V2 | V3 | V4 |
|-------|---------|---------------|-------------|----|----|----|----|
| `/` | Landing page | Hero, feature grid, CTA, live stats | `GET /api/stats` | ✅ | ✅ | ✅ | ✅ |
| `/about` | Project info, team, architecture | Diagrams, whitepaper link | Static | ✅ | ✅ | ✅ | ✅ |
| `/docs` | Documentation (MDX) | Quick start, API reference, SDL | Static / GitHub | ✅ | ✅ | ✅ | ✅ |
| `/explorer` | Public job explorer | Table: jobs, providers, receipts | `GET /api/jobs`, `GET /api/providers` | ✅ | ✅ | ✅ | ✅ |
| `/providers` | Provider directory | Cards with GPU specs, reputation, pricing | `GET /api/providers/active` | ✅ | ✅ | ✅ | ✅ |
| `/pricing` | Cost estimator | Interactive calculator vs AWS/GCP | `POST /api/quote` | ✅ | ✅ | ✅ | ✅ |
| `/receipts` | Public receipt gallery | Grid of ProofReceipt NFTs | `GET /api/receipts` | ✅ | ✅ | ✅ | ✅ |
| `/receipts/:tokenId` | Individual receipt detail | Metadata, verification badge, IPFS preview | `GET /api/receipts/:id`, on-chain | ✅ | ✅ | ✅ | ✅ |
| `/download` | Daemon download page | OS binaries, Docker image, setup guide | `GET /api/releases` | ✅ | ✅ | ✅ | ✅ |

### 3.2 User Dashboard Routes (Wallet-Connected)

| Route | Purpose | Key Components | On-Chain Reads | V1 | V2 | V3 | V4 |
|-------|---------|---------------|----------------|----|----|----|----|
| `/dashboard` | User overview | My jobs, receipts, spend, notifications | `getJobCount()`, `balanceOf()` | ✅ | ✅ | ✅ | ✅ |
| `/jobs` | My job history | List: pending, active, completed, cancelled | Filtered `jobs[]` mapping | ✅ | ✅ | ✅ | ✅ |
| `/jobs/:id` | Job detail + monitoring | Status, heartbeats graph, results, challenge button | `getJob()`, events | ✅ | ✅ | ✅ | ✅ |
| `/wizard` | Submit new job | Stepper: config → preview → confirm → submit | `submitJob()` tx | ✅ | ✅ | ✅ | ✅ |
| `/receipts` | My receipts | Owned ProofReceipt NFTs gallery | `ownerOf()` loop | ✅ | ✅ | ✅ | ✅ |
| `/receipts/:id` | Receipt detail | Same as public but with download CTA | On-chain + IPFS | ✅ | ✅ | ✅ | ✅ |
| `/settings` | Profile, wallet, notifications | ENS/avatar, email for alerts, API keys | — | ✅ | ✅ | ✅ | ✅ |

### 3.3 Provider Dashboard Routes (Wallet-Connected + Registered)

| Route | Purpose | Key Components | On-Chain Reads | V1 | V2 | V3 | V4 |
|-------|---------|---------------|----------------|----|----|----|----|
| `/provider` | Provider landing | Benefits, hardware requirements, earnings calculator | Static | ✅ | ✅ | ✅ | ✅ |
| `/provider/register` | Onboarding form | Metadata URI, stake amount, TOS | `registerProvider()` | ✅ | ✅ | ✅ | ✅ |
| `/provider/dashboard` | Provider control panel | Status, active jobs, earnings, reputation graph, daemon logs | `getProvider()`, `getReputation()` | ✅ | ✅ | ✅ | ✅ |
| `/provider/jobs` | Job management | Available → Claimed → Active → Completed | `getPendingJobs()` | ✅ | ✅ | ✅ | ✅ |
| `/provider/jobs/:id` | Running job detail | Container logs, resource usage, heartbeat status | Daemon WS + Docker | — | ✅ | ✅ | ✅ |
| `/provider/stats` | Analytics | Revenue, uptime %, job completion rate, reputation history | `GET /api/providers/me/stats` | — | ✅ | ✅ | ✅ |
| `/provider/settings` | Provider config | Metadata update, stake top-up, withdrawal | `addStake()`, `unregisterProvider()` | — | ✅ | ✅ | ✅ |

### 3.4 Feature Availability by Route (V1-V4)

#### V1 Feature Map

| Feature | `/` | `/explorer` | `/providers` | `/pricing` | `/receipts` | `/docs` |
|---------|-----|-------------|--------------|------------|-------------|---------|
| Live network stats ticker | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Job explorer (filterable) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Provider directory cards | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Price calculator | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Receipt gallery + verify | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Documentation search | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Wallet connect CTA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

| Feature | `/dashboard` | `/jobs` | `/jobs/:id` | `/wizard` | `/receipts` | `/settings` |
|---------|--------------|---------|-------------|-----------|-------------|-------------|
| Job list (all statuses) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Submit new job wizard | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Real-time job monitoring | ❌ | ❌ | ✅ (polling) | ❌ | ❌ | ❌ |
| Heartbeat graph (per job) | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Challenge provider button | ❌ | ❌ | ❌ (hidden) | ❌ | ❌ | ❌ |
| ProofReceipt NFT gallery | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Receipt verification | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Download audit JSON | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Spending analytics | ✅ (mock) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Wallet/notification settings | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

| Feature | `/provider` | `/provider/register` | `/provider/dashboard` | `/provider/jobs` | `/provider/stats` | `/provider/settings` |
|---------|-------------|----------------------|----------------------|------------------|-------------------|----------------------|
| Onboarding info | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Stake + register form | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Daemon download links | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Daemon status (online/offline) | ❌ | ❌ | ✅ (mock) | ❌ | ❌ | ❌ |
| Active job list | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Container log viewer | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Resource usage real-time | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Earnings + payout history | ❌ | ❌ | ✅ (mock) | ❌ | ❌ | ❌ |
| Reputation score + history | ❌ | ❌ | ✅ (mock) | ❌ | ❌ | ❌ |
| Stake top-up / withdraw | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Metadata update | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Auto-bid / manual claim toggle | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. API & Endpoint Specification

### 4.1 Jobs API

| Method | Endpoint | Auth | Description | Contract Mapping | V1 | V2 | V3 | V4 |
|--------|----------|------|-------------|------------------|----|----|----|----|
| `GET` | `/api/jobs` | Public | List all jobs (paginated, filterable) | `jobs[]` + `getPendingJobs()` | ✅ | ✅ | ✅ | ✅ |
| `GET` | `/api/jobs/:id` | Public | Job detail + heartbeat history | `getJob()` + heartbeat table | ✅ | ✅ | ✅ | ✅ |
| `POST` | `/api/jobs` | Wallet sig | Index newly submitted job (post-tx) | `JobSubmitted` event | ✅ | ✅ | ✅ | ✅ |
| `POST` | `/api/jobs/:id/claim` | Provider sig | Index job claim (post-tx) | `JobClaimed` event | ✅ | ✅ | ✅ | ✅ |
| `POST` | `/api/jobs/:id/heartbeat` | Provider sig | Index heartbeat (post-tx) | `HeartbeatReceived` event | ✅ | ✅ | ✅ | ✅ |
| `POST` | `/api/jobs/:id/complete` | Provider sig | Index completion (post-tx) | `JobCompleted` event | ✅ | ✅ | ✅ | ✅ |
| `POST` | `/api/jobs/:id/challenge` | Any sig | Index challenge (post-tx) | `ProviderSlashed` event | ❌ | ❌ | ✅ | ✅ |
| `DELETE` | `/api/jobs/:id` | User sig | Index cancellation | `JobCancelled` event | ✅ | ✅ | ✅ | ✅ |
| `POST` | `/api/jobs/:id/bid` | Provider sig | Place bid on job (reverse auction) | Custom contract | ❌ | ❌ | ✅ | ✅ |
| `POST` | `/api/jobs/:id/accept-bid` | User sig | Accept lowest bid | Custom contract | ❌ | ❌ | ✅ | ✅ |

### 4.2 Providers API

| Method | Endpoint | Auth | Description | Contract Mapping | V1 | V2 | V3 | V4 |
|--------|----------|------|-------------|------------------|----|----|----|----|
| `GET` | `/api/providers` | Public | List all providers | `getAllProviders()` | ✅ | ✅ | ✅ | ✅ |
| `GET` | `/api/providers/active` | Public | Active (non-slashed) providers | `getActiveProviders()` | ✅ | ✅ | ✅ | ✅ |
| `GET` | `/api/providers/:address` | Public | Provider detail + reputation | `getProvider()` + `getReputation()` | ✅ | ✅ | ✅ | ✅ |
| `POST` | `/api/providers` | Wallet sig | Index new provider | `ProviderRegistered` event | ✅ | ✅ | ✅ | ✅ |
| `GET` | `/api/providers/me/stats` | JWT / Sig | Authenticated provider stats | Aggregated SQL query | ❌ | ✅ | ✅ | ✅ |
| `PATCH` | `/api/providers/:address` | Provider sig | Update metadata off-chain | — | ❌ | ✅ | ✅ | ✅ |
| `GET` | `/api/providers/leaderboard` | Public | Reputation ranking | Aggregated query | ❌ | ❌ | ✅ | ✅ |

### 4.3 Receipts API

| Method | Endpoint | Auth | Description | Contract Mapping | V1 | V2 | V3 | V4 |
|--------|----------|------|-------------|------------------|----|----|----|----|
| `GET` | `/api/receipts` | Public | List all receipts | `ReceiptMinted` events | ✅ | ✅ | ✅ | ✅ |
| `GET` | `/api/receipts/:tokenId` | Public | Receipt detail | `receipts(tokenId)` | ✅ | ✅ | ✅ | ✅ |
| `GET` | `/api/receipts/:tokenId/verify` | Public | Full verification chain | Multi-call validation | ✅ | ✅ | ✅ | ✅ |
| `GET` | `/api/receipts/:tokenId/audit` | Public | Audit PDF/JSON export | Aggregated report | ❌ | ✅ | ✅ | ✅ |
| `GET` | `/api/receipts/:tokenId/compliance` | Public | Compliance template (NSF/NIH/EU) | — | ❌ | ❌ | ❌ | ✅ |

### 4.4 Quotes & Pricing API

| Method | Endpoint | Auth | Description | V1 | V2 | V3 | V4 |
|--------|----------|------|-------------|----|----|----|----|
| `POST` | `/api/quote` | Public | Price estimate based on spec + duration | ✅ | ✅ | ✅ | ✅ |
| `GET` | `/api/stats` | Public | Network stats: total jobs, providers, XDC volume, avg cost | ✅ | ✅ | ✅ | ✅ |
| `GET` | `/api/market-price` | Public | Current market price per compute unit (reverse auction) | ❌ | ❌ | ✅ | ✅ |

### 4.5 IPFS / Storage API

| Method | Endpoint | Auth | Description | V1 | V2 | V3 | V4 |
|--------|----------|------|-------------|----|----|----|----|
| `POST` | `/api/ipfs/upload` | Provider | Upload result bundle to IPFS/Filecoin | ❌ (mock) | ✅ | ✅ | ✅ |
| `GET` | `/api/ipfs/:cid` | Public | Retrieve/preview IPFS content | ❌ (mock) | ✅ | ✅ | ✅ |
| `POST` | `/api/ipfs/dataset` | User | Upload dataset for job mounting | ❌ | ❌ | ✅ | ✅ |
| `POST` | `/api/ipfs/checkpoint` | Provider | Save model checkpoint during training | ❌ | ❌ | ✅ | ✅ |

### 4.6 WebSocket Endpoints

| Endpoint | Auth | Description | V1 | V2 | V3 | V4 |
|----------|------|-------------|----|----|----|----|
| `/ws/jobs/:id` | Public | Real-time job status + heartbeat stream | ❌ (polling) | ✅ | ✅ | ✅ |
| `/ws/daemon` | Provider JWT | Daemon → backend heartbeat + log streaming | ❌ | ✅ | ✅ | ✅ |
| `/ws/explorer` | Public | Live network activity feed | ❌ | ❌ | ✅ | ✅ |
| `/ws/provider/:address` | Provider | Provider-specific job notifications | ❌ | ❌ | ✅ | ✅ |

---

## 5. Competitive Analysis: Akash vs DICOMPUTE

### 5.1 Feature Comparison Matrix

| Feature | DICOMPUTE (Plan) | Akash Network | Render | io.net | Lilypad |
|---------|-----------------|---------------|--------|--------|---------|
| **Chain** | XDC (EVM) | Cosmos (Akash) | N/A (custodial) | Solana | Ethereum/Arbitrum |
| **Market Model** | Direct claim + escrow (V1) → Reverse auction (V3) | Reverse auction (bids) | Fixed pricing | Fixed pricing | Fixed pricing |
| **Receipt / Proof** | ✅ On-chain NFT (ERC-721) | ❌ None | ❌ Invoice only | ❌ None | ❌ None |
| **Heartbeat Verification** | ✅ EIP-712 signed | ❌ None | ❌ None | ❌ None | ❌ Bacalhau proofs |
| **Challenge / Slash** | ✅ Open challenge + bounty | ❌ None | ❌ KYC recourse | ❌ None | ❌ Mediation |
| **Reputation System** | ✅ On-chain score | ❌ None | ❌ Star rating | ❌ None | ✅ (implied) |
| **GPU Support** | ✅ Targeted | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Container Orchestration** | Docker (daemon) | Kubernetes | Proprietary | Proprietary | Bacalhau |
| **Deployment Format** | Docker URI + spec (V1) → SDL-like (V4) | SDL (YAML) | Template | Template | Docker + spec |
| **Payment Token** | XDC / ERC-20 (V4) | AKT / ACT | Fiat / RNDR | USDC / IO | ETH / LP |
| **Block Time** | ~2s | ~6s | N/A | ~400ms | ~12s |
| **Escrow** | ✅ Native in contract | ✅ Native (module) | ❌ Pre-pay | ❌ Pre-pay | ✅ Yes |
| **IPFS / Result Storage** | ✅ Planned (V2) | ✅ Yes | ❌ Centralized | ❌ Centralized | ✅ IPFS |
| **Web Dashboard** | ✅ Next.js (planned) | ✅ Console + Air | ✅ Yes | ✅ Yes | ✅ Yes |
| **CLI** | ❌ V3+ | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **SDK** | ❌ V3+ | ✅ Go + TS | ❌ Limited | ✅ Yes | ✅ Yes |
| **Provider Console** | ✅ Web dashboard | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Pricing Flexibility** | Fixed max price (V1) → Auction (V3) | Reverse auction | Fixed tiers | Fixed | Fixed |
| **Focus** | Verifiable ML training | General cloud | GPU rendering | GPU clusters | General compute |
| **Enterprise SSO** | ❌ V4 | ❌ | ✅ | ✅ | ❌ |
| **Compliance Templates** | ✅ V4 (NSF/NIH/EU) | ❌ | ❌ | ❌ | ❌ |
| **Mobile App** | ❌ V4+ | ❌ | ❌ | ✅ | ❌ |
| **Token / Governance** | ❌ V4 ($DCP + DAO) | ✅ AKT + governance | ✅ RNDR | ✅ IO | ✅ LP |

### 5.2 What Akash Does That DICOMPUTE Doesn't (Yet)

| Akash Feature | Gap in DICOMPUTE | Priority | Effort | Version |
|---------------|-----------------|----------|--------|---------|
| **Reverse auction** (providers bid down) | DICOMPUTE uses fixed max price with direct claim | Medium | High | V3 |
| **SDL / YAML deployments** | DICOMPUTE uses simple Docker URI + sliders | Low | Medium | V4 |
| **Multi-container services** | DICOMPUTE only supports single container per job | Medium | High | V4 |
| **Persistent storage / volumes** | DICOMPUTE has no storage layer spec | High | High | V3 |
| **Private container registries** | DICOMPUTE assumes public Docker Hub | Medium | Medium | V3 |
| **CLI tool** | DICOMPUTE has no CLI for power users | Medium | High | V3 |
| **SDK (Go/TS)** | DICOMPUTE has no programmatic SDK | Low | High | V4 |
| **AuthZ / Delegated permissions** | DICOMPUTE has no multi-user/team support | Low | Medium | V4 |
| **Provider Playbook / K8s** | DICOMPUTE uses raw Docker daemon | N/A — different model | — | V3 |
| **Global provider network** | DICOMPUTE is new, needs provider acquisition | Critical | Ongoing | V3+ |
| **Fiat on-ramp** | DICOMPUTE requires crypto wallet | Medium | Medium | V4 |
| **Insurance / SLA** | DICOMPUTE is best-effort | Low | High | V4+ |

### 5.3 What DICOMPUTE Does That Akash Doesn't

| DICOMPUTE Feature | Competitive Moat | Replicability | Version |
|-------------------|-------------------|---------------|---------|
| **ProofReceipt NFT** | Unique verifiable training artifact | Medium — Akash could add receipts | V1 |
| **EIP-712 heartbeat signatures** | Live cryptographic attestation of execution | Medium — can be forked | V1 |
| **Open challenge + slash bounty** | Decentralized fraud detection without KYC | High — game theory is hard to replicate | V1 |
| **Reputation score on-chain** | Transparent provider history | Low — easy to add | V1 |
| **XDC-specific (2s block time)** | Cheap, fast heartbeat verification | Low — chain choice is strategy | V1 |
| **ML training focus** | Tailored UX for GPU training jobs | Medium — vertical specialization | V1 |
| **Compliance templates (NSF/NIH/EU)** | Grant-ready receipt formats | Medium — requires domain expertise | V4 |
| **Audit PDF export** | Official proof of compute | Low — easy to add | V2 |

---

## 6. Versioned Roadmap (V1 → V4)

### V1 — Hackathon MVP (6 Hours)

> **Goal:** Demo the happy path once. Submit job → heartbeat → receipt NFT. Nothing more, nothing less.

#### Included in V1
- **Smart Contracts:** Deploy `JobEscrow`, `GPURegistry`, `ReputationSystem`, `ProofReceipt` to XDC Apothem (or Anvil fallback)
- **Frontend:** Next.js 14 with `/` (landing), `/wizard` (job submit), `/jobs/[id]` (status + heartbeat chart), `/receipts/[id]` (NFT display), `/explorer` (public list)
- **Wallet:** Wagmi v2 + RainbowKit with XDC Apothem config
- **Backend:** FastAPI + SQLite — `POST /api/jobs/{id}/heartbeat`, `GET /api/jobs/{id}/heartbeats`, `GET /api/jobs`, `GET /api/stats`
- **Mock Provider:** Python script polling `JobSubmitted` events, claiming jobs, sending 6 signed heartbeats, completing with mock CID
- **Polling:** 5-second polling on frontend (no WebSocket) for heartbeat updates
- **Demo Assets:** Pre-filled demo button, 90-second backup video, 5-slide pitch deck

#### Excluded from V1 (Moves to V2)

| Feature | Why Excluded | V2 Owner |
|---------|-------------|----------|
| **Real Go daemon** | Too complex for 6 hours; Python script proves concept | DevOps |
| **PostgreSQL** | SQLite is zero-config; schema migration overhead | Backend |
| **Real Docker execution** | Judges can't see containers; mock logs are enough | DevOps |
| **Slashing UI / challenge button** | Risky in live demo; keep in contract but hidden | Frontend |
| **WebSocket real-time** | Polling is reliable enough; WebSocket adds failure surface | Backend |
| **Real IPFS upload** | Mock CID with metadata; real storage in V2 | Backend |
| **Provider registration dashboard** | Pre-register one mock provider for demo | Frontend |
| **Provider auto-claim / matching** | Manual claim only; auto-bidding in V3 | Backend |
| **Foundry test suite** | One happy-path test is enough; full coverage in V2 | SC Lead |
| **IComputeMarketplace interface** | Tight coupling is fine for MVP; refactor in V2 | SC Lead |
| **Multi-chain support** | XDC Apothem only; mainnet bridge in V4 | SC Lead |
| **CLI / SDK** | Web-only for hackathon; CLI in V3 | Backend |
| **Audit PDF export** | JSON download is enough; styled PDF in V3 | Frontend |
| **Notification system** | Demo is synchronous; email/Discord alerts in V3 | Backend |
| **ENS / avatar support** | Wallet address display only; profile features in V3 | Frontend |

#### V1 Acceptance Criteria
- [ ] User can submit a job from `/wizard` and see it on-chain
- [ ] Mock provider claims the job within 30 seconds
- [ ] Heartbeat chart populates with 6 data points over 30 seconds
- [ ] Job status changes to "Completed" and receipt button appears
- [ ] Receipt page shows job details, provider, cost, and verify link
- [ ] Verify link opens Apothem explorer with correct token ID
- [ ] Explorer page shows list of all jobs (at least the demo one)
- [ ] Landing page loads in under 3 seconds
- [ ] Demo works end-to-end without manual intervention

---

### V2 — Closed Alpha (1 Week After Hackathon)

> **Goal:** The team can run real training jobs internally. Move from demo to dogfood.

#### New in V2
- **PostgreSQL:** Migrate SQLite → PostgreSQL (async SQLAlchemy + Alembic)
- **Event Indexer:** Background async task listening to all contract events
- **WebSocket:** `/ws/jobs/{id}` replacing polling for real-time heartbeat streaming
- **Real Docker Provider:** Python script with Docker SDK, cgroup enforcement, real PyTorch container
- **Provider Dashboard:** `/provider/dashboard` with stats, earnings, active jobs
- **Provider Registration:** `/provider/register` with metadata form + stake input
- **IPFS Integration:** Pinata or Web3.Storage API for real result uploads
- **Foundry Tests:** Comprehensive test suite + `IComputeMarketplace.sol` interface extraction
- **CI/CD:** GitHub Actions + staging environment (Vercel + Railway/Render)
- **Receipt Audit:** JSON download with full verification chain
- **Job Cancellation:** Cancel button for Pending jobs with refund
- **Reputation Display:** Provider score badge on job detail and cards
- **Error Handling:** Toast notifications (Sonner), loading states, retry logic

#### Excluded from V2 (Moves to V3)

| Feature | Why Excluded | V3 Owner |
|---------|-------------|----------|
| **Go daemon** | Python script is functional; Go rewrite for performance | DevOps |
| **Multi-container deployments** | Single container is fine for alpha; SDL-like support in V4 | Backend |
| **Persistent volumes / datasets** | Jobs are stateless; mount support in V3 | DevOps |
| **Auto-bidding / reverse auction** | Fixed price + manual claim; auction in V3 | Backend |
| **Slashing UI** | Still hidden; challenge flow for external providers in V3 | Frontend |
| **External provider onboarding** | Team-only providers; open registration in V3 | Frontend |
| **Payment in stablecoins (ERC-20)** | Native XDC only; USDC/XDCe in V4 | SC Lead |
| **Explorer advanced filters** | Basic list; faceted search in V3 | Frontend |
| **Audit PDF export** | JSON download is fine; styled reports in V3 | Frontend |
| **Notifications (email/Discord)** | Not critical for alpha; alerting in V3 | Backend |

#### V2 Acceptance Criteria
- [ ] Team member can submit a real PyTorch job from the wizard
- [ ] Provider script runs on a team member's laptop with real Docker
- [ ] Job runs actual training code (e.g., MNIST) and produces a real result file
- [ ] Result file is uploaded to IPFS and CID is stored on-chain
- [ ] Heartbeat chart updates in real-time via WebSocket (no polling)
- [ ] Provider dashboard shows earnings, reputation, and job history
- [ ] Job cancellation works: user gets refund, job removed from pending
- [ ] All contracts have passing Foundry tests
- [ ] Staging environment is live and accessible to team
- [ ] README includes setup instructions for new team members

#### V2 → V3 Handoff Requirements
- [ ] PostgreSQL schema is stable (no breaking migrations expected)
- [ ] Contract interface is finalized (no function signature changes)
- [ ] Backend API is documented (OpenAPI / Swagger)
- [ ] Frontend component library is consistent (Shadcn variants locked)
- [ ] Docker provider script is documented and reproducible

---

### V3 — Provider Beta (2–3 Weeks After V2)

> **Goal:** External GPU owners join the network. Marketplace is live with real providers and real users.

#### New in V3
- **Go Daemon:** Replaces Python script. Cobra CLI, Docker Engine API, EIP-712 signer, heartbeat broadcaster, event watcher, IPFS uploader
- **Reverse Auction:** Providers bid on jobs, user accepts lowest bid
- **Job Matching Engine:** Auto-assign job to best provider based on reputation + price
- **Challenge / Slashing UI:** Challenge button visible when heartbeat timeout exceeded
- **Provider Onboarding:** External provider registration, onboarding guide, daemon download
- **Provider Reputation Leaderboard:** `/providers` page with ranking and filtering
- **Job Templates:** Pre-configured wizards for PyTorch, TensorFlow, LLM fine-tuning
- **Dataset Mounting:** Upload dataset to IPFS, mount into job container
- **Checkpoint Saving:** Save model checkpoints to IPFS during long training runs
- **Job Log Viewer:** Real-time container log viewer via WebSocket
- **Auto-Claim / Manual Toggle:** Provider preference for job claiming
- **Redis Caching:** Provider list, job stats, reputation scores
- **API Keys:** Programmatic access for power users
- **Webhook System:** Send job events to external URLs
- **Cross-Platform Builds:** Linux, macOS, Windows binaries via GitHub Actions
- **Systemd Service:** Linux providers run daemon as background service

#### Excluded from V3 (Moves to V4)

| Feature | Why Excluded | V4 Owner |
|---------|-------------|----------|
| **Stablecoins (USDC/XDCe)** | Native XDC is sufficient; stablecoin adds complexity | SC Lead |
| **Multi-chain deployment** | XDC ecosystem focus; cross-chain in V4 | SC Lead |
| **ZK-proof of training** | Research-phase feature; too complex for beta | Research |
| **Fiat on-ramp (credit card)** | Crypto-native users only; fiat in V4 | Backend |
| **Enterprise SSO / teams** | Individual wallets only; org accounts in V4 | Backend |
| **SLA guarantees / insurance** | Marketplace is best-effort; insurance layer in V4 | Product |
| **Mobile app** | Responsive web is sufficient; native app in V4 | Mobile |
| **DAO governance** | Team controls parameters; governance in V4 | SC Lead |
| **Formal security audit** | Internal tests + bug bounty; formal audit in V4 | Security |

#### V3 Acceptance Criteria
- [ ] External provider can register, download daemon, and run jobs within 30 minutes
- [ ] Marketplace has >5 active providers with real GPU hardware
- [ ] >100 jobs completed successfully in a 7-day period
- [ ] Reverse auction produces prices 20% below fixed max price
- [ ] Challenge mechanism is used at least once (by team or user) and works correctly
- [ ] Provider reputation leaderboard shows meaningful differentiation
- [ ] Job templates reduce wizard setup time by 50%
- [ ] No critical bugs or security issues in 14 days of beta
- [ ] Daemon runs stable for 7 days without restart (memory leak test)
- [ ] Support channel (Discord/Telegram) responds to provider issues within 4 hours

#### V3 → V4 Handoff Requirements
- [ ] Go daemon is stable and cross-platform
- [ ] Marketplace has organic supply (providers not on team payroll)
- [ ] Contract upgrade path is documented (proxy pattern or migration)
- [ ] Revenue model is clear: take rate, staking, or subscription
- [ ] Legal entity formed for enterprise contracts

---

### V4 — Production v1.0 (1–2 Months After V3)

> **Goal:** Grant funders, enterprises, and compliance auditors use DICOMPUTE receipts as standard proof. Platform is self-sustaining.

#### New in V4

##### Enterprise & Compliance
- **Audit PDF Export:** Styled PDF with official letterhead, signatures, chain verification
- **Receipt Verification API:** Third-party verification service for grant portals
- **Enterprise Dashboard:** Multi-user team accounts with role-based access
- **SSO Integration:** Google Workspace, Okta, SAML
- **Compliance Templates:** NSF, NIH, EU Horizon, Wellcome Trust receipt formats
- **Audit Trail:** Immutable log of all receipt verifications with timestamps
- **Data Residency Controls:** Job runs in specific geographic regions
- **SLA Dashboard:** Uptime guarantees, penalty tracking, insurance claims

##### Payments & Tokenomics
- **ERC-20 Stablecoin Support:** USDC, USDT, XDCe payment in escrow
- **$DCP Token Launch:** Utility token for staking, discounts, governance
- **Staking Rewards:** Providers earn $DCP for high reputation + uptime
- **Revenue Sharing:** Platform fee (5-10%) split between treasury, stakers, and burn
- **Fiat On-Ramp:** MoonPay or Stripe integration for credit card → XDC
- **Subscription Plans:** Monthly compute credits for power users
- **Referral Program:** On-chain referral tracking with $DCP rewards

##### Advanced Compute
- **Multi-Container Deployments:** Docker Compose-style job specs
- **Persistent Volumes:** Attach IPFS-mounted datasets and save checkpoints
- **Distributed Training:** Multi-node jobs with MPI/NCCL communication
- **Inference Endpoints:** Deploy trained models as persistent API services
- **Serverless Functions:** Lightweight compute without container startup time
- **Private Container Registries:** Support for authenticated Docker pulls
- **Custom VM Images:** Provider-defined base images (not just Docker Hub)

##### Network & Governance
- **Multi-Chain Deployment:** Polygon, Arbitrum, Base for lower gas fees
- **Bridge:** Cross-chain receipt verification and job migration
- **DAO Governance:** $DCP holders vote on protocol parameters, fee changes, upgrades
- **Treasury Management:** On-chain treasury for grants, ecosystem development
- **Bug Bounty Program:** Immunefi or Sherlock integration for security
- **Formal Audit:** Trail of Bits, OpenZeppelin, or CertiK audit of all contracts
- **Insurance Layer:** Nexus Mutual or similar for provider default coverage

##### Mobile & SDK
- **React Native App:** Submit jobs, monitor progress, receive receipts on mobile
- **Python SDK:** `pip install dicompute` for programmatic job submission
- **JavaScript/TypeScript SDK:** `npm install @dicompute/sdk` for web apps
- **Go SDK:** `go get github.com/dicompute/sdk` for backend integrations
- **CLI v2:** `dicompute jobs submit`, `dicompute providers list`, `dicompute receipts verify`
- **Jupyter Extension:** Submit training jobs directly from notebook cells
- **Hugging Face Integration:** One-click training from model cards

##### Infrastructure
- **Global CDN:** Cloudflare or Fastly for frontend assets and API edge caching
- **Kubernetes:** Backend runs on EKS/GKE with auto-scaling
- **Dedicated RPC Nodes:** Self-hosted XDC nodes for reliability (not just public RPC)
- **Monitoring:** Datadog or Grafana for uptime, latency, error tracking
- **Disaster Recovery:** Automated backups, region failover, contract pause mechanism
- **Rate Limiting v2:** DDoS protection, sybil resistance, provider reputation gating

#### V4 Excluded (Future Versions)

| Feature | Why Excluded | Future Version |
|---------|-------------|----------------|
| **Decentralized sequencer (L2)** | XDC throughput is sufficient; L2 if scale demands | V5 |
| **Hardware enclaves (TEE)** | Intel SGX/AMD SEV for verified execution | V5 |
| **Federated learning** | Privacy-preserving distributed training | V5 |
| **Quantum-resistant signatures** | Post-quantum cryptography research | V5 |
| **Physical GPU marketplace** | Buy/sell GPU hardware, not just compute | V5 |
| **Carbon offset integration** | Green compute credits per job | V5 |

#### V4 Acceptance Criteria
- [ ] Platform processes >10,000 jobs per month with 99.9% uptime
- [ ] >50 external providers with sustained engagement
- [ ] Revenue covers infrastructure costs + team salaries
- [ ] Grant funders (e.g., academic institutions) reference DICOMPUTE receipts in official reports
- [ ] Security audit completed with no critical findings
- [ ] DAO governance proposal successfully passes and executes on-chain
- [ ] Mobile app has >1,000 downloads with 4+ star rating
- [ ] SDK used by >10 external projects
- [ ] Platform is cash-flow positive or within 6 months of profitability
- [ ] Brand recognition: mentioned in 3+ major tech/crypto publications

---

### Cross-Version Dependency Graph

```
V1 (Hackathon MVP)
├── Smart contracts deployed
├── Frontend shell + wizard + receipt
├── Python mock provider
└── SQLite backend
    │
    ▼
V2 (Closed Alpha)
├── PostgreSQL + event indexer
├── WebSocket real-time
├── Real Docker in Python provider
├── Provider dashboard
├── Foundry tests + IComputeMarketplace interface
└── CI/CD + staging environment
    │
    ▼
V3 (Provider Beta)
├── Go daemon replaces Python
├── Reverse auction marketplace
├── Challenge/slashing UI
├── Job templates + datasets
├── Provider onboarding + reputation
└── Redis + API keys + webhooks
    │
    ▼
V4 (Production v1.0)
├── Multi-chain deployment
├── Stablecoin + $DCP token
├── Enterprise SSO + compliance
├── Distributed training + inference
├── Mobile app + SDKs
├── DAO governance + audit
└── Global infrastructure + monitoring
```

### Version Handoff Checklist

When moving from V1 → V2, V2 → V3, or V3 → V4:

- [ ] **Schema freeze:** Database schema changes require migration scripts
- [ ] **Contract freeze:** No function signature changes without upgrade path
- [ ] **API freeze:** Backend endpoints versioned (`/api/v2/...`) if breaking changes needed
- [ ] **Documentation:** README, API docs, and provider guides updated
- [ ] **Regression tests:** All previous version acceptance criteria still pass
- [ ] **Performance baseline:** Load test before shipping; no 2x latency regression
- [ ] **Rollback plan:** Previous version deployable within 30 minutes if disaster
- [ ] **Team retro:** What worked, what didn't, what to change next version

---

## 7. Zero-Cost Resource Stack

### Everything Free — No Paid Services Required

| Category | Resource | What For | Free Tier / License | Limitation |
|----------|----------|----------|---------------------|------------|
| **Blockchain** | Foundry | Solidity compile, test, deploy | Open source (MIT) | None |
| **Blockchain** | Anvil | Local EVM node | Open source | None |
| **Blockchain** | Cast | CLI interaction with contracts | Open source | None |
| **Blockchain** | Apothem Testnet | Public XDC testnet | Free | Faucet may be slow |
| **Blockchain** | Apothem Explorer | Verify contracts, view transactions | Free | None |
| **Blockchain** | OpenZeppelin Contracts | ERC-721, Ownable, ReentrancyGuard | MIT License | None |
| **Frontend** | Next.js 14 | React framework | MIT License | None |
| **Frontend** | Tailwind CSS | Styling | MIT License | None |
| **Frontend** | Shadcn/ui | Pre-built components | MIT License | None |
| **Frontend** | Wagmi v2 | Web3 React hooks | MIT License | None |
| **Frontend** | Viem | Ethereum client | MIT License | None |
| **Frontend** | RainbowKit | Wallet connection UI | MIT License | None |
| **Frontend** | Recharts | Charts/graphs | MIT License | None |
| **Frontend** | Sonner | Toast notifications | MIT License | None |
| **Frontend** | React Hook Form | Form handling | MIT License | None |
| **Frontend** | Zod | Schema validation | MIT License | None |
| **Frontend** | Vercel | Hosting | Free tier: 100GB bandwidth, 6000 build min/month | Throttled if exceeded |
| **Backend** | Python 3.12 | Runtime | Open source | None |
| **Backend** | FastAPI | Web framework | MIT License | None |
| **Backend** | Uvicorn | ASGI server | BSD License | None |
| **Backend** | SQLite | Database (V1) | Built into Python | None |
| **Backend** | PostgreSQL | Database (V2+) | Open source / Railway free tier: 500MB | Storage limit on Railway |
| **Backend** | SQLAlchemy | ORM | MIT License | None |
| **Backend** | Alembic | Migrations | MIT License | None |
| **Backend** | Web3.py | XDC blockchain interaction | MIT License | None |
| **Backend** | eth-account | Signing transactions | MIT License | None |
| **Backend** | python-docker | Docker API client | Apache 2.0 | None |
| **Backend** | Pytest | Testing | MIT License | None |
| **Backend** | Railway | Hosting | Free tier: 512MB RAM, sleeps after inactivity | Cold start: 10-30 sec |
| **Backend** | Render | Hosting (alternative) | Free tier: 512MB RAM, sleeps after 15 min | Cold start: 30-60 sec |
| **Backend** | Ngrok | Local tunnel | Free: 1 concurrent tunnel | Random URL |
| **Backend** | LocalTunnel | Local tunnel (alternative) | Free | None |
| **Go** | Go 1.22 | Runtime | BSD License | None |
| **Go** | Cobra | CLI framework | Apache 2.0 | None |
| **Go** | Docker SDK for Go | Container management | Apache 2.0 | None |
| **Go** | go-ethereum | XDC signing, EIP-712 | LGPL | None |
| **Go** | Viper | Config management | MIT License | None |
| **Go** | Zap | Logging | MIT License | None |
| **DevOps** | Git | Version control | GPL v2 | None |
| **DevOps** | GitHub | Repo hosting | Unlimited public repos | Public only |
| **DevOps** | GitHub Actions | CI/CD | 2000 minutes/month free | Enough for demo |
| **DevOps** | Docker Desktop | Local containers | Free for personal use | None |
| **DevOps** | VS Code | IDE | Free | None |
| **DevOps** | OBS Studio | Demo recording | Open source | None |
| **IPFS** | Kubo (go-ipfs) | Self-hosted IPFS node | MIT License | Run locally |
| **IPFS** | Pinata | Managed IPFS pinning | Free tier: 1GB storage, 100 requests/day | Enough for demo |
| **IPFS** | Web3.Storage | IPFS + Filecoin | Free tier: 5GB | Sign up required |
| **IPFS** | NFT.Storage | NFT metadata storage | Free tier: 31GB | Good for receipts |
| **Design** | Figma | UI mockups | Free tier: 3 projects | Enough for wireframes |
| **Design** | Excalidraw | Diagrams | Open source | None |
| **Fonts** | Google Fonts | Typography | Free | None |
| **Icons** | Font Awesome | Icons | Free tier | None |
| **Icons** | Lucide | Icons (Shadcn default) | ISC License | None |

### What Costs Money (Avoid for Hackathon)

| Service | Cost | Free Alternative | Notes |
|---------|------|-----------------|-------|
| AWS / GCP / Azure | $10-100/month | Railway, Render, Vercel | Overkill for demo |
| Etherscan API Pro | $199/month | Apothem explorer (free) | Contract verification |
| Alchemy Growth | $49/month | Public RPC + Anvil | Higher rate limits |
| Infura Paid | $50/month | Public RPC + Anvil | Dedicated nodes |
| Vercel Pro | $20/month | Vercel free tier | Team features |
| Figma Pro | $12/month | Figma free tier | Unlimited projects |
| Pinata Premium | $20/month | Pinata free tier (1GB) | More storage |
| Cloudflare Pro | $20/month | Cloudflare free tier | CDN, SSL |
| Datadog / New Relic | $15-50/month | Grafana + Prometheus (open source) | Monitoring |
| SendGrid / Mailgun | $10-20/month | Skip for demo | Email notifications |
| Twilio | $0.0075/SMS | Skip for demo | SMS notifications |
| Domain name | $10-15/year | Vercel free subdomain | Custom URL |

**Total cost to build V1-V2: $0.00**

### Free Tier Limits to Watch

| Service | Free Limit | What Happens if Exceeded | Mitigation |
|---------|------------|--------------------------|------------|
| Vercel | 100GB bandwidth, 6000 build min/month | Site throttled or suspended | Static export if needed |
| Railway | 500MB storage, 512MB RAM, sleeps after inactivity | Cold start: 10-30 sec | Ping with UptimeRobot (free) |
| Render | 512MB RAM, sleeps after 15 min inactivity | Cold start: 30-60 sec | Same: UptimeRobot ping |
| Pinata | 1GB storage, 100 requests/day | Upload fails | Use mock CID for demo, real only for 1 job |
| Apothem Faucet | 1000 XDC per request, rate limited | Request denied | Anvil fallback, or use pre-funded wallet |
| GitHub Actions | 2000 minutes/month | Builds stop | Local testing, push only when ready |
| Anvil | Unlimited local | None | Best for development, not for demo URL |

---

## 8. What I Need From You (Credential Checklist)

### Required Before Hour 0 (You Must Provide)

| Item | Why | How to Get | Cost | Status |
|------|-----|------------|------|--------|
| **XDC Apothem wallet + private key** | Deploy contracts, run demo transactions | [XDCPay Chrome extension](https://chrome.google.com/webstore/detail/xdcpay/bocpokmlmjbfbhenkpjmbbjjdcmoinlk) or MetaMask custom network | Free | ⬜ Not provided |
| **Apothem testnet XDC (faucet)** | Gas for contract deploy + demo transactions | [Apothem Faucet](https://faucet.apothem.network/) — request early | Free | ⬜ Not requested |
| **GitHub account** | Repo hosting, GitHub Actions CI, Vercel deploy | [github.com](https://github.com) | Free | ⬜ Not provided |
| **Vercel account** | Frontend hosting (Next.js) | [vercel.com](https://vercel.com) — connect GitHub | Free tier | ⬜ Not provided |
| **Railway / Render account** | Backend hosting (FastAPI) | [railway.app](https://railway.app) or [render.com](https://render.com) | Free tier | ⬜ Not provided |
| **Pinata account (optional)** | IPFS file hosting for real results (V2+) | [pinata.cloud](https://pinata.cloud) — free tier: 1GB | Free | ⬜ Not provided |
| **Team roles assigned** | Who does what during the 12-hour build | Discuss in group chat or call | Free | ⬜ Not assigned |
| **Internet stability** | 12-hour continuous build session | Test your connection | Free | ⬜ Not confirmed |
| **Laptop specs** | Docker Desktop needs 16GB+ RAM for PyTorch | Check `docker --version` and RAM | Free | ⬜ Not confirmed |
| **Hackathon rules** | Demo requirements (live URL vs repo + video) | Read hackathon FAQ | Free | ⬜ Not confirmed |

### If Apothem Faucet Is Dry (Backup Plan)

| Item | Why | How to Get | Cost | Status |
|------|-----|------------|------|--------|
| **Anvil (local node)** | Local blockchain for demo if testnet fails | `foundryup` then `anvil --fork-url https://rpc.apothem.network --chain-id 51` | Free | ⬜ Not set up |
| **Pre-funded Anvil accounts** | 10,000 ETH each, instant | Anvil generates 10 accounts on startup | Free | ⬜ Not set up |
| **Switch MetaMask to localhost:8545** | Point wallet to local node | Add network: RPC `http://localhost:8545`, Chain ID `51` | Free | ⬜ Not configured |

**Verdict:** Anvil is MORE reliable for a hackathon demo. Apothem is more impressive ("it's on a real testnet"). Have both ready. Start with Apothem, fallback to Anvil.

---

## 9. One-Day Execution Plan (12 Hours)

### Realistic Goal: V1 Working Demo + V2 Scaffold + V3 Architecture + V4 Vision

> You cannot build V4 in one day. But you CAN build a working V1-V2 demo with V3 architecture visible and V4 vision documented. That's MORE than enough to win a hackathon.

### Hour 0: Setup (30 Minutes)

| Task | Owner | Notes |
|------|-------|-------|
| All-hands sync, assign roles, read this plan | Team Lead | Critical: everyone knows the plan |
| Install Foundry (`foundryup`) | SC Lead | If not installed |
| Install Node.js 18+, Python 3.12 | Everyone | Check versions |
| Install Docker Desktop | DevOps | Free for personal use |
| Create GitHub repo (public) | Team Lead | `github.com/yourteam/dicompute` |
| Connect Vercel to GitHub | Frontend | Auto-deploy on push |
| Sign up Railway / Render | Backend | For backend hosting |
| Request Apothem faucet (do this NOW) | SC Lead | May take 10-30 min |
| Start Anvil as backup | SC Lead | `anvil --fork-url https://rpc.apothem.network --chain-id 51` |

### Hour 1: Contracts (30 Minutes)

| Task | Owner | Notes |
|------|-------|-------|
| Deploy `JobEscrow`, `GPURegistry`, `ReputationSystem`, `ProofReceipt` to Apothem/Anvil | SC Lead | Save addresses to `.env` |
| Verify contracts on Apothem explorer | SC Lead | `forge verify-contract` |
| Copy ABIs to `client/src/contracts/` | SC Lead | JSON files for Wagmi |
| Write 1 happy-path Foundry test | Hermes | `test/JobEscrow.t.sol` |
| Add `IComputeMarketplace.sol` interface | Hermes | Extract from `JobEscrow` |

### Hour 2: Frontend Scaffold (60 Minutes)

| Task | Owner | Notes |
|------|-------|-------|
| Next.js 14 + Tailwind + Shadcn/ui init | Hermes | `npx shadcn@latest init` |
| Wagmi v2 config with XDC Apothem chain | Hermes | Custom chain definition |
| RainbowKit wallet connect button | Hermes | `ConnectButton` component |
| `/` Landing page: hero, stats, CTAs | Hermes | Shadcn `Card`, `Button` |
| `/wizard` Job submission wizard | Hermes | React Hook Form, sliders, submit |
| `/jobs/[id]` Job detail + heartbeat chart | Hermes | Recharts `LineChart` |
| `/receipts/[id]` Receipt NFT display | Hermes | Card with metadata, verify link |
| `/explorer` Public job list | Hermes | Table with filters |
| Deploy to Vercel | Frontend | `git push` triggers deploy |

### Hour 3: Backend + Mock Provider (60 Minutes)

| Task | Owner | Notes |
|------|-------|-------|
| FastAPI scaffold with SQLite | Hermes | `main.py`, `models.py`, `database.py` |
| Heartbeat endpoints: `POST /api/jobs/{id}/heartbeat`, `GET /api/jobs/{id}/heartbeats` | Hermes | SQLite table: `heartbeats` |
| Job list endpoint: `GET /api/jobs` | Hermes | Filter by state |
| Stats endpoint: `GET /api/stats` | Hermes | Mock or real aggregation |
| Python mock provider script: polls `JobSubmitted`, claims, sends heartbeats, completes | Hermes | Colored terminal output |
| Deploy backend to Railway | Backend | `railway up` |

### Hour 4: Integration (60 Minutes)

| Task | Owner | Notes |
|------|-------|-------|
| Wire frontend ↔ backend API calls | Frontend | Replace mock data with real API |
| Test full happy path: wizard → submit → claim → heartbeats → complete → receipt | Team | Fix bugs as they appear |
| Add demo shortcuts: "Fill Demo Data" button, fast heartbeat mode | Frontend | Speeds up live demo |
| Add loading states, error toasts (Sonner) | Frontend | Looks polished |
| Add "Verify on XDC" link to Apothem explorer | Frontend | `https://explorer.apothem.network/tx/{txHash}` |

### Hour 5: V2 Real Docker Provider (60 Minutes)

| Task | Owner | Notes |
|------|-------|-------|
| Python script with Docker SDK: `docker pull`, `docker run` | Hermes | `docker-py` package |
| Pull PyTorch image: `docker pull pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime` | Hermes | Large image, start download early |
| Run container with CPU/RAM limits (cgroups) | Hermes | `docker run --cpus=4 --memory=16g` |
| Capture stdout/stderr, save to file | Hermes | `container.logs()` |
| Upload result file to Pinata (free tier) | Backend | Get real CID instead of mock |
| Send real CID in `submitResults()` | Hermes | Now receipt points to real data |
| Add `provider.yaml` config file | Hermes | Credentials, limits, auto-claim |
| Test: submit "real" PyTorch job → container runs → results uploaded → receipt minted | Team | End-to-end V2 test |

### Hour 6: V3 Go Daemon Scaffold (60 Minutes)

| Task | Owner | Notes |
|------|-------|-------|
| `go mod init github.com/dicompute/daemon` | Hermes | Go module setup |
| `cmd/daemon/main.go` — Cobra CLI entrypoint | Hermes | `start`, `register`, `status` commands |
| `internal/provisioner/docker.go` — interface definition | Hermes | `PullImage`, `RunContainer`, `StopAndRemove` |
| `internal/verifier/signer.go` — EIP-712 signer interface | Hermes | `SignHeartbeat`, `GetAddress` |
| `internal/heartbeat/broadcaster.go` — interface definition | Hermes | `Start()`, `Stop()` |
| `internal/watcher/watcher.go` — event listener interface | Hermes | `WatchJobSubmitted()` |
| `internal/config/config.go` — Viper config struct | Hermes | `ProviderConfig`, `ChainConfig` |
| `internal/ipfs/uploader.go` — interface definition | Hermes | `UploadFile()`, `UploadDirectory()` |
| `README.md` in `daemon/` explaining architecture | Hermes | Shows V3 depth to judges |
| **Do NOT implement logic** — just interfaces and stubs | — | Judges see architecture, not broken code |

### Hour 7: V3 Marketplace Scaffold (60 Minutes)

| Task | Owner | Notes |
|------|-------|-------|
| Add `reverseAuction` field to `JobEscrow` contract (or plan in comments) | Hermes | Show intent, not implementation |
| Add `matchingEngine.go` interface in daemon | Hermes | `MatchJobToProvider()` stub |
| Add `auction.go` stub in backend | Hermes | `PlaceBid()`, `AcceptBid()` empty functions |
| Add `/provider/jobs` page with "Available Jobs" tab | Frontend | List pending jobs, "Claim" button |
| Add job templates: "PyTorch MNIST", "TensorFlow Hello World" | Frontend | Pre-fill wizard with common configs |
| Add reputation score badge to provider cards | Frontend | Read from `ReputationSystem` contract |
| **These are UI shells + interfaces** — not working logic | — | Judges see depth beyond MVP |

### Hour 8: V4 Vision Documents (60 Minutes)

| Task | Owner | Notes |
|------|-------|-------|
| Create architecture diagram: V4 multi-chain, enterprise, token | PM | Excalidraw or Figma free |
| Add `docs/V4-ARCHITECTURE.md` explaining tokenomics, governance, enterprise | Hermes | Vision document |
| Add `docs/ENTERPRISE.md` with compliance template ideas (NSF, NIH, EU) | Hermes | Shows market understanding |
| Add `docs/TOKENOMICS.md` with $DCP token plan | Hermes | Staking, rewards, revenue share |
| Add `docs/ROADMAP.md` with clear V1→V2→V3→V4 timeline | Hermes | Shows execution discipline |
| Create `docs/` index page with all docs linked | Hermes | Professional touch |

### Hour 9: Polish + Responsive (60 Minutes)

| Task | Owner | Notes |
|------|-------|-------|
| Responsive check: mobile layout for all pages | Frontend | Judges may view on phone |
| Optimize bundle size if Vercel deploy is slow | Frontend | `next build` analysis |
| Add `README.md` with setup instructions | Hermes | Judges may clone the repo |
| Add `.env.example` with all required variables | Team | No secrets, just keys |
| Add `CONTRIBUTING.md` if open-source prize | PM | Hackathon-specific |
| Pre-run the full demo once: job → complete → receipt | Team | Have a completed receipt ready |

### Hour 10: Demo Recording (60 Minutes)

| Task | Owner | Notes |
|------|-------|-------|
| Record 90-second screen recording (OBS) | PM | Backup if live demo fails |
| Create 5-slide pitch deck (Google Slides) | PM | Problem, Solution, Demo, Tech, Ask |
| Write demo script (3-minute narration) | Team | Everyone knows their lines |
| Rehearse twice: one person narrates, one drives | Team | Smooth transitions |
| Prepare fallback: if live fails, show recording + explain | PM | Never leave judges with nothing |

### Hour 11-12: Buffer + Final Fixes (120 Minutes)

| Task | Owner | Notes |
|------|-------|-------|
| Fix any remaining bugs from rehearsal | Team | Priority: wizard submit, heartbeat display, receipt |
| Final GitHub push with clean commit history | Team | `git rebase -i` if needed |
| Submit to hackathon portal with repo link + demo URL | Team | Vercel URL + Railway URL |
| Celebrate — you just shipped a working product in 12 hours | Everyone | 🎉 |

---

## 10. Risk Mitigation & Fallbacks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Apothem faucet dry** | Medium | High | Pre-fund wallets at hour 0. Fallback to Anvil local node. |
| **MetaMask won't connect to XDC** | Medium | High | Use XDCPay. Have browser profiles pre-configured. |
| **Contract deployment fails** | Low | Critical | Use pre-deployed contracts from earlier test. Keep ABIs + addresses in `contracts/.env.deployed`. |
| **Mock provider crashes mid-demo** | Medium | High | Pre-run the demo once before judges arrive. Have a 90-second screen recording as backup. |
| **Frontend build error** | Medium | Medium | Use `next dev` not `next build` for demo. Development server is fine. |
| **Judge asks about slashing** | Low | Medium | Say "slashing is fully implemented in the contracts — we hid it from the UI to keep the demo focused on the receipt layer." Show contract code if pressed. |
| **Judge asks about real providers** | Medium | Medium | Say "We have a Go daemon in the repo (show folder structure) — for the demo we used a Python simulator to show the live heartbeat flow. The daemon is the next step." |
| **Demo job takes too long** | High | High | Add "Fast Demo Mode" — mock provider sends heartbeats every 3 seconds, job completes in 20 seconds. |
| **Railway/Render cold start** | Medium | Medium | Ping with UptimeRobot (free) or keep hitting the endpoint every 5 minutes. |
| **Vercel bandwidth exceeded** | Low | Medium | Static export if needed, or use Vercel Pro trial. |
| **Team member drops out** | Medium | High | Have Hermes + OpenClaw agents pick up slack. Agents can scaffold code in parallel. |
| **Internet disconnection** | Low | Critical | Download all dependencies before starting. Use `npm ci` and `pip install -r requirements.txt` offline. |
| **Laptop crashes** | Low | Critical | Have at least 2 team members with the full repo cloned and dependencies installed. |

---

## 11. Appendix: Database Schema

### V1 Schema (SQLite)

```sql
-- Jobs table
CREATE TABLE jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chain_job_id INTEGER UNIQUE NOT NULL,
    user_address TEXT NOT NULL,
    provider_address TEXT,
    docker_uri TEXT NOT NULL,
    cpu_milli INTEGER NOT NULL,
    ram_mib INTEGER NOT NULL,
    vram_mib INTEGER NOT NULL,
    duration_blocks INTEGER NOT NULL,
    max_price_per_block TEXT NOT NULL,
    deposit TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'pending',
    started_at_block INTEGER,
    completed_at_block INTEGER,
    last_heartbeat_block INTEGER,
    result_cid TEXT,
    instruction_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_jobs_state ON jobs(state);
CREATE INDEX idx_jobs_user ON jobs(user_address);
CREATE INDEX idx_jobs_provider ON jobs(provider_address);

-- Heartbeats table
CREATE TABLE heartbeats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER REFERENCES jobs(chain_job_id),
    block_number INTEGER NOT NULL,
    uptime_seconds INTEGER NOT NULL,
    cpu_percent INTEGER NOT NULL,
    ram_percent INTEGER NOT NULL,
    vram_percent INTEGER NOT NULL,
    signature BLOB NOT NULL,
    digest BLOB NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_heartbeats_job ON heartbeats(job_id);

-- Providers table
CREATE TABLE providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT PRIMARY KEY,
    metadata_uri TEXT,
    stake TEXT NOT NULL,
    is_registered INTEGER DEFAULT 1,
    is_slashed INTEGER DEFAULT 0,
    total_jobs_completed INTEGER DEFAULT 0,
    total_jobs_failed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receipts table
CREATE TABLE receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_id INTEGER UNIQUE NOT NULL,
    job_id INTEGER REFERENCES jobs(chain_job_id),
    user_address TEXT NOT NULL,
    provider_address TEXT NOT NULL,
    result_cid TEXT,
    instruction_count INTEGER,
    cost TEXT,
    minted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### V2+ Schema (PostgreSQL — Async SQLAlchemy)

```python
# models.py — SQLAlchemy 2.0 style
from sqlalchemy import Column, Integer, String, BigInteger, Boolean, Text, DateTime, Index, ForeignKey, Numeric
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True)
    chain_job_id = Column(BigInteger, unique=True, nullable=False, index=True)
    user_address = Column(String(42), nullable=False, index=True)
    provider_address = Column(String(42), ForeignKey("providers.address"), index=True)
    docker_uri = Column(Text, nullable=False)
    cpu_milli = Column(Integer, nullable=False)
    ram_mib = Column(Integer, nullable=False)
    vram_mib = Column(Integer, nullable=False)
    duration_blocks = Column(Integer, nullable=False)
    max_price_per_block = Column(Numeric(78, 0), nullable=False)
    deposit = Column(Numeric(78, 0), nullable=False)
    state = Column(String(20), nullable=False, default="pending", index=True)
    started_at_block = Column(BigInteger)
    completed_at_block = Column(BigInteger)
    last_heartbeat_block = Column(BigInteger)
    result_cid = Column(Text)
    instruction_count = Column(BigInteger)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    heartbeats = relationship("Heartbeat", back_populates="job", lazy="selectin")
    receipt = relationship("Receipt", back_populates="job", uselist=False)
    provider = relationship("Provider", back_populates="jobs")

class Heartbeat(Base):
    __tablename__ = "heartbeats"
    
    id = Column(Integer, primary_key=True)
    job_id = Column(BigInteger, ForeignKey("jobs.chain_job_id"), nullable=False, index=True)
    block_number = Column(BigInteger, nullable=False)
    uptime_seconds = Column(BigInteger, nullable=False)
    cpu_percent = Column(Integer, nullable=False)
    ram_percent = Column(Integer, nullable=False)
    vram_percent = Column(Integer, nullable=False)
    signature = Column(LargeBinary, nullable=False)
    digest = Column(LargeBinary, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    job = relationship("Job", back_populates="heartbeats")

class Provider(Base):
    __tablename__ = "providers"
    
    address = Column(String(42), primary_key=True)
    metadata_uri = Column(Text)
    stake = Column(Numeric(78, 0), nullable=False)
    is_registered = Column(Boolean, default=True)
    is_slashed = Column(Boolean, default=False)
    total_jobs_completed = Column(Integer, default=0)
    total_jobs_failed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    jobs = relationship("Job", back_populates="provider")
    reputation = relationship("ProviderReputation", back_populates="provider", uselist=False)

class ProviderReputation(Base):
    __tablename__ = "provider_reputations"
    
    provider_address = Column(String(42), ForeignKey("providers.address"), primary_key=True)
    score = Column(Integer, default=5000)  # 0-10000 basis points
    total_jobs = Column(Integer, default=0)
    completed_jobs = Column(Integer, default=0)
    slashed_count = Column(Integer, default=0)
    heartbeat_streak = Column(Integer, default=0)
    last_heartbeat_time = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    provider = relationship("Provider", back_populates="reputation")

class Receipt(Base):
    __tablename__ = "receipts"
    
    id = Column(Integer, primary_key=True)
    token_id = Column(BigInteger, unique=True, nullable=False)
    job_id = Column(BigInteger, ForeignKey("jobs.chain_job_id"), unique=True)
    user_address = Column(String(42), nullable=False, index=True)
    provider_address = Column(String(42), nullable=False)
    result_cid = Column(Text)
    instruction_count = Column(BigInteger)
    cost = Column(Numeric(78, 0))
    minted_at = Column(DateTime, default=datetime.utcnow)
    
    job = relationship("Job", back_populates="receipt")
```

---

## Summary: What You're Building Today

| Layer | What Exists | What It Proves to Judges |
|-------|-------------|--------------------------|
| **V1 Working Demo** | Submit job → heartbeat → receipt NFT in 90 seconds | **"This product works"** |
| **V2 Real Docker** | PyTorch container actually runs, produces real output | **"This is real, not just mock data"** |
| **V3 Go Daemon** | Folder structure, interfaces, CLI stubs | **"They know how to build the rest"** |
| **V4 Vision** | Architecture docs, tokenomics, enterprise roadmap | **"They have a real business plan"** |
| **Pitch Deck** | 5 slides, problem → solution → demo → tech → ask | **"Clear narrative"** |
| **Backup Video** | 90-second screen recording | **"Professional preparation"** |

**Total cost: $0.00. Total time: 12 hours. Team size: 5 people + 2 AI agents.**

Provide the 10 items in Section 8 and we start building immediately. No cost. No paid services. 100% open source. 🚀
