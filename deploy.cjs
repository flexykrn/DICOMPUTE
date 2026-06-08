const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // 1. Deploy DICOToken
  console.log("\n1. Deploying DICOToken...");
  const DICOToken = await hre.ethers.getContractFactory("DICOToken");
  const dicoToken = await DICOToken.deploy();
  await dicoToken.waitForDeployment();
  console.log("DICOToken deployed to:", await dicoToken.getAddress());

  // 2. Deploy GPURegistry
  console.log("\n2. Deploying GPURegistry...");
  const GPURegistry = await hre.ethers.getContractFactory("GPURegistry");
  const gpuRegistry = await GPURegistry.deploy();
  await gpuRegistry.waitForDeployment();
  console.log("GPURegistry deployed to:", await gpuRegistry.getAddress());

  // 3. Deploy ReputationSystem
  console.log("\n3. Deploying ReputationSystem...");
  const ReputationSystem = await hre.ethers.getContractFactory("ReputationSystem");
  const reputationSystem = await ReputationSystem.deploy();
  await reputationSystem.waitForDeployment();
  console.log("ReputationSystem deployed to:", await reputationSystem.getAddress());

  // 4. Deploy ProofReceipt
  console.log("\n4. Deploying ProofReceipt...");
  const ProofReceipt = await hre.ethers.getContractFactory("ProofReceipt");
  const proofReceipt = await ProofReceipt.deploy();
  await proofReceipt.waitForDeployment();
  console.log("ProofReceipt deployed to:", await proofReceipt.getAddress());

  // 5. Deploy JobEscrow
  console.log("\n5. Deploying JobEscrow...");
  const JobEscrow = await hre.ethers.getContractFactory("JobEscrow");
  const jobEscrow = await JobEscrow.deploy(
    await gpuRegistry.getAddress(),
    await reputationSystem.getAddress(),
    await proofReceipt.getAddress()
  );
  await jobEscrow.waitForDeployment();
  console.log("JobEscrow deployed to:", await jobEscrow.getAddress());

  // 6. Deploy DisputeResolution
  console.log("\n6. Deploying DisputeResolution...");
  const DisputeResolution = await hre.ethers.getContractFactory("DisputeResolution");
  const disputeResolution = await DisputeResolution.deploy(
    await jobEscrow.getAddress(),
    await gpuRegistry.getAddress()
  );
  await disputeResolution.waitForDeployment();
  console.log("DisputeResolution deployed to:", await disputeResolution.getAddress());

  // 7. Deploy ComputeMarketplace
  console.log("\n7. Deploying ComputeMarketplace...");
  const ComputeMarketplace = await hre.ethers.getContractFactory("ComputeMarketplace");
  const computeMarketplace = await ComputeMarketplace.deploy(
    await jobEscrow.getAddress(),
    await gpuRegistry.getAddress(),
    await reputationSystem.getAddress(),
    await proofReceipt.getAddress(),
    await disputeResolution.getAddress(),
    await dicoToken.getAddress()
  );
  await computeMarketplace.waitForDeployment();
  console.log("ComputeMarketplace deployed to:", await computeMarketplace.getAddress());

  // Save addresses
  const addresses = {
    DICOToken: await dicoToken.getAddress(),
    GPURegistry: await gpuRegistry.getAddress(),
    ReputationSystem: await reputationSystem.getAddress(),
    ProofReceipt: await proofReceipt.getAddress(),
    DisputeResolution: await disputeResolution.getAddress(),
    JobEscrow: await jobEscrow.getAddress(),
    ComputeMarketplace: await computeMarketplace.getAddress(),
    deployer: deployer.address,
    network: "apothem",
    chainId: 51,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync("deployed-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("\n✅ All contracts deployed!");
  console.log("Addresses saved to deployed-addresses.json");
  console.log("\nDeployed Addresses:");
  for (const [name, addr] of Object.entries(addresses)) {
    if (typeof addr === "string" && addr.startsWith("0x")) {
      console.log(`  ${name}: ${addr}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
