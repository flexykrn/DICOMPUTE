// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/JobEscrow.sol";
import "../src/GPURegistry.sol";
import "../src/ReputationSystem.sol";
import "../src/ProofReceipt.sol";
import "../src/DICOToken.sol";

contract JobEscrowTest is Test {
    JobEscrow public jobEscrow;
    GPURegistry public gpuRegistry;
    ReputationSystem public reputationSystem;
    ProofReceipt public proofReceipt;
    DICOToken public token;

    address public owner = address(0xABCD);
    address public user = address(0xBEEF);
    address public provider = 0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7;
    address public challenger = address(0xDEAD);

    uint256 public providerKey = 0xA11CE;
    uint256 public challengerKey = 0xB22CE;

    function setUp() public {
        vm.startPrank(owner);

        token = new DICOToken();
        gpuRegistry = new GPURegistry();
        reputationSystem = new ReputationSystem();
        proofReceipt = new ProofReceipt();
        jobEscrow = new JobEscrow(address(gpuRegistry), address(reputationSystem), address(proofReceipt));

        // Transfer ownership of all subsystems to JobEscrow
        gpuRegistry.transferOwnership(address(jobEscrow));
        reputationSystem.transferOwnership(address(jobEscrow));
        proofReceipt.transferOwnership(address(jobEscrow));

        // Fund accounts with ETH for job deposits and stakes
        vm.deal(user, 1000 ether);
        vm.deal(provider, 10 ether);
        vm.deal(challenger, 10 ether);

        vm.stopPrank();

        // Register provider - needs ETH for stake
        vm.deal(provider, 10 ether);
        vm.startPrank(provider);
        gpuRegistry.registerProvider{value: 1 ether}("RTX-4090");
        vm.stopPrank();
    }

    function test_CreateJob() public {
        vm.startPrank(user);
        token.approve(address(jobEscrow), 100 ether);

        JobEscrow.JobSpec memory spec = JobEscrow.JobSpec({
            dockerUri: "docker.io/test:latest",
            cpuMilli: 4000,
            ramMiB: 8192,
            vramMiB: 16384,
            durationBlocks: 100,
            maxPricePerBlock: 1 ether
        });

        uint256 jobId = jobEscrow.submitJob{value: 100 ether}(spec, 100 ether);
        assertEq(jobId, 1);

        (uint256 id, address jobUser,, uint256 deposit, JobEscrow.JobState state,,,,,,) = jobEscrow.jobs(jobId);
        assertEq(id, 1);
        assertEq(jobUser, user);
        assertEq(deposit, 100 ether);
        assertEq(uint256(state), uint256(JobEscrow.JobState.Pending));

        vm.stopPrank();
    }

    function test_ClaimJob() public {
        // Create job first
        vm.startPrank(user);
        token.approve(address(jobEscrow), 100 ether);
        JobEscrow.JobSpec memory spec = JobEscrow.JobSpec({
            dockerUri: "docker.io/test:latest",
            cpuMilli: 4000,
            ramMiB: 8192,
            vramMiB: 16384,
            durationBlocks: 100,
            maxPricePerBlock: 1 ether
        });
        uint256 jobId = jobEscrow.submitJob{value: 100 ether}(spec, 100 ether);
        vm.stopPrank();

        // Provider claims
        vm.prank(provider);
        jobEscrow.claimJob(jobId);

        (,,,, JobEscrow.JobState state, address jobProvider, uint256 startedAt,,,,) = jobEscrow.jobs(jobId);
        assertEq(uint256(state), uint256(JobEscrow.JobState.Active));
        assertEq(jobProvider, provider);
        assertGt(startedAt, 0);
    }

    function test_HeartbeatAndProof() public {
        // Setup job
        vm.startPrank(user);
        token.approve(address(jobEscrow), 100 ether);
        JobEscrow.JobSpec memory spec = JobEscrow.JobSpec({
            dockerUri: "docker.io/test:latest",
            cpuMilli: 4000,
            ramMiB: 8192,
            vramMiB: 16384,
            durationBlocks: 100,
            maxPricePerBlock: 1 ether
        });
        uint256 jobId = jobEscrow.submitJob{value: 100 ether}(spec, 100 ether);
        vm.stopPrank();

        vm.prank(provider);
        jobEscrow.claimJob(jobId);

        // Sign heartbeat
        uint256 blockNum = block.number;
        uint256 uptime = 3600;
        uint256 cpu = 50;
        uint256 ram = 60;
        uint256 vram = 70;
        uint256 timestamp = block.timestamp;

        bytes32 structHash = keccak256(abi.encode(
            jobEscrow.HEARTBEAT_TYPEHASH(),
            jobId,
            blockNum,
            uptime,
            cpu,
            ram,
            vram,
            timestamp
        ));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", jobEscrow.DOMAIN_SEPARATOR(), structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(providerKey, digest);

        // Sign heartbeat - use compact signature (65 bytes)
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.prank(provider);
        jobEscrow.submitHeartbeat(jobId, blockNum, uptime, cpu, ram, vram, timestamp, sig);

        // Submit results
        vm.prank(provider);
        jobEscrow.submitResults(jobId, "QmResult123", 1000000);

        // Complete - submitResults already completes the job
        // No separate releasePayment needed

        (,,,, JobEscrow.JobState finalState,,,,,,) = jobEscrow.jobs(jobId);
        assertEq(uint256(finalState), uint256(JobEscrow.JobState.Completed));
    }

    function test_ChallengeAndSlash() public {
        // Setup job
        vm.startPrank(user);
        token.approve(address(jobEscrow), 100 ether);
        JobEscrow.JobSpec memory spec = JobEscrow.JobSpec({
            dockerUri: "docker.io/test:latest",
            cpuMilli: 4000,
            ramMiB: 8192,
            vramMiB: 16384,
            durationBlocks: 100,
            maxPricePerBlock: 1 ether
        });
        uint256 jobId = jobEscrow.submitJob{value: 100 ether}(spec, 100 ether);
        vm.stopPrank();

        vm.prank(provider);
        jobEscrow.claimJob(jobId);

        // Move past timeout
        vm.roll(block.number + 400);

        // Challenge - no need to fund contract, it already has the job deposit

        // Challenge
        vm.prank(challenger);
        jobEscrow.challengeProvider(jobId);

        (,,,, JobEscrow.JobState state,,,,,,) = jobEscrow.jobs(jobId);
        assertEq(uint256(state), uint256(JobEscrow.JobState.Slashed));
    }
}
