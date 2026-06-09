# DICOMPUTE: The TED Talk Script
## "Why Your GPU is the Most Underpaid Worker in the World"

---

## OPENING HOOK (30 seconds)

*[Walk to center stage, pause, look at audience]*

Every single day, the most powerful computers on Earth sit idle for 22 hours. 

Not in warehouses. Not in government labs. 

They're sitting in bedrooms, dorm rooms, and home offices. 

Your neighbor's RTX 4090. That gaming PC collecting dust after someone built it for Cyberpunk 2077. The workstation a freelancer bought for Blender renders but only uses twice a week.

Meanwhile, on the other side of the world, a PhD student in Nairobi waits three weeks for her turn on an AWS GPU instance because her grant can't afford the $32 per hour that Amazon charges.

This is the most absurd market inefficiency in all of computing. And today, I'm going to show you how we fix it.

*[Pause]*

I'm Karan, and this is DICOMPUTE.

---

## THE PROBLEM: THREE LIES (2 minutes)

*[Walk left stage]*

The cloud computing industry tells you three lies.

**Lie number one:** "GPUs are expensive." 

No. Manufacturing is expensive. But once that GPU exists, the marginal cost of running it is electricity plus depreciation. An RTX 4090 costs $1,600 once. AWS charges you $3.06 per hour for a V100 that is literally slower. You could buy your own GPU every 522 hours of usage. That's three weeks of continuous training.

**Lie number two:** "You can trust us with your data."

You send your proprietary model, your medical imaging dataset, your financial simulation to a centralized server. You sign terms of service you don't read. You pray their security team is competent. In 2023 alone, cloud misconfigurations exposed 33 billion records. But you have no choice, right?

**Lie number three:** "We can prove we ran your job."

No, they can't. You get a log file. A timestamp. An invoice. But there is no cryptographic proof that your specific Docker container executed on that specific hardware with those specific parameters. If Amazon's scheduler has a bug and your job runs on CPU instead of GPU, how would you even know? You paid for A100s and got emulated CUDA on a K80. Prove me wrong.

*[Walk to center]*

These lies persist because there has never been an alternative. You either pay the cloud tax or you don't compute. Until now.

---

## THE VISION: COMPUTE AS A COMMONS (1.5 minutes)

*[Gesture broadly]*

What if computing worked like Airbnb, but with mathematical guarantees?

What if your idle GPU could earn you money while you sleep, automatically, without you managing anything?

What if that PhD student in Nairobi could rent your GPU for 80% less than AWS, with cryptographic proof that her job actually ran, and automatic payment release only after verified completion?

This is not a fantasy. The technology exists. We built it.

DICOMPUTE is a decentralized marketplace for GPU compute where:
- Tenants submit Docker-based jobs with resource requirements and payment
- Providers with available GPUs claim and execute those jobs
- Smart contracts hold payment in escrow until cryptographic proof of execution is submitted
- Every completed job mints an NFT as an immutable certificate of computation

No trust required. No central authority. Just math, economics, and code.

---

## HOW IT WORKS: THE FOUR PILLARS (4 minutes)

*[Move to presentation screen]*

Let me walk you through the architecture, because this is where it gets beautiful.

### Pillar One: Economic Security

When a tenant submits a job, they don't send money to a provider. They send it to a smart contract. The funds are locked. Frozen. Unreachable by anyone.

The provider must stake collateral — 0.1 XDC — to even participate. If they cheat, they lose this stake. If they fail to complete the job, they lose this stake. This creates skin in the game without requiring anyone to trust anyone.

*[Pause for emphasis]*

This is not a reputation system. Reputation systems can be gamed. This is economic deterrence. The math is simple: cheating costs more than honesty.

### Pillar Two: Cryptographic Proof

Here's where we get clever. When a provider claims a job, they must send heartbeat attestations every 30 seconds. These aren't just HTTP pings. These are EIP-712 signed messages that include:
- The job ID
- A hash of the current execution state
- A timestamp
- The provider's cryptographic signature

These heartbeats are stored on-chain. If a provider misses three consecutive heartbeats, anyone can challenge them and claim their staked collateral. The tenant gets refunded. The challenger gets rewarded. The bad actor gets punished.

*[Look at audience]*

Think about what this means. For the first time in history, you can prove — not claim, not assert, but mathematically prove — that a specific computation ran on specific hardware for a specific duration.

