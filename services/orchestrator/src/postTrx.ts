import { web3 } from './web3global';
import { address } from './index'; 
import { KMSClient, CancelKeyDeletionCommand } from "@aws-sdk/client-kms";
const client = new KMSClient({ region: "REGION" });

const params = {
  /** input parameters */
};
const command = new CancelKeyDeletionCommand(params);

let abi = require(process.env.NEXUS_PATH || '/nexus/artifacts/contracts/Nexus.sol/Nexus.json');
export async function postTrx(method, account_from, ...args) {
    if(process.env.WORKER_USE_AWS_KMS) {

    } else {
        const theContract2 = new web3.eth.Contract(abi.abi, address, {
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
}
