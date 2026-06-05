// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GPURegistry.sol";
import "./ReputationSystem.sol";
import "./ProofReceipt.sol";

contract JobEscrow is Ownable, ReentrancyGuard {
    GPURegistry public gpuRegistry;
    ReputationSystem public reputationSystem;
    ProofReceipt public proofReceipt;

    uint256 public constant MAX_BLOCK_TIMEOUT = 300; // ~10 min on XDC
    uint256 public constant CHALLENGE_BOUNTY_PERCENT = 20; // 20% to challenger
    uint256 public jobCounter;

    enum JobState { Pending, Active, Completed, Slashed, Cancelled }

    struct JobSpec {
        string dockerUri;
        uint256 cpuMilli;
        uint256 ramMiB;
        uint256 vramMiB;
        uint256 durationBlocks;
        uint256 maxPricePerBlock;
    }

    struct Job {
        uint256 id;
        address user;
        JobSpec spec;
        uint256 deposit;
        JobState state;
        address provider;
        uint256 startedAt;
        uint256 completedAt;
        uint256 lastHeartbeatBlock;
        string resultCID;
        uint256 instructionCount;
    }

    mapping(uint256 => Job) public jobs;
    mapping(uint256 => bytes32) public jobHeartbeatDigests;
    uint256[] public pendingJobs;

    // EIP-712
    bytes32 public constant HEARTBEAT_TYPEHASH = keccak256(
        "Heartbeat(uint256 jobId,uint256 blockNumber,uint256 uptimeSeconds,uint256 cpuPercent,uint256 ramPercent,uint256 vramPercent,uint256 timestamp)"
    );
    bytes32 public immutable DOMAIN_SEPARATOR;

    event JobSubmitted(uint256 indexed jobId, address indexed user, uint256 deposit);
    event JobClaimed(uint256 indexed jobId, address indexed provider, uint256 startedAt);
    event HeartbeatReceived(uint256 indexed jobId, uint256 blockNumber, uint256 uptimeSeconds);
    event ResultsSubmitted(uint256 indexed jobId, string resultCID, uint256 instructionCount);
    event JobCompleted(uint256 indexed jobId, address indexed provider, uint256 payout);
    event ProviderSlashed(uint256 indexed jobId, address indexed provider, address indexed challenger, uint256 bounty);
    event JobCancelled(uint256 indexed jobId);

    error InvalidJobId();
    error JobNotPending();
    error JobNotActive();
    error JobAlreadyClaimed();
    error InsufficientDeposit();
    error ProviderNotRegistered();
    error ProviderIsSlashed();
    error InvalidHeartbeatSignature();
    error HeartbeatTimeout();
    error ChallengeWindowClosed();
    error UnauthorizedChallenger();
    error ResultsNotSubmitted();
    error TransferFailed();
    error NotJobUser();

    constructor(address _registry, address _reputation, address _receipt) Ownable(msg.sender) {
        gpuRegistry = GPURegistry(_registry);
        reputationSystem = ReputationSystem(_reputation);
        proofReceipt = ProofReceipt(_receipt);

        DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes("DICOMPUTE")),
            keccak256(bytes("1")),
            block.chainid,
            address(this)
        ));
    }

    function submitJob(JobSpec calldata spec, uint256 deposit) external payable returns (uint256 jobId) {
        if (msg.value < deposit) revert InsufficientDeposit();

        jobCounter++;
        jobId = jobCounter;

        jobs[jobId] = Job({
            id: jobId,
            user: msg.sender,
            spec: spec,
            deposit: deposit,
            state: JobState.Pending,
            provider: address(0),
            startedAt: 0,
            completedAt: 0,
            lastHeartbeatBlock: 0,
            resultCID: "",
            instructionCount: 0
        });
        pendingJobs.push(jobId);

        emit JobSubmitted(jobId, msg.sender, deposit);
    }

    function claimJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        if (job.id == 0) revert InvalidJobId();
        if (job.state != JobState.Pending) revert JobNotPending();

        GPURegistry.Provider memory provider = gpuRegistry.getProvider(msg.sender);
        if (!provider.isRegistered) revert ProviderNotRegistered();
        if (provider.isSlashed) revert ProviderIsSlashed();

        // Remove from pending
        for (uint256 i = 0; i < pendingJobs.length; i++) {
            if (pendingJobs[i] == jobId) {
                pendingJobs[i] = pendingJobs[pendingJobs.length - 1];
                pendingJobs.pop();
                break;
            }
        }

        job.provider = msg.sender;
        job.state = JobState.Active;
        job.startedAt = block.number;
        job.lastHeartbeatBlock = block.number;

        emit JobClaimed(jobId, msg.sender, block.number);
    }

    function submitHeartbeat(
        uint256 jobId,
        uint256 blockNumber,
        uint256 uptimeSeconds,
        uint256 cpuPercent,
        uint256 ramPercent,
        uint256 vramPercent,
        uint256 timestamp,
        bytes calldata signature
    ) external {
        Job storage job = jobs[jobId];
        if (job.id == 0) revert InvalidJobId();
        if (job.state != JobState.Active) revert JobNotActive();
        if (msg.sender != job.provider) revert UnauthorizedChallenger();

        bytes32 structHash = keccak256(abi.encode(
            HEARTBEAT_TYPEHASH,
            jobId,
            blockNumber,
            uptimeSeconds,
            cpuPercent,
            ramPercent,
            vramPercent,
            timestamp
        ));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));

        if (!verifySignature(job.provider, digest, signature)) revert InvalidHeartbeatSignature();

        job.lastHeartbeatBlock = block.number;
        jobHeartbeatDigests[jobId] = digest;

        emit HeartbeatReceived(jobId, block.number, uptimeSeconds);
    }

    function submitResults(uint256 jobId, string calldata resultCID, uint256 instructionCount) external {
        Job storage job = jobs[jobId];
        if (job.id == 0) revert InvalidJobId();
        if (job.state != JobState.Active) revert JobNotActive();
        if (msg.sender != job.provider) revert UnauthorizedChallenger();

        job.resultCID = resultCID;
        job.instructionCount = instructionCount;
        job.completedAt = block.number;
        job.state = JobState.Completed;

        // Calculate payout
        uint256 blocksUsed = block.number - job.startedAt;
        uint256 cost = blocksUsed * job.spec.maxPricePerBlock;
        if (cost > job.deposit) cost = job.deposit;
        uint256 refund = job.deposit - cost;

        // Update provider stats
        gpuRegistry.incrementJobCompleted(job.provider);
        reputationSystem.recordCompletion(job.provider);

        // Mint proof receipt
        proofReceipt.mintReceipt(job.user, jobId, job.provider, resultCID, instructionCount, cost);

        // Transfer funds
        (bool success1, ) = payable(job.provider).call{value: cost}("");
        if (!success1) revert TransferFailed();

        if (refund > 0) {
            (bool success2, ) = payable(job.user).call{value: refund}("");
            if (!success2) revert TransferFailed();
        }

        emit ResultsSubmitted(jobId, resultCID, instructionCount);
        emit JobCompleted(jobId, job.provider, cost);
    }

    function challengeProvider(uint256 jobId) external {
        Job storage job = jobs[jobId];
        if (job.id == 0) revert InvalidJobId();
        if (job.state != JobState.Active) revert JobNotActive();
        if (block.number <= job.lastHeartbeatBlock + MAX_BLOCK_TIMEOUT) revert ChallengeWindowClosed();

        job.state = JobState.Slashed;

        GPURegistry.Provider memory provider = gpuRegistry.getProvider(job.provider);
        uint256 bounty = (provider.stake * CHALLENGE_BOUNTY_PERCENT) / 100;
        if (bounty > provider.stake) bounty = provider.stake;

        gpuRegistry.slashProvider(job.provider, bounty);
        reputationSystem.recordSlash(job.provider);

        // Refund user
        (bool success, ) = payable(job.user).call{value: job.deposit}("");
        if (!success) revert TransferFailed();

        // Pay bounty to challenger
        if (bounty > 0) {
            (bool success2, ) = payable(msg.sender).call{value: bounty}("");
            if (!success2) revert TransferFailed();
        }

        emit ProviderSlashed(jobId, job.provider, msg.sender, bounty);
    }

    function cancelJob(uint256 jobId) external {
        Job storage job = jobs[jobId];
        if (job.id == 0) revert InvalidJobId();
        if (job.user != msg.sender) revert NotJobUser();
        if (job.state != JobState.Pending) revert JobNotPending();

        job.state = JobState.Cancelled;

        // Remove from pending
        for (uint256 i = 0; i < pendingJobs.length; i++) {
            if (pendingJobs[i] == jobId) {
                pendingJobs[i] = pendingJobs[pendingJobs.length - 1];
                pendingJobs.pop();
                break;
            }
        }

        (bool success, ) = payable(msg.sender).call{value: job.deposit}("");
        if (!success) revert TransferFailed();

        emit JobCancelled(jobId);
    }

    function verifySignature(address signer, bytes32 digest, bytes calldata signature) internal pure returns (bool) {
        if (signature.length != 65) return false;
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        // Parse signature: first 32 bytes = r, next 32 = s, last 1 = v
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            // v is the last byte of the third 32-byte word
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        
        if (v < 27) v += 27;
        
        // Prevent signature malleability
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            return false;
        }
        
        address recovered = ecrecover(digest, v, r, s);
        return recovered != address(0) && recovered == signer;
    }

    function getJob(uint256 jobId) external view returns (Job memory) {
        return jobs[jobId];
    }

    function getPendingJobs() external view returns (uint256[] memory) {
        return pendingJobs;
    }

    function getJobCount() external view returns (uint256) {
        return jobCounter;
    }
}
