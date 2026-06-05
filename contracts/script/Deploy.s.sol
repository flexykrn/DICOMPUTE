// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/GPURegistry.sol";
import "../src/ReputationSystem.sol";
import "../src/ProofReceipt.sol";
import "../src/DICOToken.sol";
import "../src/JobEscrow.sol";
import "../src/DisputeResolution.sol";
import "../src/ComputeMarketplace.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy contracts
        GPURegistry gpuRegistry = new GPURegistry();
        ReputationSystem reputation = new ReputationSystem();
        ProofReceipt proofReceipt = new ProofReceipt();
        DICOToken dicoToken = new DICOToken();

        JobEscrow jobEscrow = new JobEscrow(
            address(gpuRegistry),
            address(reputation),
            address(proofReceipt)
        );

        DisputeResolution dispute = new DisputeResolution(
            address(jobEscrow),
            address(gpuRegistry)
        );

        ComputeMarketplace marketplace = new ComputeMarketplace(
            address(jobEscrow),
            address(gpuRegistry),
            address(reputation),
            address(proofReceipt),
            address(dispute),
            address(dicoToken)
        );

        // Transfer ownership
        gpuRegistry.transferOwnership(address(jobEscrow));
        reputation.transferOwnership(address(jobEscrow));
        proofReceipt.transferOwnership(address(jobEscrow));
        dispute.transferOwnership(msg.sender);

        vm.stopBroadcast();

        // Log addresses
        console.log("GPURegistry:", address(gpuRegistry));
        console.log("ReputationSystem:", address(reputation));
        console.log("ProofReceipt:", address(proofReceipt));
        console.log("DICOToken:", address(dicoToken));
        console.log("JobEscrow:", address(jobEscrow));
        console.log("DisputeResolution:", address(dispute));
        console.log("ComputeMarketplace:", address(marketplace));
    }
}
