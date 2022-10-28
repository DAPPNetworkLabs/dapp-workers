const config = require("./.config.json");

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `https://polygon-mainnet.g.alchemy.com/v2/${config.alchemyKey}`
      },
      allowUnlimitedContractSize: true,
      accounts: {
        mnemonic: `cruel rebel frown short month love belt weather sense hood cage pact`
      }
    }
  }
};
