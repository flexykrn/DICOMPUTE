// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./JobEscrow.sol";
import "./GPURegistry.sol";

contract DisputeResolution is Ownable, ReentrancyGuard {
    enum DisputeState { Open, Resolved, Rejected }

    struct Dispute {
        uint256 id;
        uint256 jobId;
        address challenger;
        address provider;
        string reason;
        DisputeState state;
        uint256 createdAt;
        uint256 resolvedAt;
        bool refundToUser;
    }

    uint256 public disputeCounter;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => uint256) public jobToDispute;

    JobEscrow public jobEscrow;
    GPURegistry public gpuRegistry;

    event DisputeOpened(uint256 indexed disputeId, uint256 indexed jobId, address challenger, string reason);
    event DisputeResolved(uint256 indexed disputeId, bool refundToUser);
    event DisputeRejected(uint256 indexed disputeId);

    error JobNotActive();
    error DisputeAlreadyExists();
    error NotDisputeChallenger();
    error DisputeNotOpen();

    constructor(address _jobEscrow, address _gpuRegistry) Ownable(msg.sender) {
        jobEscrow = JobEscrow(_jobEscrow);
        gpuRegistry = GPURegistry(_gpuRegistry);
    }

    function openDispute(uint256 jobId, string calldata reason) external {
        JobEscrow.Job memory job = jobEscrow.getJob(jobId);
        if (job.state != JobEscrow.JobState.Active) revert JobNotActive();
        if (jobToDispute[jobId] != 0) revert DisputeAlreadyExists();

        disputeCounter++;
        uint256 disputeId = disputeCounter;

        disputes[disputeId] = Dispute({
            id: disputeId,
            jobId: jobId,
            challenger: msg.sender,
            provider: job.provider,
            reason: reason,
            state: DisputeState.Open,
            createdAt: block.timestamp,
            resolvedAt: 0,
            refundToUser: false
        });
        jobToDispute[jobId] = disputeId;

        emit DisputeOpened(disputeId, jobId, msg.sender, reason);
    }

    function resolveDispute(uint256 disputeId, bool refundToUser) external onlyOwner {
        Dispute storage dispute = disputes[disputeId];
        if (dispute.state != DisputeState.Open) revert DisputeNotOpen();

        dispute.state = DisputeState.Resolved;
        dispute.resolvedAt = block.timestamp;
        dispute.refundToUser = refundToUser;

        if (refundToUser) {
            // Slash provider and refund user
            gpuRegistry.slashProvider(dispute.provider, 0);
        }

        emit DisputeResolved(disputeId, refundToUser);
    }

    function rejectDispute(uint256 disputeId) external onlyOwner {
        Dispute storage dispute = disputes[disputeId];
        if (dispute.state != DisputeState.Open) revert DisputeNotOpen();

        dispute.state = DisputeState.Rejected;
        dispute.resolvedAt = block.timestamp;

        emit DisputeRejected(disputeId);
    }

    function getDispute(uint256 disputeId) external view returns (Dispute memory) {
        return disputes[disputeId];
    }

    function getDisputeByJob(uint256 jobId) external view returns (Dispute memory) {
        return disputes[jobToDispute[jobId]];
    }
}
