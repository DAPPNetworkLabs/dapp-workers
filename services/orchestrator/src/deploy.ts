import { getAccount } from './getAccount';
import { web3 } from './web3global';
import { contractWrapper } from './compile';

export const deploy = async (bytecode,abi,ownerAccount) => {
    console.log("deploying");
    const account_from = ownerAccount;
    console.log(`Attempting to deploy from account ${account_from.address}`);
    // Create Contract Instance
    const nexus = new web3.eth.Contract(abi);
    // Create Constructor Tx
    const nexusTx = nexus.deploy({
        data: bytecode,
        arguments: [],
    });
    // Sign Transacation and Send
    const createTransaction = await web3.eth.accounts.signTransaction({
        data: await nexusTx.encodeABI(),
        gas: await nexusTx.estimateGas(),
    }, account_from.privateKey);
    // Send Tx and Wait for Receipt
    
    const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
    console.log(`Contract deployed at address: ${createReceipt.contractAddress}`);
    contractWrapper.address = createReceipt.contractAddress;
    return createReceipt.contractAddress;
};
