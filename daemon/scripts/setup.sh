#!/bin/bash
set -e

# DICOMPUTE Daemon Setup Script
# Run this to set up the daemon on a new machine

echo "========================================="
echo "  DICOMPUTE Daemon Setup"
echo "========================================="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt update
    sudo apt install -y docker.io
    sudo usermod -aG docker $USER
    echo "Docker installed. Please logout and login again."
fi

# Check Go
if ! command -v go &> /dev/null; then
    echo "Installing Go..."
    sudo apt install -y golang-go
fi

# Create directories
sudo mkdir -p /var/lib/dicompute/data
sudo mkdir -p /opt/dicompute/daemon
sudo mkdir -p /etc/dicompute

# Build daemon
echo "Building daemon..."
cd "$(dirname "$0")/.."
go build -o daemon ./cmd/daemon

# Copy files
sudo cp daemon /opt/dicompute/daemon/
sudo cp deployments/dicompute-daemon.service /etc/systemd/system/

# Create env file if not exists
if [ ! -f /etc/dicompute/daemon.env ]; then
    sudo cp .env.example /etc/dicompute/daemon.env
    echo "Created /etc/dicompute/daemon.env — please edit it!"
fi

# Start with docker-compose
echo "Starting with docker-compose..."
sudo docker-compose -f deployments/docker-compose.yml up -d postgres

echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Edit /etc/dicompute/daemon.env with your keys"
echo "2. Run: sudo systemctl enable --now dicompute-daemon"
echo "3. Check status: sudo systemctl status dicompute-daemon"
echo ""
