// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./JobEscrow.sol";
import "./GPURegistry.sol";
import "./ReputationSystem.sol";
import "./ProofReceipt.sol";
import "./DisputeResolution.sol";
import "./DICOToken.sol";

contract ComputeMarketplace {
    JobEscrow public jobEscrow;
    GPURegistry public gpuRegistry;
    ReputationSystem public reputationSystem;
    ProofReceipt public proofReceipt;
    DisputeResolution public disputeResolution;
    DICOToken public dicoToken;

    constructor(
        address _jobEscrow,
        address _gpuRegistry,
        address _reputation,
        address _proofReceipt,
        address _dispute,
        address _dicoToken
    ) {
        jobEscrow = JobEscrow(_jobEscrow);
        gpuRegistry = GPURegistry(_gpuRegistry);
        reputationSystem = ReputationSystem(_reputation);
        proofReceipt = ProofReceipt(_proofReceipt);
        disputeResolution = DisputeResolution(_dispute);
        dicoToken = DICOToken(_dicoToken);
    }

    function getMarketplaceStats() external view returns (
        uint256 totalJobs,
        uint256 pendingJobs,
        uint256 activeProviders,
        uint256 totalProviders
    ) {
        totalJobs = jobEscrow.getJobCount();
        pendingJobs = jobEscrow.getPendingJobs().length;
        totalProviders = gpuRegistry.getAllProviders().length;
        activeProviders = gpuRegistry.getActiveProviders().length;
    }
}
