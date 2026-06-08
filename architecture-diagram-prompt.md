Create a brutalist technical architecture diagram for DICOMPUTE — a decentralized GPU compute marketplace on XDC Apothem blockchain. Style it exactly like the brutalist UI: thick 2px black borders, sharp 90° corners (no rounded edges), high-contrast black/white/yellow color scheme, monospace typography, bold uppercase labels with tight tracking, and a raw industrial aesthetic.

## Diagram Layout (Top-to-Bottom Data Flow)

**TOP SECTION — TENANT LAYER (White background, black border)**
- Left: "USER LAPTOP" box with sub-boxes:
  - "NEXT.JS FRONTEND" (React, wagmi, RainbowKit)
  - "METAMASK WALLET" (XDC Apothem Chain 51)
- Right: "SUBMIT JOB" action box with arrows pointing down
- Yellow accent: "BOUNTY LOCKED IN ESCROW"

**MIDDLE-LEFT — BACKEND LAYER (White background, black border)**
- "FASTAPI BACKEND" (Port 8001) with sub-components:
  - "BLOCKCHAIN INDEXER" (listens for JobSubmitted, JobClaimed, JobCompleted events)
  - "JOB SCHEDULER" (assigns pending jobs to providers)
  - "SQLITE DATABASE" (stores jobs, heartbeats, receipts)
- Arrows: Frontend → Backend API, Backend → Blockchain RPC

**MIDDLE-RIGHT — DAEMON LAYER (White background, black border)**
- "GO DAEMON" (Port 8080) with sub-components:
  - "JOB WATCHER" (polls /api/jobs/pending)
  - "BLOCKCHAIN CLIENT" (go-ethereum, calls claimJob + submitResults)
  - "DOCKER PROVISIONER" (pulls images, runs containers)
  - "GPU PASSTHROUGH" (NVIDIA Container Toolkit, Count: -1)
  - "HEARTBEAT GENERATOR" (EIP-712 signed attestations)
  - "IPFS UPLOADER" (Pinata JWT, uploads logs)
- Arrows: Daemon → Blockchain, Daemon → Docker, Daemon → Backend

**BOTTOM SECTION — BLOCKCHAIN LAYER (Yellow background box, black border)**
- "XDC APOTHEM TESTNET (CHAIN 51)" with three contract boxes:
  - "JOBESCROW" (0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075) — holds deposits, manages job states, pays provider, refunds tenant
  - "GPUREGISTRY" (0xCEf0f0E74e618A95Da97e1216F81d74eA01dE77C) — provider registration, 0.1 XDC stake, slashing
  - "PROOFRECEIPT" (0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2) — NFT minted on completion
- Arrows: All layers connect to Blockchain
- Yellow highlight: "ON-CHAIN SETTLEMENT" + "PROOFRECEIPT NFT MINTED"

## Visual Style Requirements

- **Colors**: Black (#000000), White (#FFFFFF), Yellow (#FFD700 or #FACC15), subtle Gray (#F7F7F5) for secondary boxes
- **Borders**: 2px solid black everywhere, no shadows, no gradients
- **Typography**: Monospace font (Courier, JetBrains Mono, or similar), bold weight, uppercase for headers, tight letter-spacing
- **Corners**: 90° sharp corners only, absolutely no border-radius
- **Layout**: Strict grid alignment, boxes aligned horizontally and vertically with equal spacing
- **Arrows**: Thick black lines (2px) with triangular arrowheads, connecting boxes directly
- **Data Flow**: Numbers on arrows showing sequence: 1. submitJob, 2. claimJob, 3. Docker run, 4. heartbeats, 5. submitResults, 6. JobCompleted event, 7. NFT minted
- **Box Style**: Each component is a rectangle with black border, white fill, header in bold black text with yellow background strip
- **Contrast**: Maximum contrast, no subtle colors, everything is either black, white, or yellow
- **Texture**: Raw, utilitarian, no decorative elements, like a 1980s technical manual or a Bauhaus poster
- **Overall Feel**: Industrial, honest, no-nonsense, aggressive grid structure, heavy borders, functional beauty

Include small labels showing the actual technologies: "React 18 + TypeScript", "FastAPI + SQLAlchemy", "Go 1.22 + geth", "Solidity + Hardhat", "Docker + NVIDIA runtime", "IPFS via Pinata", "XDC Apothem RPC".

The image should look like a blueprint meets a punk zine — precise, technical, but visually brutal and unapologetic.
