require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-abi-exporter");
require("hardhat-gas-reporter");
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-etherscan");
const config = require("./.config.json");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.13",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
    ]
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${config.alchemyKey}`
      },
      allowUnlimitedContractSize: true
    },
    polygon: {
      url:  `https://polygon-mainnet.g.alchemy.com/v2/${config.alchemyKey}`,
      forking: {
        url: `https://polygon-mainnet.g.alchemy.com/v2/${config.alchemyKey}`
      },
      allowUnlimitedContractSize: true
    },
    bsc_test: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      mnemonic: `cruel rebel frown short month love belt weather sense hood cage pact`
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      mnemonic: `cruel rebel frown short month love belt weather sense hood cage pact`
    },
    tests: {
      url: `${'http://eth:8545'}`,
      accounts: {
        mnemonic: `cruel rebel frown short month love belt weather sense hood cage pact`
      },
      timeout: 120000
    },
    ganache: {
      url: `${'http://ganache:8545'}`,
      accounts: {
        mnemonic: `cruel rebel frown short month love belt weather sense hood cage pact`
      },
      timeout: 120000
    },
    localhost: {
      url: `${'http://localhost:8545'}`,
      accounts: {
        mnemonic: `cruel rebel frown short month love belt weather sense hood cage pact`
      },
      timeout: 120000
    },
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${config.alchemyKey}`,
      accounts: config.keys,
      blockGasLimit: 12e6
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: config.etherscanApiKey
  }
};
