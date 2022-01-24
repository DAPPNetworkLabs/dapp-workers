const config = require("./.config.json");

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${config.alchemyKey}`
      },
      allowUnlimitedContractSize: true,
      accounts: {
        mnemonic: `cruel rebel frown short month love belt weather sense hood cage pact`
      },
      timeout: 120000
    }
  },
  mocha: {
    timeout: 120000,
    retries: 2,
    bail: true,
  }
};
