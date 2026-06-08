export const PROOF_RECEIPT_ADDRESS = "0xb35EfE4E7071B1c7ce7f00CC7BB667cEc706DBa2" as const;

export const proofReceiptAbi = [
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "receipts",
    outputs: [
      { internalType: "uint256", name: "jobId", type: "uint256" },
      { internalType: "address", name: "provider", type: "address" },
      { internalType: "string", name: "resultCID", type: "string" },
      { internalType: "uint256", name: "instructionCount", type: "uint256" },
      { internalType: "uint256", name: "cost", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenCounter",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "jobId", type: "uint256" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "address", name: "provider", type: "address" },
      { indexed: false, internalType: "string", name: "resultCID", type: "string" },
      { indexed: false, internalType: "uint256", name: "cost", type: "uint256" },
    ],
    name: "ReceiptMinted",
    type: "event",
  },
] as const;
