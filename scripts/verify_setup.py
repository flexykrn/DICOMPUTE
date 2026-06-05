#!/usr/bin/env python3
"""
Quick setup verification for GPU provider
Run this before starting gpu_provider.py to check your environment
"""

import subprocess
import sys

def check(name, cmd, expected_in_output=None):
    """Run a command and check if it succeeds"""
    print(f"Checking {name}...", end=" ")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            if expected_in_output and expected_in_output not in result.stdout:
                print(f"❌ (missing: {expected_in_output})")
                return False
            print("✅")
            return True
        else:
            print(f"❌")
            return False
    except Exception as e:
        print(f"❌ ({e})")
        return False

def main():
    print("=" * 60)
    print("DICOMPUTE GPU Provider Setup Verification")
    print("=" * 60)
    
    checks = []
    
    # Check Python packages
    checks.append(check("Python web3", "python -c 'import web3; print(web3.__version__)'", "."))
    checks.append(check("Python psutil", "python -c 'import psutil; print(psutil.__version__)'", "."))
    checks.append(check("Python requests", "python -c 'import requests; print(requests.__version__)'", "."))
    checks.append(check("Python dotenv", "python -c 'import dotenv; print(\"OK\")'", "OK"))
    
    # Check Docker
    checks.append(check("Docker", "docker --version", "Docker"))
    
    # Check NVIDIA
    checks.append(check("NVIDIA Driver", "nvidia-smi", "NVIDIA"))
    checks.append(check("NVIDIA Docker", "docker run --rm --gpus all nvidia/cuda:12.1-base nvidia-smi", "NVIDIA"))
    
    # Check PyTorch image
    checks.append(check("PyTorch Image", "docker images | grep pytorch", "pytorch"))
    
    # Check ABI file
    checks.append(check("Contract ABI", "python -c 'import json; json.load(open(\"../artifacts/contracts/src/JobEscrow.sol/JobEscrow.json\"))'", ""))
    
    print("=" * 60)
    passed = sum(checks)
    total = len(checks)
    print(f"Results: {passed}/{total} checks passed")
    
    if passed == total:
        print("🎉 All checks passed! You're ready to run gpu_provider.py")
        print("Run: python gpu_provider.py")
        return 0
    else:
        print("⚠️  Some checks failed. See GPU_PROVIDER_README.md for setup instructions.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
