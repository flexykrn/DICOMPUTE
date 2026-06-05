// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract GPURegistry is Ownable, ReentrancyGuard {
    uint256 public constant MIN_STAKE = 0.1 ether;

    struct Provider {
        address addr;
        string metadataURI;      // JSON with GPU specs, location, etc.
        uint256 stake;
        bool isRegistered;
        bool isSlashed;
        uint256 totalJobsCompleted;
        uint256 totalJobsFailed;
    }

    mapping(address => Provider) public providers;
    address[] public providerList;

    event ProviderRegistered(address indexed provider, uint256 stake, string metadataURI);
    event ProviderUnregistered(address indexed provider, uint256 stakeReturned);
    event ProviderSlashed(address indexed provider, uint256 amount);
    event StakeIncreased(address indexed provider, uint256 newStake);

    error ProviderAlreadyRegistered();
    error ProviderNotRegistered();
    error InsufficientStake();
    error ProviderIsSlashed();
    error TransferFailed();

    constructor() Ownable(msg.sender) {}

    function registerProvider(string calldata metadataURI) external payable {
        if (providers[msg.sender].isRegistered) revert ProviderAlreadyRegistered();
        if (msg.value < MIN_STAKE) revert InsufficientStake();

        providers[msg.sender] = Provider({
            addr: msg.sender,
            metadataURI: metadataURI,
            stake: msg.value,
            isRegistered: true,
            isSlashed: false,
            totalJobsCompleted: 0,
            totalJobsFailed: 0
        });
        providerList.push(msg.sender);

        emit ProviderRegistered(msg.sender, msg.value, metadataURI);
    }

    function addStake() external payable {
        Provider storage p = providers[msg.sender];
        if (!p.isRegistered) revert ProviderNotRegistered();
        if (p.isSlashed) revert ProviderIsSlashed();

        p.stake += msg.value;
        emit StakeIncreased(msg.sender, p.stake);
    }

    function unregisterProvider() external nonReentrant {
        Provider storage p = providers[msg.sender];
        if (!p.isRegistered) revert ProviderNotRegistered();

        uint256 stake = p.stake;
        p.isRegistered = false;
        p.stake = 0;

        (bool success, ) = payable(msg.sender).call{value: stake}("");
        if (!success) revert TransferFailed();

        emit ProviderUnregistered(msg.sender, stake);
    }

    function slashProvider(address provider, uint256 amount) external onlyOwner {
        Provider storage p = providers[provider];
        if (!p.isRegistered) revert ProviderNotRegistered();

        p.isSlashed = true;
        if (amount > p.stake) amount = p.stake;
        p.stake -= amount;

        emit ProviderSlashed(provider, amount);
    }

    function incrementJobCompleted(address provider) external onlyOwner {
        providers[provider].totalJobsCompleted++;
    }

    function incrementJobFailed(address provider) external onlyOwner {
        providers[provider].totalJobsFailed++;
    }

    function getProvider(address provider) external view returns (Provider memory) {
        return providers[provider];
    }

    function getAllProviders() external view returns (address[] memory) {
        return providerList;
    }

    function getActiveProviders() external view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < providerList.length; i++) {
            if (providers[providerList[i]].isRegistered && !providers[providerList[i]].isSlashed) {
                count++;
            }
        }
        address[] memory active = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < providerList.length; i++) {
            if (providers[providerList[i]].isRegistered && !providers[providerList[i]].isSlashed) {
                active[idx++] = providerList[i];
            }
        }
        return active;
    }
}
