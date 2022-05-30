const { hdkey } = require('ethereumjs-wallet');
const bip39 = require('bip39');

export const getAccount = (path = "m/44'/60'/0'/0/0") => {
    const seed = bip39.mnemonicToSeedSync(process.env.SEED);
    const hdk = hdkey.fromMasterSeed(seed);
    const addr_node = hdk.derivePath(path); //m/44'/60'/0'/0/0 is derivation path for the first account. m/44'/60'/0'/0/1 is the derivation path for the second account and so on
    const addr = addr_node.getWallet().getAddressString(); //check that this is the same with the address that ganache list for the first account to make sure the derivation is correct
    const private_key = addr_node.getWallet().getPrivateKeyString();
    const account_from = {
        privateKey: private_key,
        address: addr,
    };
    console.log(`private key used: ${private_key} for ${addr}`)
    return account_from;
};
