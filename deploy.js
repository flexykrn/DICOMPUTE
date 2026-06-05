const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "XDC");

  // 1. Deploy DICOToken
  console.log("\n1. Deploying DICOToken...");
  const DICOToken = await hre.ethers.getContractFactory("DICOToken");
  const dicoToken = await DICOToken.deploy();
  await dicoToken.waitForDeployment();
  const dicoTokenAddr = await dicoToken.getAddress();
  console.log("DICOToken:", dicoTokenAddr);

  // 2. Deploy GPURegistry
  console.log("\n2. Deploying GPURegistry...");
  const GPURegistry = await hre.ethers.getContractFactory("GPURegistry");
  const gpuRegistry = await GPURegistry.deploy();
  await gpuRegistry.waitForDeployment();
  const gpuRegistryAddr = await gpuRegistry.getAddress();
  console.log("GPURegistry:", gpuRegistryAddr);

  // 3. Deploy ReputationSystem
  console.log("\n3. Deploying ReputationSystem...");
  const ReputationSystem = await hre.ethers.getContractFactory("ReputationSystem");
  const reputationSystem = await ReputationSystem.deploy();
  await reputationSystem.waitForDeployment();
  const reputationSystemAddr = await reputationSystem.getAddress();
  console.log("ReputationSystem:", reputationSystemAddr);

  // 4. Deploy ProofReceipt
  console.log("\n4. Deploying ProofReceipt...");
  const ProofReceipt = await hre.ethers.getContractFactory("ProofReceipt");
  const proofReceipt = await ProofReceipt.deploy();
  await proofReceipt.waitForDeployment();
  const proofReceiptAddr = await proofReceipt.getAddress();
  console.log("ProofReceipt:", proofReceiptAddr);

  // 5. Deploy DisputeResolution
  console.log("\n5. Deploying DisputeResolution...");
  const DisputeResolution = await hre.ethers.getContractFactory("DisputeResolution");
  const disputeResolution = await DisputeResolution.deploy();
  await disputeResolution.waitForDeployment();
  const disputeResolutionAddr = await disputeResolution.getAddress();
  console.log("DisputeResolution:", disputeResolutionAddr);

  // 6. Deploy JobEscrow
  console.log("\n6. Deploying JobEscrow...");
  const JobEscrow = await hre.ethers.getContractFactory("JobEscrow");
  const jobEscrow = await JobEscrow.deploy(gpuRegistryAddr, reputationSystemAddr, proofReceiptAddr, dicoTokenAddr);
  await jobEscrow.waitForDeployment();
  const jobEscrowAddr = await jobEscrow.getAddress();
  console.log("JobEscrow:", jobEscrowAddr);

  // 7. Deploy ComputeMarketplace
  console.log("\n7. Deploying ComputeMarketplace...");
  const ComputeMarketplace = await hre.ethers.getContractFactory("ComputeMarketplace");
  const computeMarketplace = await ComputeMarketplace.deploy(jobEscrowAddr, gpuRegistryAddr);
  await computeMarketplace.waitForDeployment();
  const computeMarketplaceAddr = await computeMarketplace.getAddress();
  console.log("ComputeMarketplace:", computeMarketplaceAddr);

  // Set JobEscrow in ProofReceipt
  console.log("\nSetting JobEscrow in ProofReceipt...");
  const tx = await proofReceipt.setJobEscrow(jobEscrowAddr);
  await tx.wait();
  console.log("Done!");

  // Save addresses
  const addresses = {
    DICOToken: dicoTokenAddr,
    GPURegistry: gpuRegistryAddr,
    ReputationSystem: reputationSystemAddr,
    ProofReceipt: proofReceiptAddr,
    DisputeResolution: disputeResolutionAddr,
    JobEscrow: jobEscrowAddr,
    ComputeMarketplace: computeMarketplaceAddr,
    deployer: deployer.address,
    network: "apothem",
    chainId: 51,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync("deployed-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("\n✅ All contracts deployed!");
  console.log("Addresses saved to deployed-addresses.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
