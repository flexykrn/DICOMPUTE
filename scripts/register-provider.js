const hre = require("hardhat");

async function main() {
  const providerAddress = process.env.PROVIDER_ADDRESS;
  const providerPrivateKey = process.env.PROVIDER_PRIVATE_KEY;
  
  if (!providerAddress || !providerPrivateKey) {
    console.error("Set PROVIDER_ADDRESS and PROVIDER_PRIVATE_KEY in env");
    process.exit(1);
  }

  const [funder] = await hre.ethers.getSigners();
  const provider = new hre.ethers.Wallet(providerPrivateKey, hre.ethers.provider);
  
  console.log("Provider address:", provider.address);
  console.log("Funder address:", funder.address);

  const addresses = require("./deployed-addresses.json");
  const gpuRegistry = await hre.ethers.getContractAt("GPURegistry", addresses.GPURegistry);
  
  // Check if already registered
  const providerInfo = await gpuRegistry.providers(provider.address);
  if (providerInfo.isRegistered) {
    console.log("Provider already registered!");
    console.log("Stake:", hre.ethers.formatEther(providerInfo.stake), "XDC");
    return;
  }

  // Fund provider if needed
  const balance = await hre.ethers.provider.getBalance(provider.address);
  const minStake = await gpuRegistry.MIN_STAKE();
  
  if (balance < minStake) {
    console.log("Funding provider wallet...");
    const tx = await funder.sendTransaction({
      to: provider.address,
      value: minStake + hre.ethers.parseEther("0.1"), // Extra for gas
    });
    await tx.wait();
    console.log("Funded!");
  }

  // Register provider with metadata
  const metadata = JSON.stringify({
    name: "DICOMPUTE Provider",
    gpu: "NVIDIA RTX 4090",
    vram: "24GB",
    location: "Local",
  });

  console.log("Registering provider with", hre.ethers.formatEther(minStake), "XDC stake...");
  const tx = await gpuRegistry.connect(provider).registerProvider(metadata, { value: minStake });
  await tx.wait();
  
  console.log("✅ Provider registered successfully!");
  console.log("Address:", provider.address);
  console.log("GPURegistry:", addresses.GPURegistry);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
