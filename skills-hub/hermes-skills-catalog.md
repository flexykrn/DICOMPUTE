---
name: hermes-skills-catalog
title: Hermes Agent Skills Catalog
version: 1.0
description: Complete index of all 95 optional skills from the Hermes Agent Skills Hub with categories, names, and local mirror paths.
---

# Hermes Agent Skills Catalog

Source: https://github.com/NousResearch/hermes-agent/tree/main/optional-skills
Docs: https://hermes-agent.nousresearch.com/docs/skills/

Local mirror: `/mnt/c/Users/karan/Desktop/openscans/dicompute/skills-hub/`
Manifest: `/mnt/c/Users/karan/Desktop/openscans/dicompute/skills-hub/manifest.json`

## Categories (20 total, 95 skills)

### autonomous-ai-agents (5)
- antigravity-cli
- blackbox
- grok
- honcho
- openhands

### blockchain (3)
- evm
- hyperliquid
- solana

### communication (1)
- one-three-one-rule

### creative (9)
- baoyu-article-illustrator
- baoyu-comic
- blender-mcp
- concept-diagrams
- creative-ideation
- hyperframes
- kanban-video-orchestrator
- meme-generation
- pixel-art

### devops (5)
- cli
- docker-management
- hermes-s6-container-supervision
- pinggy-tunnel
- watchers

### dogfood (1)
- adversarial-ux-test

### email (1)
- agentmail

### finance (8)
- 3-statement-model
- comps-analysis
- dcf-model
- excel-author
- lbo-model
- merger-model
- pptx-author
- stocks

### gaming (2)
- minecraft-modpack-server
- pokemon-player

### health (2)
- fitness-nutrition
- neuroskill-bci

### mcp (2)
- fastmcp
- mcporter

### migration (1)
- openclaw-migration

### mlops (26)
- accelerate
- chroma
- clip
- faiss
- flash-attention
- guidance
- huggingface-tokenizers
- inference (outlines)
- instructor
- lambda-labs
- llava
- modal
- nemo-curator
- peft
- pinecone
- pytorch-fsdp
- pytorch-lightning
- qdrant
- research (dspy)
- saelens
- simpo
- slime
- stable-diffusion
- tensorrt-llm
- torchtitan
- training (axolotl, trl-fine-tuning, unsloth)
- whisper

### productivity (7)
- canvas
- here-now
- memento-flashcards
- shop-app
- shopify
- siyuan
- telephony

### research (11)
- bioinformatics
- darwinian-evolver
- domain-intel
- drug-discovery
- duckduckgo-search
- gitnexus-explorer
- osint-investigation
- parallel-cli
- qmd
- scrapling
- searxng-search

### security (4)
- 1password
- oss-forensics
- sherlock
- web-pentest

### software-development (3)
- code-wiki
- rest-graphql-debug
- subagent-driven-development

### web-development (1)
- page-agent

## Memory Plugins (Built-in, not optional skills)

### supermemory
- **Path:** `plugins/memory/supermemory/`
- **Files:** `README.md`, `plugin.yaml`, `__init__.py`
- **Description:** Semantic long-term memory with profile recall, semantic search, explicit memory tools, and full-session conversation ingest.
- **Setup:** `hermes memory setup` → select "supermemory", or `hermes config set memory.provider supermemory`
- **Requires:** `SUPERMEMORY_API_KEY` env var, `pip install supermemory`
- **Config:** `$HERMES_HOME/supermemory.json`
- **Tools:**
  - `supermemory-save` / `supermemory_store` — Store an explicit memory
  - `supermemory-search` / `supermemory_search` — Search memories by semantic similarity
  - `supermemory-forget` / `supermemory_forget` — Forget a memory by ID or best-match query
  - `supermemory-profile` / `supermemory_profile` — Retrieve persistent profile and recent context
- **Features:**
  - Auto-recall: Injects relevant memory context before each turn
  - Auto-capture: Stores cleaned user-assistant turns after each response
  - Session ingest: Buffers full conversation and ingests as one session at end/reset/shutdown
  - Profile-scoped containers: Use `{identity}` template in `container_tag` for per-profile memory isolation
  - Multi-container mode: Read/write across multiple named containers (advanced setups)
  - Source attribution: All writes tagged with `x-sm-source: hermes` for filtering in Supermemory UI
- **Key config keys:** `container_tag`, `auto_recall`, `auto_capture`, `max_recall_results`, `profile_frequency`, `search_mode` (hybrid/memories/documents), `api_timeout`

## How to Use

Load any skill with: `skill_view(name='<category>/<skill-name>')`

Example: `skill_view(name='blockchain/evm')`

The local mirror contains all SKILL.md files at `skills-hub/<category>/<skill-name>/SKILL.md`.
