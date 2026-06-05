# DICOMPUTE — Product User Flow, Route Specification & Competitive Validation

> **Document Purpose:** Map every user journey, endpoint, and feature on the DICOMPUTE product website. Validate against Akash Network and other decentralized compute providers. Identify gaps and actionable improvements for the Hermes agent implementation team.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Personas](#2-user-personas)
3. [User Flow Matrix](#3-user-flow-matrix)
4. [Website Routes & Endpoints](#4-website-routes--endpoints)
5. [Feature Availability by Route](#5-feature-availability-by-route)
6. [Competitive Comparison: Akash & Others](#6-competitive-comparison-akash--others)
7. [Plan Validation & Gap Analysis](#7-plan-validation--gap-analysis)
8. [Hermes Agent Implementation Roadmap](#8-hermes-agent-implementation-roadmap)
9. [Appendix: API Contract Specification](#9-appendix-api-contract-specification)

---

## 1. Executive Summary

DICOMPUTE is a **verifiable GPU compute marketplace** built on XDC Network. Unlike generic decentralized cloud providers, it specializes in **proof-of-training receipts** — every job produces an on-chain NFT attestation suitable for model provenance, compliance, and grant accountability.

**Current Implementation Status (as of June 2025):**
- ✅ Smart contracts: `JobEscrow`, `GPURegistry`, `ReputationSystem`, `ProofReceipt` (Foundry/Solidity)
- ⚠️ Backend API: Scaffolded but empty (no FastAPI routes implemented)
- ⚠️ Client Dashboard: Empty Next.js project structure (no pages/components)
- ⚠️ Go Daemon: Package structure exists, no Go source files written
- ⚠️ Integration: None

**This document serves as the blueprint for the Hermes agent to build the missing frontend, backend, and daemon layers against a validated competitive baseline.**

---

## 2. User Personas

| Persona | Goal | Primary Routes | Wallet Required |
|---------|------|----------------|---------------|
| **Job Submitter (User)** | Rent GPU/CPU for ML training, get verifiable receipt | `/jobs`, `/wizard`, `/receipts` | ✅ Yes |
| **Compute Provider** | Offer hardware, earn fees, maintain reputation | `/provider`, `/provider/dashboard`, `/provider/register` | ✅ Yes |
| **Challenger/ Auditor** | Verify provider honesty, earn slash bounties | `/explorer`, `/jobs/:id` | ✅ Optional |
| **Visitor / Researcher** | Learn about DICOMPUTE, browse public receipts | `/`, `/docs`, `/explorer` | ❌ No |
| **Grant Funder / Compliance** | Audit training receipts for fund disbursement | `/explorer`, `/receipts/:id` | ❌ No |

---

## 3. User Flow Matrix

### 3.1 Job Submitter Flow (Primary Revenue Path)

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

**Step-by-Step:**

| Step | Screen | Action | On-Chain Tx | Off-Chain API |
|------|--------|--------|-------------|---------------|
| 1 | `/` | Visitor clicks "Launch Job" | — | `GET /api/health` |
| 2 | `/wizard` | Configure Docker URI, CPU/RAM/VRAM, duration, max price | — | `GET /api/providers/active` |
| 3 | `/wizard` | Price estimation fetched | — | `POST /api/quote` |
| 4 | `/connect` | Wallet connect (MetaMask / XDCPay) | — | `GET /api/chains/xdc` |
| 5 | `/wizard` | Approve ERC-20 / deposit XDC | `approve()` + `submitJob()` | `POST /api/jobs` (indexing) |
| 6 | `/jobs/:id` | Wait for provider claim | Listen `JobClaimed` event | `GET /api/jobs/:id/status` |
| 7 | `/jobs/:id` | Monitor heartbeats in real-time | Listen `HeartbeatReceived` | WebSocket `/ws/jobs/:id` |
| 8 | `/jobs/:id` | Job completes, results ready | Listen `JobCompleted` | `GET /api/ipfs/:cid` |
| 9 | `/receipts/:id` | View & download ProofReceipt NFT | `ownerOf()` query | `GET /api/receipts/:id` |
| 10 | `/receipts/:id` | Share/verify receipt publicly | — | `GET /api/receipts/:id/verify` |

---

### 3.2 Compute Provider Flow (Supply-Side Onboarding)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Landing   │────▶│ Provider Info│────▶│  Register    │────▶│  Stake XDC   │
│     /       │     │  /provider   │     │  /provider/  │     │  on-chain    │
│             │     │              │     │   register   │     │              │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
                                                                       ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Daemon     │     │  Claim Jobs  │     │  Submit HB   │     │  Get Paid    │
│  Download   │────▶│  (auto/man)  │────▶│  + Results   │────▶│  + Reputation│
│  /download  │     │              │     │              │     │              │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Step-by-Step:**

| Step | Screen | Action | On-Chain Tx | Off-Chain (Daemon) |
|------|--------|--------|-------------|-------------------|
| 1 | `/provider` | Read requirements, download daemon | — | `GET /api/releases` |
| 2 | `/provider/register` | Fill metadata (GPU model, region, etc.) | — | `POST /api/providers/pre-register` |
| 3 | `/provider/register` | Submit stake + register | `registerProvider()` | — |
| 4 | `/provider/dashboard` | Daemon running, status "Healthy" | — | Daemon WebSocket `/ws/daemon` |
| 5 | Auto | Poll/listen for `JobSubmitted` events | Event listener | `GET /api/jobs/pending` |
| 6 | `/provider/dashboard` | Claim job (manual or auto-bid) | `claimJob()` | `POST /api/jobs/:id/claim` |
| 7 | Daemon | Pull Docker image, enforce cgroups | — | Docker Engine API |
| 8 | Daemon | Sign & broadcast heartbeat every N blocks | `submitHeartbeat()` | EIP-712 signing |
| 9 | Daemon | Upload results to IPFS, submit CID | `submitResults()` | IPFS node/client |
| 10 | `/provider/dashboard` | View earnings, reputation score, history | `getReputation()` | `GET /api/providers/me/stats` |

---

### 3.3 Challenger / Auditor Flow (Trust Layer)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Explorer   │────▶│  Job Detail  │────▶│  Check HB    │────▶│  Challenge   │
│  /explorer  │     │  /jobs/:id   │     │  Timeout?    │     │  (if stale)  │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Step-by-Step:**

| Step | Screen | Action | On-Chain Tx | Notes |
|------|--------|--------|-------------|-------|
| 1 | `/explorer` | Browse all jobs (pending/active/completed/slashed) | — | Filterable, sortable table |
| 2 | `/jobs/:id` | View job details + heartbeat history | `getJob()` | Graph of heartbeat intervals |
| 3 | `/jobs/:id` | Check `lastHeartbeatBlock` vs current | `MAX_BLOCK_TIMEOUT` | UI shows "Challenge Open" if stale |
| 4 | `/jobs/:id` | Click "Challenge Provider" | `challengeProvider()` | Requires active wallet + gas |
| 5 | `/jobs/:id` | View slash result, bounty earned | Event listener | Challenger gets 20% of stake |

---

### 3.4 Grant Funder / Compliance Flow (Receipt Verification)

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Receipt    │────▶│  Verify NFT  │────▶│  Check Job   │────▶│  Full Audit  │
│  /receipts  │     │  Ownership   │     │  + Provider  │     │  Report      │
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

**Step-by-Step:**

| Step | Screen | Action | On-Chain Query | Off-Chain |
|------|--------|--------|----------------|-----------|
| 1 | `/receipts/:id` | View receipt metadata (job, provider, cost, CID) | `receipts(tokenId)` | IPFS preview |
| 2 | `/receipts/:id` | Verify NFT ownership and chain of custody | `ownerOf()` | `GET /api/receipts/:id/verify` |
| 3 | `/receipts/:id` | Cross-reference provider reputation | `getReputation()` | `GET /api/providers/:addr` |
| 4 | `/receipts/:id` | Download full audit PDF/JSON | — | `GET /api/receipts/:id/audit` |

---

## 4. Website Routes & Endpoints

### 4.1 Public Routes (No Wallet Required)

| Route | Purpose | Key Components | Data Source |
|-------|---------|---------------|-------------|
| `/` | Landing page | Hero, feature grid, CTA, live stats | `GET /api/stats` |
| `/about` | Project info, team, architecture | Diagrams, whitepaper link | Static |
| `/docs` | Documentation (MDX) | Quick start, API reference, SDL | Static / GitHub |
| `/explorer` | Public job explorer | Table: jobs, providers, receipts | `GET /api/jobs`, `GET /api/providers` |
| `/providers` | Provider directory | Cards with GPU specs, reputation, pricing | `GET /api/providers/active` |
| `/pricing` | Cost estimator | Interactive calculator vs AWS/GCP | `POST /api/quote` |
| `/receipts` | Public receipt gallery | Grid of ProofReceipt NFTs | `GET /api/receipts` |
| `/receipts/:tokenId` | Individual receipt detail | Metadata, verification badge, IPFS preview | `GET /api/receipts/:id`, on-chain |
| `/download` | Daemon download page | OS binaries, Docker image, setup guide | `GET /api/releases` |

### 4.2 User Dashboard Routes (Wallet-Connected)

| Route | Purpose | Key Components | On-Chain Reads |
|-------|---------|---------------|----------------|
| `/dashboard` | User overview | My jobs, receipts, spend, notifications | `getJobCount()`, `balanceOf()` |
| `/jobs` | My job history | List: pending, active, completed, cancelled | Filtered `jobs[]` mapping |
| `/jobs/:id` | Job detail + monitoring | Status, heartbeats graph, results, challenge button | `getJob()`, events |
| `/wizard` | Submit new job | Stepper: config → preview → confirm → submit | `submitJob()` tx |
| `/receipts` | My receipts | Owned ProofReceipt NFTs gallery | `ownerOf()` loop |
| `/receipts/:id` | Receipt detail | Same as public but with download CTA | On-chain + IPFS |
| `/settings` | Profile, wallet, notifications | ENS/avatar, email for alerts, API keys | — |

### 4.3 Provider Dashboard Routes (Wallet-Connected + Registered)

| Route | Purpose | Key Components | On-Chain Reads |
|-------|---------|---------------|----------------|
| `/provider` | Provider landing | Benefits, hardware requirements, earnings calculator | Static |
| `/provider/register` | Onboarding form | Metadata URI, stake amount, TOS | `registerProvider()` |
| `/provider/dashboard` | Provider control panel | Status, active jobs, earnings, reputation graph, daemon logs | `getProvider()`, `getReputation()` |
| `/provider/jobs` | Job management | Available → Claimed → Active → Completed | `getPendingJobs()` |
| `/provider/jobs/:id` | Running job detail | Container logs, resource usage, heartbeat status | Daemon WS + Docker |
| `/provider/stats` | Analytics | Revenue, uptime %, job completion rate, reputation history | `GET /api/providers/me/stats` |
| `/provider/settings` | Provider config | Metadata update, stake top-up, withdrawal | `addStake()`, `unregisterProvider()` |

### 4.4 API Endpoints (Backend / FastAPI)

#### Jobs

| Method | Endpoint | Auth | Description | Contract Mapping |
|--------|----------|------|-------------|------------------|
| `GET` | `/api/jobs` | Public | List all jobs (paginated, filterable) | `jobs[]` + `getPendingJobs()` |
| `GET` | `/api/jobs/:id` | Public | Job detail + heartbeat history | `getJob()` + heartbeat table |
| `POST` | `/api/jobs` | Wallet sig | Index newly submitted job (post-tx) | `JobSubmitted` event |
| `POST` | `/api/jobs/:id/claim` | Provider sig | Index job claim (post-tx) | `JobClaimed` event |
| `POST` | `/api/jobs/:id/heartbeat` | Provider sig | Index heartbeat (post-tx) | `HeartbeatReceived` event |
| `POST` | `/api/jobs/:id/complete` | Provider sig | Index completion (post-tx) | `JobCompleted` event |
| `POST` | `/api/jobs/:id/challenge` | Any sig | Index challenge (post-tx) | `ProviderSlashed` event |
| `DELETE` | `/api/jobs/:id` | User sig | Index cancellation | `JobCancelled` event |

#### Providers

| Method | Endpoint | Auth | Description | Contract Mapping |
|--------|----------|------|-------------|------------------|
| `GET` | `/api/providers` | Public | List all providers | `getAllProviders()` |
| `GET` | `/api/providers/active` | Public | Active (non-slashed) providers | `getActiveProviders()` |
| `GET` | `/api/providers/:address` | Public | Provider detail + reputation | `getProvider()` + `getReputation()` |
| `POST` | `/api/providers` | Wallet sig | Index new provider | `ProviderRegistered` event |
| `GET` | `/api/providers/me/stats` | JWT / Sig | Authenticated provider stats | Aggregated SQL query |
| `PATCH` | `/api/providers/:address` | Provider sig | Update metadata off-chain | — |

#### Receipts

| Method | Endpoint | Auth | Description | Contract Mapping |
|--------|----------|------|-------------|------------------|
| `GET` | `/api/receipts` | Public | List all receipts | `ReceiptMinted` events |
| `GET` | `/api/receipts/:tokenId` | Public | Receipt detail | `receipts(tokenId)` |
| `GET` | `/api/receipts/:tokenId/verify` | Public | Full verification chain | Multi-call validation |
| `GET` | `/api/receipts/:tokenId/audit` | Public | Audit PDF/JSON export | Aggregated report |

#### Quotes & Pricing

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/quote` | Public | Price estimate based on spec + duration |
| `GET` | `/api/stats` | Public | Network stats: total jobs, providers, XDC volume, avg cost |

#### IPFS / Storage

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/ipfs/upload` | Provider | Upload result bundle to IPFS/Filecoin |
| `GET` | `/api/ipfs/:cid` | Public | Retrieve/preview IPFS content |

#### WebSocket

| Endpoint | Auth | Description |
|----------|------|-------------|
| `/ws/jobs/:id` | Public | Real-time job status + heartbeat stream |
| `/ws/daemon` | Provider JWT | Daemon → backend heartbeat + log streaming |
| `/ws/explorer` | Public | Live network activity feed |

---

## 5. Feature Availability by Route

### 5.1 Public Site Features

| Feature | `/` | `/explorer` | `/providers` | `/pricing` | `/receipts` | `/docs` |
|---------|-----|-------------|--------------|------------|-------------|---------|
| Live network stats ticker | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Job explorer (filterable) | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Provider directory cards | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Price calculator | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Receipt gallery + verify | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Documentation search | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Wallet connect CTA | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 5.2 User Dashboard Features

| Feature | `/dashboard` | `/jobs` | `/jobs/:id` | `/wizard` | `/receipts` | `/settings` |
|---------|--------------|---------|-------------|-----------|-------------|-------------|
| Job list (all statuses) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Submit new job wizard | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Real-time job monitoring | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Heartbeat graph (per job) | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Challenge provider button | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| ProofReceipt NFT gallery | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Receipt verification | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Download audit report | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Spending analytics | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Wallet/notification settings | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### 5.3 Provider Dashboard Features

| Feature | `/provider` | `/provider/register` | `/provider/dashboard` | `/provider/jobs` | `/provider/stats` | `/provider/settings` |
|---------|-------------|----------------------|----------------------|------------------|-------------------|----------------------|
| Onboarding info | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Stake + register form | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Daemon download links | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Daemon status (online/offline) | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Active job list | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Container log viewer | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Resource usage real-time | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Earnings + payout history | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Reputation score + history | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| Stake top-up / withdraw | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Metadata update | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Auto-bid / manual claim toggle | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |

---

## 6. Competitive Comparison: Akash & Others

### 6.1 Feature Comparison Matrix

| Feature | DICOMPUTE (Plan) | Akash Network | Render | io.net | Lilypad |
|---------|-----------------|---------------|--------|--------|---------|
| **Chain** | XDC (EVM) | Cosmos (Akash) | N/A (custodial) | Solana | Ethereum/Arbitrum |
| **Market Model** | Direct claim + escrow | Reverse auction (bids) | Fixed pricing | Fixed pricing | Fixed pricing |
| **Receipt / Proof** | ✅ On-chain NFT (ERC-721) | ❌ None | ❌ Invoice only | ❌ None | ❌ None |
| **Heartbeat Verification** | ✅ EIP-712 signed | ❌ None | ❌ None | ❌ None | ❌ Bacalhau proofs |
| **Challenge / Slash** | ✅ Open challenge + bounty | ❌ None | ❌ KYC recourse | ❌ None | ❌ Mediation |
| **Reputation System** | ✅ On-chain score | ❌ None | ❌ Star rating | ❌ None | ✅ (implied) |
| **GPU Support** | ✅ Targeted | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Container Orchestration** | Docker (daemon) | Kubernetes | Proprietary | Proprietary | Bacalhau |
| **Deployment Format** | Docker URI + spec | SDL (YAML) | Template | Template | Docker + spec |
| **Payment Token** | XDC / ERC-20 | AKT / ACT | Fiat / RNDR | USDC / IO | ETH / LP |
| **Block Time** | ~2s | ~6s | N/A | ~400ms | ~12s |
| **Escrow** | ✅ Native in contract | ✅ Native (module) | ❌ Pre-pay | ❌ Pre-pay | ✅ Yes |
| **IPFS / Result Storage** | ✅ Planned | ✅ Yes | ❌ Centralized | ❌ Centralized | ✅ IPFS |
| **Web Dashboard** | ✅ Next.js (planned) | ✅ Console + Air | ✅ Yes | ✅ Yes | ✅ Yes |
| **CLI** | ❌ Not planned | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **SDK** | ❌ Not planned | ✅ Go + TS | ❌ Limited | ✅ Yes | ✅ Yes |
| **Provider Console** | ✅ Web dashboard | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Pricing Flexibility** | Fixed max price | Reverse auction | Fixed tiers | Fixed | Fixed |
| **Focus** | Verifiable ML training | General cloud | GPU rendering | GPU clusters | General compute |

### 6.2 What Akash Does That DICOMPUTE Doesn't (Yet)

| Akash Feature | Gap in DICOMPUTE | Priority | Effort |
|---------------|-----------------|----------|--------|
| **Reverse auction** (providers bid down) | DICOMPUTE uses fixed max price with direct claim | Medium | High |
| **SDL / YAML deployments** | DICOMPUTE uses simple Docker URI + sliders | Low | Medium |
| **Multi-container services** | DICOMPUTE only supports single container per job | Medium | High |
| **Persistent storage / volumes** | DICOMPUTE has no storage layer spec | High | High |
| **Private container registries** | DICOMPUTE assumes public Docker Hub | Medium | Medium |
| **CLI tool** | DICOMPUTE has no CLI for power users | Medium | High |
| **SDK (Go/TS)** | DICOMPUTE has no programmatic SDK | Low | High |
| **AuthZ / Delegated permissions** | DICOMPUTE has no multi-user/team support | Low | Medium |
| **Provider Playbook / K8s** | DICOMPUTE uses raw Docker daemon | N/A — different model | — |
| **Global provider network** | DICOMPUTE is new, needs provider acquisition | Critical | Ongoing |

### 6.3 What DICOMPUTE Does That Akash Doesn't

| DICOMPUTE Feature | Competitive Moat | Replicability |
|-------------------|-------------------|---------------|
| **ProofReceipt NFT** | Unique verifiable training artifact | Medium — Akash could add receipts |
| **EIP-712 heartbeat signatures** | Live cryptographic attestation of execution | Medium — can be forked |
| **Open challenge + slash bounty** | Decentralized fraud detection without KYC | High — game theory is hard to replicate |
| **Reputation score on-chain** | Transparent provider history | Low — easy to add |
| **XDC-specific** | 2s block time, cheap gas, EVM compatible | Low — chain choice is strategy |
| **ML training focus** | Tailored UX for GPU training jobs | Medium — vertical specialization |

---

## 7. Plan Validation & Gap Analysis

### 7.1 Current State vs. Plan

| Component | Plan Spec | Current State | Status | Blocker |
|-----------|-----------|---------------|--------|---------|
| `JobEscrow.sol` | Full state machine + heartbeat + slash | ✅ Implemented | Complete | None |
| `GPURegistry.sol` | Stake + register + slash + stats | ✅ Implemented | Complete | None |
| `ReputationSystem.sol` | Score + streak + history | ✅ Implemented | Complete | None |
| `ProofReceipt.sol` | ERC-721 mint on completion | ✅ Implemented | Complete | None |
| `IComputeMarketplace.sol` | Interface + errors + events | ❌ Missing | Gap | Not critical for MVP |
| **Foundry Tests** | State transitions, slashing, heartbeat | ⚠️ Minimal | Gap | `Counter.s.sol` only |
| **Backend (FastAPI)** | Jobs, providers, receipts, IPFS, WebSocket | ❌ Empty | Critical Gap | No code written |
| **Database (PostgreSQL)** | Schema for jobs, providers, heartbeats | ❌ Missing | Critical Gap | No schema defined |
| **Client (Next.js)** | 3 screens: wizard, dashboard, explorer | ❌ Empty | Critical Gap | No pages/components |
| **Wagmi v2 hooks** | `useSubmitJob`, `useClaimJob`, etc. | ❌ Missing | Critical Gap | Needs client first |
| **Go Daemon** | Docker provisioner + verifier + heartbeat | ⚠️ Folders only | Critical Gap | No `.go` files |
| **IPFS Integration** | Result storage + retrieval | ❌ Missing | Gap | No infra chosen |
| **XDC Testnet Deploy** | Apothem deployment + verification | ❌ Missing | Gap | Needs backend for indexing |
| **CI/CD** | GitHub Actions, automated tests | ❌ Missing | Gap | No `.github/workflows` |

### 7.2 Critical Architecture Gaps

#### Gap 1: No Backend API Layer
**Severity:** 🔴 Critical
**Impact:** Frontend cannot read job data without direct RPC calls. Event indexing impossible. No off-chain analytics.
**Fix:** Build FastAPI with Web3.py, PostgreSQL, and async event listeners. Minimum 2-week effort.

#### Gap 2: No Frontend Implementation
**Severity:** 🔴 Critical
**Impact:** No user can interact with the platform. The entire user flow exists only on paper.
**Fix:** Build Next.js 14 app with Wagmi v2, Shadcn/ui. Focus on `/wizard`, `/jobs/:id`, `/provider/dashboard`. Minimum 3-week effort.

#### Gap 3: No Go Daemon
**Severity:** 🔴 Critical
**Impact:** No provider can actually run jobs. The Docker provisioner, heartbeat signer, and result uploader are all missing.
**Fix:** Implement `provisioner.go`, `verifier.go`, `heartbeat.go`, `watcher.go`. Minimum 2-week effort.

#### Gap 4: Missing `IComputeMarketplace.sol`
**Severity:** 🟡 Medium
**Impact:** Contracts are tightly coupled. No interface for future marketplace upgrades or third-party integrations.
**Fix:** Extract interface from `JobEscrow` + `GPURegistry` into `IComputeMarketplace.sol`. 1-day effort.

#### Gap 5: No Foundry Test Coverage
**Severity:** 🟡 Medium
**Impact:** Slashing logic, heartbeat verification, and edge cases are untested. Risk of bugs on mainnet.
**Fix:** Write comprehensive Forge tests for: slashing path, signature verification, reentrancy, gas limits. 1-week effort.

#### Gap 6: No IPFS/Filecoin Infrastructure
**Severity:** 🟡 Medium
**Impact:** Results have nowhere to go. `resultCID` is a string with no actual storage.
**Fix:** Integrate Pinata, Web3.Storage, or self-hosted IPFS node. 2-day effort.

#### Gap 7: No XDC Wallet Support Testing
**Severity:** 🟡 Medium
**Impact:** Wagmi v2 needs custom chain config for XDC. XDCPay compatibility unknown.
**Fix:** Add XDC chain definition to Wagmi config, test with MetaMask + XDCPay. 2-day effort.

---

## 8. Hermes Agent Implementation Roadmap

This section is optimized for an AI agent (Hermes) to execute sequentially.

### Phase 1: Foundation (Week 1)

**Goal:** Make the backend and frontend runnable with mock data.

| Task | File(s) | Deliverable | Hermes Prompt |
|------|---------|-------------|---------------|
| 1.1 | `backend/app/main.py` | FastAPI scaffold with health check, CORS, config | "Create FastAPI app with `/health`, `/docs`, Pydantic models, and async SQLAlchemy setup." |
| 1.2 | `backend/app/models.py` | PostgreSQL schema: Job, Provider, Heartbeat, Receipt | "Create SQLAlchemy models matching the Solidity structs. Include indexes on `job_id`, `provider`, `state`." |
| 1.3 | `backend/app/api/jobs.py` | REST endpoints for jobs (CRUD + list) | "Create FastAPI router for jobs with pagination, filtering by state, and mock data for now." |
| 1.4 | `backend/app/api/providers.py` | REST endpoints for providers | "Create FastAPI router for providers with active list and reputation aggregation." |
| 1.5 | `client/src/app/layout.tsx` | Next.js root layout with Wagmi v2 provider | "Create Next.js 14 app layout with Wagmi v2 config including XDC Apothem chain, RainbowKit or custom connect." |
| 1.6 | `client/src/app/page.tsx` | Landing page with stats and CTAs | "Create landing page with hero, live stats cards, and buttons to /wizard and /provider. Use Shadcn/ui." |
| 1.7 | `docker-compose.yml` | Local dev stack: PostgreSQL + backend + client | "Create Docker Compose with PostgreSQL 15, FastAPI backend, Next.js dev server, and volume mounts." |

### Phase 2: Core User Flow (Week 2)

**Goal:** User can submit a job and monitor it via UI (mock provider for now).

| Task | File(s) | Deliverable | Hermes Prompt |
|------|---------|-------------|---------------|
| 2.1 | `client/src/app/wizard/page.tsx` | Job wizard: Docker URI, sliders, price preview | "Create stepper wizard with React Hook Form, Zod validation, and price estimation from backend." |
| 2.2 | `client/src/hooks/useSubmitJob.ts` | Wagmi hook for `submitJob` | "Create custom Wagmi v2 hook that calls `JobEscrow.submitJob` with deposit value, handles loading/errors." |
| 2.3 | `client/src/app/jobs/page.tsx` | My jobs list with status badges | "Create job list page with tabs: Pending, Active, Completed, Slashed. Pull from backend API." |
| 2.4 | `client/src/app/jobs/[id]/page.tsx` | Job detail with heartbeat graph | "Create job detail page with recharts heartbeat graph, status timeline, and challenge button." |
| 2.5 | `backend/app/websocket.py` | WebSocket manager for live updates | "Create FastAPI WebSocket endpoint that broadcasts job status changes to connected clients." |
| 2.6 | `client/src/app/explorer/page.tsx` | Public job explorer | "Create explorer page with filterable table, search, and pagination. No wallet required." |

### Phase 3: Provider Flow (Week 3)

**Goal:** Provider can register, download daemon, and run jobs.

| Task | File(s) | Deliverable | Hermes Prompt |
|------|---------|-------------|---------------|
| 3.1 | `client/src/app/provider/register/page.tsx` | Provider registration form + stake | "Create provider registration page with metadata form, stake amount input, and `registerProvider` Wagmi hook." |
| 3.2 | `client/src/app/provider/dashboard/page.tsx` | Provider dashboard | "Create provider dashboard with status indicator, earnings card, reputation score, and active job list." |
| 3.3 | `daemon/cmd/daemon/main.go` | Go daemon CLI entrypoint | "Create Go CLI with Cobra: `start`, `register`, `status` commands. Config via env + flags." |
| 3.4 | `daemon/internal/provisioner/docker.go` | Docker Engine API wrapper | "Create Go Docker provisioner with PullImage, RunContainer, StreamLogs, StopAndRemove. Use docker/client SDK." |
| 3.5 | `daemon/internal/verifier/signer.go` | EIP-712 heartbeat signer | "Create Go EIP-712 typed data signer using go-ethereum/crypto. Sign Heartbeat struct and return 65-byte sig." |
| 3.6 | `daemon/internal/heartbeat/broadcaster.go` | Background heartbeat ticker + submit | "Create Go background ticker that signs heartbeats and submits to `JobEscrow.submitHeartbeat` with retry." |
| 3.7 | `daemon/internal/watcher/watcher.go` | Event listener for JobSubmitted | "Create Go watcher that polls/logs for `JobSubmitted` events and enqueues jobs for provider to claim." |
| 3.8 | `daemon/internal/ipfs/uploader.go` | IPFS result uploader | "Create Go IPFS uploader using kubo/client or Pinata API. Upload stdout/stderr + result bundle." |

### Phase 4: Integration & Polish (Week 4)

**Goal:** Full E2E on XDC Apothem. Receipts, challenges, audits.

| Task | File(s) | Deliverable | Hermes Prompt |
|------|---------|-------------|---------------|
| 4.1 | `client/src/app/receipts/page.tsx` | Receipt gallery (public + my) | "Create receipt gallery page showing ProofReceipt NFTs with metadata, provider info, and verify button." |
| 4.2 | `client/src/app/receipts/[id]/page.tsx` | Receipt detail + audit | "Create receipt detail page with on-chain verification status, IPFS preview, and PDF audit export." |
| 4.3 | `client/src/hooks/useChallenge.ts` | Challenge provider hook | "Create Wagmi hook for `challengeProvider` with confirmation modal and success toast." |
| 4.4 | `backend/app/indexer.py` | Event indexer (background task) | "Create async background task that indexes `JobSubmitted`, `JobClaimed`, `HeartbeatReceived`, `JobCompleted`, `ProviderSlashed` into PostgreSQL." |
| 4.5 | `contracts/test/JobEscrow.t.sol` | Comprehensive Forge tests | "Write Foundry tests for: submitJob, claimJob, heartbeat verification, challenge/slash, cancelJob, edge cases." |
| 4.6 | `contracts/script/Deploy.s.sol` | Apothem deployment script | "Create Foundry deployment script for Apothem testnet with verifier, broadcast, and contract verification." |
| 4.7 | `README.md` | Full documentation | "Write comprehensive README with architecture diagram, setup instructions, API docs, and demo video link." |

---

## 9. Appendix: API Contract Specification

### 9.1 Request/Response Examples

#### Submit Job (Frontend → Backend → Chain)

```http
POST /api/quote
Content-Type: application/json

{
  "dockerUri": "docker.io/pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime",
  "cpuMilli": 4000,
  "ramMiB": 16384,
  "vramMiB": 8192,
  "durationBlocks": 1800,
  "maxPricePerBlock": 1000000000000000
}

Response 200:
{
  "estimatedCost": "1800000000000000000",
  "estimatedCostUsd": "0.018",
  "durationMinutes": 60,
  "recommendedProviders": 3
}
```

```http
POST /api/jobs
X-Wallet-Address: 0x1234...
X-Signature: 0xabcd...

{
  "txHash": "0x...",
  "jobId": 42,
  "spec": { ... }
}

Response 201:
{
  "id": 42,
  "status": "pending",
  "indexedAt": "2025-06-05T10:00:00Z"
}
```

#### Heartbeat Stream (WebSocket)

```json
// Client subscribes
{ "action": "subscribe", "topic": "job:42" }

// Server pushes
{ "type": "heartbeat", "jobId": 42, "blockNumber": 12345678, "uptimeSeconds": 300, "cpuPercent": 4500, "ramPercent": 7200, "timestamp": "2025-06-05T10:05:00Z" }
{ "type": "status_change", "jobId": 42, "from": "pending", "to": "active", "provider": "0x5678..." }
{ "type": "completed", "jobId": 42, "resultCID": "QmXyZ...", "cost": "1500000000000000000" }
```

### 9.2 Database Schema (PostgreSQL)

```sql
-- Jobs table
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    chain_job_id BIGINT UNIQUE NOT NULL,
    user_address VARCHAR(42) NOT NULL,
    provider_address VARCHAR(42),
    docker_uri TEXT NOT NULL,
    cpu_milli INT NOT NULL,
    ram_mib INT NOT NULL,
    vram_mib INT NOT NULL,
    duration_blocks INT NOT NULL,
    max_price_per_block NUMERIC(78,0) NOT NULL,
    deposit NUMERIC(78,0) NOT NULL,
    state VARCHAR(20) NOT NULL DEFAULT 'pending',
    started_at_block BIGINT,
    completed_at_block BIGINT,
    last_heartbeat_block BIGINT,
    result_cid TEXT,
    instruction_count BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_jobs_state ON jobs(state);
CREATE INDEX idx_jobs_user ON jobs(user_address);
CREATE INDEX idx_jobs_provider ON jobs(provider_address);

-- Heartbeats table
CREATE TABLE heartbeats (
    id SERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES jobs(chain_job_id),
    block_number BIGINT NOT NULL,
    uptime_seconds BIGINT NOT NULL,
    cpu_percent INT NOT NULL,
    ram_percent INT NOT NULL,
    vram_percent INT NOT NULL,
    signature BYTEA NOT NULL,
    digest BYTEA NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_heartbeats_job ON heartbeats(job_id);

-- Providers table
CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) PRIMARY KEY,
    metadata_uri TEXT,
    stake NUMERIC(78,0) NOT NULL,
    is_registered BOOLEAN DEFAULT TRUE,
    is_slashed BOOLEAN DEFAULT FALSE,
    total_jobs_completed INT DEFAULT 0,
    total_jobs_failed INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Receipts table
CREATE TABLE receipts (
    id SERIAL PRIMARY KEY,
    token_id BIGINT UNIQUE NOT NULL,
    job_id BIGINT REFERENCES jobs(chain_job_id),
    user_address VARCHAR(42) NOT NULL,
    provider_address VARCHAR(42) NOT NULL,
    result_cid TEXT,
    instruction_count BIGINT,
    cost NUMERIC(78,0),
    minted_at TIMESTAMP DEFAULT NOW()
);
```

---

## Summary for Hermes Agent

**What to build first:**
1. FastAPI backend with PostgreSQL schema and `/api/jobs`, `/api/providers` endpoints
2. Next.js frontend with Wagmi v2, XDC chain config, and `/wizard` + `/jobs/:id` pages
3. Go daemon with Docker provisioner, EIP-712 signer, and heartbeat broadcaster
4. Foundry tests for all slashing and signature paths
5. Event indexer connecting chain events to PostgreSQL

**What makes DICOMPUTE competitive:**
- The **ProofReceipt NFT** is the killer feature no one else has
- **EIP-712 heartbeat signatures** create real-time trust without central servers
- **Open challenge mechanism** aligns incentives for honest providers
- **XDC's 2s block time** makes heartbeat verification feasible and cheap

**What will fail if not fixed:**
- Without the backend API, the frontend is blind
- Without the Go daemon, providers cannot exist
- Without tests, the slash mechanism is a liability
- Without IPFS, results are vaporware

**Execute Phase 1 → 2 → 3 → 4 in order. Do not skip.**
