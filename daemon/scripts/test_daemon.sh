#!/bin/bash

# DICOMPUTE Daemon Test Script
# Runs mock backend + daemon in mock mode for end-to-end testing

set -e

DAEMON_DIR="/home/rudra/Project/nocapcomput/DICOMPUTE/daemon"
GREEN='\033[92m'
BLUE='\033[94m'
YELLOW='\033[93m'
CYAN='\033[96m'
RESET='\033[0m'

echo -e "${CYAN}========================================${RESET}"
echo -e "${CYAN}  DICOMPUTE Daemon E2E Test${RESET}"
echo -e "${CYAN}========================================${RESET}"

# Step 1: Start mock backend
echo -e "\n${BLUE}[1/4] Starting mock backend server...${RESET}"
cd "$DAEMON_DIR"
go run scripts/mock_backend.go &
BACKEND_PID=$!
sleep 2

# Step 2: Set env for mock mode
echo -e "\n${BLUE}[2/4] Configuring daemon for mock mode...${RESET}"
export PROVIDER_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
export PROVIDER_ADDRESS=0xMockProvider1234567890abcdef
export BACKEND_URL=http://localhost:8000
export BACKEND_API_KEY=test-key
export HEARTBEAT_INTERVAL=5s
export HEARTBEAT_COUNT=3
export DATA_VOLUME_PATH=/tmp/dicompute-data
export LOG_LEVEL=info

mkdir -p "$DATA_VOLUME_PATH"

# Step 3: Run daemon in mock mode
echo -e "\n${BLUE}[3/4] Starting daemon (mock provisioner)...${RESET}"
echo -e "${YELLOW}    The daemon will connect to mock backend${RESET}"
echo -e "${YELLOW}    A demo job will be assigned in ~5 seconds${RESET}"
echo -e "${YELLOW}    Press Ctrl+C to stop${RESET}\n"

sleep 1
go run ./cmd/daemon

# Cleanup
echo -e "\n${BLUE}[4/4] Cleaning up...${RESET}"
kill $BACKEND_PID 2>/dev/null || true

echo -e "${GREEN}Test complete!${RESET}"
