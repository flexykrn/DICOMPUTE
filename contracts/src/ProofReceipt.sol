// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProofReceipt is ERC721, ERC721URIStorage, Ownable {
    uint256 public tokenCounter;

    struct Receipt {
        uint256 jobId;
        address provider;
        string resultCID;
        uint256 instructionCount;
        uint256 cost;
        uint256 timestamp;
    }

    mapping(uint256 => Receipt) public receipts;

    event ReceiptMinted(
        uint256 indexed tokenId,
        uint256 indexed jobId,
        address indexed user,
        address provider,
        string resultCID,
        uint256 cost
    );

    error UnauthorizedMinter();

    constructor() ERC721("DICOMPUTE Proof Receipt", "DCPR") Ownable(msg.sender) {
        tokenCounter = 0;
    }

    function mintReceipt(
        address to,
        uint256 jobId,
        address provider,
        string calldata resultCID,
        uint256 instructionCount,
        uint256 cost
    ) external returns (uint256) {
        if (msg.sender != owner()) revert UnauthorizedMinter();

        tokenCounter++;
        uint256 tokenId = tokenCounter;

        receipts[tokenId] = Receipt({
            jobId: jobId,
            provider: provider,
            resultCID: resultCID,
            instructionCount: instructionCount,
            cost: cost,
            timestamp: block.timestamp
        });

        _safeMint(to, tokenId);

        emit ReceiptMinted(tokenId, jobId, to, provider, resultCID, cost);
        return tokenId;
    }

    function getReceipt(uint256 tokenId) external view returns (Receipt memory) {
        return receipts[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
