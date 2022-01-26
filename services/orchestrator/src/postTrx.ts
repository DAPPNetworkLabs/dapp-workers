import { web3 } from './web3global';
import { abi, address } from './index';
export async function postTrx(method, account_from, ...args) {
    const theContract2 = new web3.eth.Contract(abi, address, {
        from: account_from.address
    });
    const nexusTx = theContract2.methods[method](...args);
    const createTransaction = await web3.eth.accounts.signTransaction({
        from: account_from.address,
        to: address,
        data: await nexusTx.encodeABI(),
        gas: await nexusTx.estimateGas(),
    }, account_from.privateKey);
    const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
    return createReceipt;
}
