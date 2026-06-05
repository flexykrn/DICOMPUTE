export const JOB_ESCROW_ADDRESS = "0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075" as const;

export const jobEscrowAbi = [
  {
    inputs: [],
    name: "InsufficientDeposit",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "jobId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "deposit",
        type: "uint256",
      },
    ],
    name: "JobSubmitted",
    type: "event",
  },
  {
    inputs: [],
    name: "getJobCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "string",
            name: "dockerUri",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "cpuMilli",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "ramMiB",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "vramMiB",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "durationBlocks",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "maxPricePerBlock",
            type: "uint256",
          },
        ],
        internalType: "struct JobEscrow.JobSpec",
        name: "spec",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "deposit",
        type: "uint256",
      },
    ],
    name: "submitJob",
    outputs: [
      {
        internalType: "uint256",
        name: "jobId",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
] as const;
