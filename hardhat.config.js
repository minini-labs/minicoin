require('dotenv').config({ path: __dirname + '/.env.development' });
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers")
require('@openzeppelin/hardhat-upgrades');
require('@nomicfoundation/hardhat-verify');
require("hardhat-gas-reporter");
require("solidity-coverage");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      gas: 72_000_000,
      blockGasLimit: 72_000_000,
      gasPrice: 2000,
      initialBaseFeePerGas: 1
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    cc3: {
      url: process.env.CC3_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    },
    cc3_testnet: {
      url: process.env.CC3_TESTNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  solidity: {
    version: "0.8.13",
    settings: {
      optimizer: {
        runs: 200,
        enabled: true
      }
    }
  },
  etherscan: {
    apiKey: {
      cc3: `${process.env.BLOCKSCOUT_API_KEY}`,
      cc3_testnet: `${process.env.BLOCKSCOUT_API_KEY_TESTNET}`
    },
    customChains: [
      {
        network: "cc3",
        chainId: 102030,
        urls: {
          apiURL: "https://creditcoin.blockscout.com/api",
          browserURL: "https://creditcoin.blockscout.com"
        }
      },
      {
        network: "cc3_testnet",
        chainId: 102031,
        urls: {
          apiURL: "https://creditcoin-testnet.blockscout.com/api",
          browserURL: "https://creditcoin-testnet.blockscout.com"
        }
      }
    ]
  },
  mocha: {
    timeout: 2000000
  },
};
