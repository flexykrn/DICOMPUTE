require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env.deploy" });

module.exports = {
  solidity: "0.8.24",
  networks: {
    xdc: {
      url: process.env.RPC_URL,
      chainId: 51,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  paths: {
    sources: "./contracts/src",
    artifacts: "./artifacts",
  },
};
