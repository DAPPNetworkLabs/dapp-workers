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
        version: "0.8.17",
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
      accounts: config.keys ?? [""],
      allowUnlimitedContractSize: true
    },
    mumbai: {
      url:  `https://polygon-mumbai.g.alchemy.com/v2/${config.alchemyKey}`,
      forking: {
        url: `https://polygon-mumbai.g.alchemy.com/v2/${config.alchemyKey}`
      },
      accounts: config.keys ?? [""],
      allowUnlimitedContractSize: true
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
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: config.etherscanApiKey
  }
};
