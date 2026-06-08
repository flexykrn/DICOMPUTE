export const JOB_ESCROW_ADDRESS = "0x2Ff9B760510fc0aAd51a59f8aDA62F8B2631a075" as const;

export const jobEscrowAbi = [
  {
    inputs: [],
    name: "InsufficientDeposit",
    type: "error",
  },
  {
    inputs: [],
    name: "InvalidJobId",
    type: "error",
  },
  {
    inputs: [],
    name: "JobNotPending",
    type: "error",
  },
  {
    inputs: [],
    name: "JobNotActive",
    type: "error",
  },
  {
    inputs: [],
    name: "ProviderNotRegistered",
    type: "error",
  },
  {
    inputs: [],
    name: "ResultsNotSubmitted",
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
        name: "provider",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "startedAt",
        type: "uint256",
      },
    ],
    name: "JobClaimed",
    type: "event",
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
        indexed: false,
        internalType: "string",
        name: "resultCID",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "instructionCount",
        type: "uint256",
      },
    ],
    name: "ResultsSubmitted",
    type: "event",
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
        name: "provider",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "payout",
        type: "uint256",
      },
    ],
    name: "JobCompleted",
    type: "event",
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
        indexed: false,
        internalType: "uint256",
        name: "blockNumber",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "uptimeSeconds",
        type: "uint256",
      },
    ],
    name: "HeartbeatReceived",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "jobId",
        type: "uint256",
      },
    ],
    name: "getJob",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "address", name: "user", type: "address" },
          {
            components: [
              { internalType: "string", name: "dockerUri", type: "string" },
              { internalType: "uint256", name: "cpuMilli", type: "uint256" },
              { internalType: "uint256", name: "ramMiB", type: "uint256" },
              { internalType: "uint256", name: "vramMiB", type: "uint256" },
              { internalType: "uint256", name: "durationBlocks", type: "uint256" },
              { internalType: "uint256", name: "maxPricePerBlock", type: "uint256" },
            ],
            internalType: "struct JobEscrow.JobSpec",
            name: "spec",
            type: "tuple",
          },
          { internalType: "uint256", name: "deposit", type: "uint256" },
          { internalType: "enum JobEscrow.JobState", name: "state", type: "uint8" },
          { internalType: "address", name: "provider", type: "address" },
          { internalType: "uint256", name: "startedAt", type: "uint256" },
          { internalType: "uint256", name: "completedAt", type: "uint256" },
          { internalType: "uint256", name: "lastHeartbeatBlock", type: "uint256" },
          { internalType: "string", name: "resultCID", type: "string" },
          { internalType: "uint256", name: "instructionCount", type: "uint256" },
        ],
        internalType: "struct JobEscrow.Job",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
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
  {
    inputs: [
      {
        internalType: "uint256",
        name: "jobId",
        type: "uint256",
      },
    ],
    name: "claimJob",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "jobId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "resultCID",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "instructionCount",
        type: "uint256",
      },
    ],
    name: "submitResults",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "jobId",
        type: "uint256",
      },
    ],
    name: "cancelJob",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "jobId",
        type: "uint256",
      },
    ],
    name: "challengeProvider",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
