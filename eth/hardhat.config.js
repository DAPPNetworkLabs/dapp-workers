const config = require("./.config.json");

module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${config.alchemyKey}`,
        chainId: 1337
      },
      allowUnlimitedContractSize: true,
      accounts: {
        mnemonic: `cruel rebel frown short month love belt weather sense hood cage pact`
      }
    }
  }
};