### Pillar Three: Verifiable Execution

When the job completes, the provider uploads execution logs and outputs to IPFS — decentralized storage. They receive a Content Identifier, a CID, which is a cryptographic hash of the data.

This CID is submitted to the smart contract. The contract verifies:
- Were all required heartbeats present?
- Did the job complete within the maximum duration?
- Is the result CID properly formatted?

Only then does the contract release payment to the provider and mint a ProofReceipt NFT to the tenant.

*[Pause]*

This NFT is not a JPEG. It is a permanent, transferable, verifiable certificate containing:
- The exact job specification
- The provider's identity and hardware specs
- The execution timeline
- The result CID on IPFS
- The payment amount and block number

You can show this NFT to your grant committee. Your auditor. Your journal reviewer. It is proof that you did the work, where you did it, and what it cost.

### Pillar Four: Decentralized Infrastructure

*[Gesture to architecture diagram]*

The system runs on four layers:

**Frontend:** Next.js application with RainbowKit wallet connection. Works on mobile, desktop, any device with a browser.

**Backend:** FastAPI indexer that listens to blockchain events, maintains a SQLite database of job states, and serves REST API endpoints. Lightweight enough to run on a Raspberry Pi.

**Blockchain:** XDC Apothem Testnet — EVM-compatible, 2-second block time, near-zero gas fees. A job submission costs less than a cent. A heartbeat costs fractions of a cent.

**Provider Daemon:** Go application that runs on the provider's machine. It polls the blockchain for pending jobs, claims matching ones, executes Docker containers with NVIDIA GPU passthrough, sends heartbeats, and submits results. Fully autonomous.

---

## LIVE DEMONSTRATION (3 minutes)

*[Switch to laptop]*

Let me show you this working, right now, in production.

