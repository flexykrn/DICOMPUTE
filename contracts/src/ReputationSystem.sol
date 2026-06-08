// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ReputationSystem is Ownable {
    struct ProviderReputation {
        uint256 score;              // 0-10000 (basis points)
        uint256 totalJobs;
        uint256 completedJobs;
        uint256 slashedCount;
        uint256 heartbeatStreak;
        uint256 lastHeartbeatTime;
    }

    mapping(address => ProviderReputation) public reputations;

    event ReputationUpdated(address indexed provider, uint256 newScore);
    event CompletionRecorded(address indexed provider, uint256 totalJobs);
    event SlashRecorded(address indexed provider, uint256 slashCount);
    event HeartbeatStreakUpdated(address indexed provider, uint256 streak);

    error InvalidProvider();

    constructor() Ownable(msg.sender) {}

    function recordCompletion(address provider) external onlyOwner {
        ProviderReputation storage rep = reputations[provider];
        rep.totalJobs++;
        rep.completedJobs++;
        rep.heartbeatStreak++;
        rep.lastHeartbeatTime = block.timestamp;

        // Calculate score: 70% completion rate + 30% heartbeat consistency
        uint256 completionRate = (rep.completedJobs * 10000) / rep.totalJobs;
        uint256 heartbeatScore = rep.heartbeatStreak > 100 ? 10000 : rep.heartbeatStreak * 100;
        rep.score = (completionRate * 70 + heartbeatScore * 30) / 100;

        emit CompletionRecorded(provider, rep.totalJobs);
        emit ReputationUpdated(provider, rep.score);
    }

    function recordSlash(address provider) external onlyOwner {
        ProviderReputation storage rep = reputations[provider];
        rep.totalJobs++;
        rep.slashedCount++;
        rep.heartbeatStreak = 0;

        // Heavy penalty for slash
        uint256 completionRate = (rep.completedJobs * 10000) / rep.totalJobs;
        rep.score = (completionRate * 70) / 100;

        emit SlashRecorded(provider, rep.slashedCount);
        emit ReputationUpdated(provider, rep.score);
    }

    function recordHeartbeat(address provider) external onlyOwner {
        ProviderReputation storage rep = reputations[provider];
        rep.heartbeatStreak++;
        rep.lastHeartbeatTime = block.timestamp;

        emit HeartbeatStreakUpdated(provider, rep.heartbeatStreak);
    }

    function getReputation(address provider) external view returns (ProviderReputation memory) {
        return reputations[provider];
    }

    function getScore(address provider) external view returns (uint256) {
        return reputations[provider].score;
    }

    function isTrustedProvider(address provider, uint256 minScore) external view returns (bool) {
        return reputations[provider].score >= minScore;
    }
}
