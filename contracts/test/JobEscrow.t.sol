// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/JobEscrow.sol";
import "../src/GPURegistry.sol";
import "../src/ReputationSystem.sol";
import "../src/ProofReceipt.sol";

contract JobEscrowTest is Test {
    JobEscrow public jobEscrow;
    GPURegistry public gpuRegistry;
    ReputationSystem public reputation;
    ProofReceipt public proofReceipt;

    address public user = 0x583031D1113aD414F02576BD6afaBfb302140225; // random EOA
    address public provider = 0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF; // address derived from private key 2
    address public challenger = 0xdD870fA1b7C4700F2BD7f44238821C26f7392148; // random EOA address

    function setUp() public {
        gpuRegistry = new GPURegistry();
        reputation = new ReputationSystem();
        proofReceipt = new ProofReceipt();
        jobEscrow = new JobEscrow(
            address(gpuRegistry),
            address(reputation),
            address(proofReceipt)
        );

        // Transfer ownership
        gpuRegistry.transferOwnership(address(jobEscrow));
        reputation.transferOwnership(address(jobEscrow));
        proofReceipt.transferOwnership(address(jobEscrow));

        // Fund accounts
        vm.deal(user, 10 ether);
        vm.deal(provider, 10 ether);
        vm.deal(challenger, 10 ether);
    }

    function test_SubmitJob() public {
        vm.prank(user);
        uint256 jobId = jobEscrow.submitJob{value: 1 ether}(
            JobEscrow.JobSpec("docker://test", 1000, 1024, 0, 100, 0.01 ether),
            1 ether
        );

        assertEq(jobId, 1);
        JobEscrow.Job memory job = jobEscrow.getJob(jobId);
        assertEq(job.user, user);
        assertEq(job.deposit, 1 ether);
        assertEq(uint(job.state), uint(JobEscrow.JobState.Pending));
    }

    function test_RegisterAndClaimJob() public {
        // Register provider
        vm.prank(provider);
        gpuRegistry.registerProvider{value: 1 ether}("{\"gpu\":\"RTX4090\"}");

        // Submit job
        vm.prank(user);
        uint256 jobId = jobEscrow.submitJob{value: 1 ether}(
            JobEscrow.JobSpec("docker://test", 1000, 1024, 0, 100, 0.01 ether),
            1 ether
        );

        // Claim job
        vm.prank(provider);
        jobEscrow.claimJob(jobId);

        JobEscrow.Job memory job = jobEscrow.getJob(jobId);
        assertEq(job.provider, provider);
        assertEq(uint(job.state), uint(JobEscrow.JobState.Active));
    }

    function test_HeartbeatAndComplete() public {
        // Setup
        vm.prank(provider);
        gpuRegistry.registerProvider{value: 1 ether}("{\"gpu\":\"RTX4090\"}");

        vm.prank(user);
        uint256 jobId = jobEscrow.submitJob{value: 1 ether}(
            JobEscrow.JobSpec("docker://test", 1000, 1024, 0, 100, 0.01 ether),
            1 ether
        );

        vm.prank(provider);
        jobEscrow.claimJob(jobId);

        // Submit heartbeat - use vm.sign with the actual provider address
        uint256 blockNum = block.number;
        bytes32 structHash = keccak256(abi.encode(
            jobEscrow.HEARTBEAT_TYPEHASH(),
            jobId,
            blockNum,
            60,
            5000,
            3000,
            0,
            block.timestamp
        ));
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", jobEscrow.DOMAIN_SEPARATOR(), structHash));
        
        // Use the correct private key for address(2) which is 0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF
        // Private key for address(2) in Foundry tests is typically 2
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(2, digest);
        if (v < 27) v += 27;
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Debug: verify signature recovers correctly
        address recovered = ecrecover(digest, v, r, s);
        console.log("Provider:", provider);
        console.log("Recovered:", recovered);
        assertEq(recovered, provider);

        vm.prank(provider);
        jobEscrow.submitHeartbeat(jobId, blockNum, 60, 5000, 3000, 0, block.timestamp, signature);

        // Complete job
        vm.prank(provider);
        jobEscrow.submitResults(jobId, "QmTest123", 1000000);

        JobEscrow.Job memory job = jobEscrow.getJob(jobId);
        assertEq(uint(job.state), uint(JobEscrow.JobState.Completed));
        assertEq(job.resultCID, "QmTest123");
    }

    function test_ChallengeProvider() public {
        // Setup
        vm.prank(provider);
        gpuRegistry.registerProvider{value: 1 ether}("{\"gpu\":\"RTX4090\"}");

        vm.prank(user);
        uint256 jobId = jobEscrow.submitJob{value: 1 ether}(
            JobEscrow.JobSpec("docker://test", 1000, 1024, 0, 100, 0.01 ether),
            1 ether
        );

        vm.prank(provider);
        jobEscrow.claimJob(jobId);

        // Wait for timeout
        vm.roll(block.number + 301);

        // Challenge - contract needs ETH for bounty transfer (bounty is 20% of provider stake)
        // The contract needs: job deposit (1 ether) + bounty (0.2 ether) = 1.2 ether total
        vm.deal(address(jobEscrow), 2 ether);
        uint256 challengerBalanceBefore = challenger.balance;
        
        vm.prank(challenger);
        jobEscrow.challengeProvider(jobId);

        JobEscrow.Job memory job = jobEscrow.getJob(jobId);
        assertEq(uint(job.state), uint(JobEscrow.JobState.Slashed));
        assertGt(challenger.balance, challengerBalanceBefore);
    }

    receive() external payable {}
}