*[Open browser to https://dicompute.onrender.com]*

This is the DICOMPUTE landing page. You can see live statistics: total jobs submitted, active providers, completed computations. These numbers are real. This is not a mockup.

*[Click "Launch App"]*

I connect my MetaMask wallet. I'm on XDC Apothem Testnet — Chain 51. The network is live, has been for years, processes thousands of transactions daily.

*[Navigate to /wizard]*

Here's the job submission wizard. I need to train a small neural network for my research. I specify:
- Docker image: `pytorch/pytorch:latest`
- CPU: 4 cores
- RAM: 16 GB
- VRAM: 8 GB
- Duration: 100 blocks — about 3 minutes
- Max price: 0.001 XDC per block

Total estimated cost: 0.1 XDC. At current prices, that's about $0.01. On AWS, the equivalent GPU time would cost $1.50. That's a 150x cost reduction.

*[Click "Submit Job"]*

MetaMask pops up. I confirm the transaction. The job is now on the blockchain.

*[Navigate to /explorer]*

Here in the explorer, I can see my job. Status: Pending. It's waiting for a provider to claim it.

*[Switch to provider terminal]*

On my teammate's machine — which has an NVIDIA RTX 3080 — the provider daemon is running. It's a Go application, about 50MB, using less memory than Chrome. It sees my job on the blockchain. It checks: do I have enough GPU memory? Yes. Is my stake sufficient? Yes. It calls `claimJob()`.

*[Show daemon logs]*

The logs show:
```
Job 42 claimed successfully
Pulling image: pytorch/pytorch:latest
Container started with GPU passthrough
Sending heartbeat #1...
Sending heartbeat #2...
Sending heartbeat #3...
Container completed with exit code 0
Uploading results to IPFS...
Results submitted on-chain
```

*[Switch back to browser]*

The explorer updates. Status: Active. Then: Completed. I refresh my dashboard.

*[Show dashboard]*

There's my ProofReceipt NFT. Token ID 7. I can click it and see:
- The exact Docker image used
- The provider's wallet address
- Every heartbeat timestamp
- The IPFS CID for my results
- The transaction hash for verification

*[Hold up hand]*

This entire flow — from job submission to NFT receipt — took under 5 minutes. Cost under a cent. Provided cryptographic proof of execution. And paid a provider directly, peer-to-peer, without any company taking a cut.

---

## THE TECHNOLOGY STACK (2 minutes)

*[Return to center stage]*

You might be wondering: why XDC? Why not Ethereum? Why not Solana?

XDC Network is EVM-compatible, which means all our Solidity contracts work without modification. But unlike Ethereum mainnet, where a simple transaction costs $5-50, XDC transactions cost fractions of a cent. A heartbeat every 30 seconds would be economically impossible on Ethereum. On XDC, it's negligible.

The 2-second block time means near-instant finality. When a provider claims a job, the tenant knows within seconds. No waiting 12 minutes for Ethereum confirmations.

And XDC is enterprise-focused. It has trade finance partnerships, regulatory clarity, and a path to mainnet deployment that doesn't require reinventing everything.

*[Pause]*

For the smart contracts, we use Foundry — the modern Ethereum development framework. Our test suite includes property-based fuzzing, invariant testing, and formal verification of critical paths.

The provider daemon is written in Go because we need reliability. This code runs unattended on machines that might not be checked for weeks. Memory leaks are unacceptable. Goroutines and channels give us concurrency without the complexity of async/await or callback hell.

The frontend uses Next.js 14 with the App Router, which gives us server-side rendering for SEO and client-side interactivity for the wallet connection. RainbowKit handles wallet abstraction — MetaMask, WalletConnect, Coinbase Wallet, whatever the user prefers.

---

## THE MARKET OPPORTUNITY (1.5 minutes)

*[Walk right stage]*

Let me give you some numbers.

The global cloud GPU market is $25 billion and growing 25% annually. AI training costs are increasing 10x every two years. GPT-4 reportedly cost $100 million to train. GPT-5 will cost more.

Meanwhile, there are an estimated 50 million high-end GPUs in consumer hands worldwide. Gaming PCs, mining rigs, workstations. Each one sits idle 70% of the time. That's 35 million GPUs doing nothing, right now, while researchers queue for cloud instances.

The arbitrage is obvious. AWS charges $32/hour for an A100. The actual electricity cost to run that A100 is about $0.50/hour. The rest is margin — data center real estate, cooling, staffing, and pure profit.

What if providers could earn $5/hour — 10x their electricity cost — while tenants pay $8/hour — 4x less than AWS? Both parties win. The only loser is the cloud monopoly.

*[Pause]*

And this isn't just about cost. It's about access. A researcher in Kenya can't get an AWS account without a credit card. But they can install MetaMask and buy XDC from a local exchange. DICOMPUTE democratizes access to compute in a way that centralized cloud never can.

---

## CHALLENGES AND SOLUTIONS (2 minutes)

*[Return to center, serious tone]*

I'll be honest with you. This is hard. Really hard. We've solved some problems. Others we're still working on.

**Challenge: Verification.** How do you prove a provider actually ran the job on GPU, not just CPU emulation?

Our current answer: heartbeat attestations plus result validation. If you submit a machine learning job, the results include model weights. If those weights are wrong — if the provider cheated — the tenant can challenge and we verify on-chain. For deterministic computations, we can use optimistic rollups with fraud proofs.

**Challenge: Privacy.** What if your job involves sensitive data?

We're integrating Trusted Execution Environments — Intel SGX, AMD SEV. The provider's hardware creates an encrypted enclave that even they can't inspect. Your data is decrypted only inside the enclave, processed, and encrypted results are sent back.

**Challenge: Network effects.** A marketplace needs providers to attract tenants, and tenants to attract providers.

Our strategy: start with specific verticals. AI/ML training for academic researchers. Blender rendering for 3D artists. Password cracking for security professionals. Each vertical has a community that can bootstrap the other side.

---

## THE FUTURE: A ROADMAP (1.5 minutes)

*[Energized]*

This is just the beginning.

**Phase One** — what we have now — is the core marketplace. Job submission, claiming, execution, verification, payment.

**Phase Two** adds continuous payment. Instead of paying upfront for the full duration, tenants pay per heartbeat. Like streaming, but for compute. This reduces risk for tenants and improves cash flow for providers.

**Phase Three** introduces a reputation system on top of the economic security. Providers with 1000 successful jobs and zero challenges get priority matching. Not because we trust them — but because they've proven themselves through repeated interactions.

**Phase Four** is multi-chain. Polygon for Ethereum compatibility. Arbitrum for lower costs. Solana for high-frequency trading computations. The marketplace becomes chain-agnostic.

**Phase Five** — and this is the big one — is autonomous compute agents. An AI researcher doesn't manually submit jobs. Their agent monitors their experiments, provisions compute automatically, optimizes for cost vs. speed, and reports back with results and ProofReceipts.

*[Pause]*

Imagine a world where compute is as liquid as money. Where you don't think about servers, instances, or regions. Where your research just runs, anywhere, verified, at market price.

That's the world we're building.

---

## CLOSING: THE CALL TO ACTION (1 minute)

*[Walk to front of stage, direct eye contact]*

I started this talk with a statistic: 50 million GPUs sitting idle while researchers wait in queues.

Here's another statistic: DICOMPUTE is live. Right now. You can go to dicompute.onrender.com and submit a job. You can download our provider daemon and start earning from your idle GPU tonight.

This is not a whitepaper. This is not a promise. This is code that runs, contracts that execute, and a marketplace that functions.

*[Pause]*

The cloud computing industry has had a monopoly on trust for twenty years. They told us we had to trust them with our data, our workloads, our payments. They told us cryptographic proof was impossible. They told us decentralization was inefficient.

They were wrong.

*[Raise voice slightly]*

The most powerful force in technology is not a company. It's not a government. It's a protocol that aligns incentives so perfectly that cheating becomes irrational and cooperation becomes inevitable.

That's DICOMPUTE. That's the future of compute. And it's already here.

*[Pause, smile]*

Thank you.

*[Walk off stage]*

---

## APPENDIX: Q&A PREPARATION

### Expected Questions and Answers

**Q: What happens if a provider goes offline mid-job?**
A: After three missed heartbeats, the job becomes claimable by another provider. The original provider loses their stake. The tenant can resubmit with the same or different parameters.

**Q: How do you prevent Sybil attacks?**
A: The 0.1 XDC stake requirement raises the barrier. Creating 1000 fake providers costs 100 XDC. More importantly, our reputation system weights historical performance, so new providers get fewer job matches initially.

**Q: Why Docker? Why not VMs or unikernels?**
A: Docker is the standard for reproducible compute. Every ML framework, every scientific tool, every data pipeline already has a Docker image. VMs add overhead. Unikernels require recompilation. Docker hits the sweet spot of portability and performance.

**Q: What about data transfer costs?**
A: For small models and datasets, IPFS is nearly free. For large datasets (100GB+), we're integrating Filecoin and Storj for cheaper bulk storage. The job specification includes input CIDs, so data never touches our servers.

**Q: Is this legal? What about regulations?**
A: We're a marketplace protocol, not a service provider. Like Uniswap or eBay, we don't custody funds or execute jobs — smart contracts and users do. Each jurisdiction may have specific requirements, and providers are responsible for compliance in their location.

**Q: What's your business model?**
A: Currently, zero fees. We take no cut from transactions. Long-term, we may introduce a 0.5% protocol fee on job payments, entirely governed by a DAO where token holders vote on parameters.

**Q: How can I help?**
A: Three ways: One, run a provider node if you have a GPU. Two, submit jobs and give us feedback. Three, contribute code — we're open source on GitHub.

---

## SPEAKER NOTES

### Timing
- Opening Hook: 30s
- The Problem: 2m
- The Vision: 1.5m
- Four Pillars: 4m
- Live Demo: 3m
- Technology Stack: 2m
- Market Opportunity: 1.5m
- Challenges: 2m
- Future Roadmap: 1.5m
- Closing: 1m
- **Total: 19 minutes** (perfect for TED-style 18-20 min format)

### Stage Directions
- Use left stage for problems/challenges (negative space)
- Use center stage for vision/solutions (neutral space)
- Use right stage for future/opportunities (positive space)
- Return to center for emotional peaks

### Tone Shifts
- Opening: Conversational, intriguing
- Problem: Slightly angry, incredulous
- Vision: Inspirational, expansive
- Technical: Clear, educational but not condescending
- Demo: Excited, showing off
- Closing: Triumphant, call to action

### Props Needed
- Laptop with live demo prepared
- Backup video of demo in case of connectivity issues
- Clicker for presentation slides
- Water bottle (hidden)

### Emergency Plans
- If demo fails: "And this is exactly why we need decentralized infrastructure — even TED's WiFi is centralized and unreliable." Then show pre-recorded video.
- If heckled about crypto: "I'm not here to sell you on cryptocurrency. I'm here to sell you on cryptographic proof. The token is just how we coordinate."
- If asked about environmental impact: "One shared GPU doing useful work is better than ten GPUs mining Bitcoin. We're repurposing existing hardware, not burning more coal."

---

*End of Script*
