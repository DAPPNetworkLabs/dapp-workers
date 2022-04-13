import { web3 } from './web3global';
import { address } from './index'; 
import { AwsKmsSigner } from "./kms";
import { ethers } from "ethers";

let abi = require(process.env.NEXUS_PATH || '/nexus/artifacts/contracts/Nexus.sol/Nexus.json');
export async function postTrx(method, account_from, ...args) {
    const theContract2 = new web3.eth.Contract(abi.abi, address, {
        from: account_from.address
    });
    const nexusTx = theContract2.methods[method](...args);
    if(process.env.WORKER_AWS_KMS_ENABLED.toString() == "true") {
        const trx = {
            to: address,
            value: 0.1
            // data: await nexusTx.encodeABI(),
            // gasPrice: await nexusTx.estimateGas(),
        };
        
        const kmsCredentials = {
            accessKeyId: process.env.WORKER_AWS_KMS_ACCESS_KEY_ID || "AKIAxxxxxxxxxxxxxxxx", // credentials for your IAM user with KMS access
            secretAccessKey: process.env.WORKER_AWS_KMS_SECRET_ACCESS_KEY || "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // credentials for your IAM user with KMS access
            region: process.env.WORKER_AWS_KMS_REGION || "ap-southeast-1",
            keyId: process.env.WORKER_AWS_KMS_KEY_ID || "arn:aws:kms:ap-southeast-1:123456789012:key/123a1234-1234-4111-a1ab-a1abc1a12b12",
        };
        
        const provider = ethers.providers.getDefaultProvider("ropsten");
        let signer = new AwsKmsSigner(kmsCredentials);
        signer = signer.connect(provider);
        console.log('signer connected')
        
        const tx = await signer.signTransaction(trx);
        console.log('signed transaction, sendint trx')
        console.log(tx);
        return await web3.eth.sendSignedTransaction(tx);
    } else {
        const trx = {
            from: account_from.address,
            to: address,
            data: await nexusTx.encodeABI(),
            gas: await nexusTx.estimateGas(),
        }
        const createTransaction = await web3.eth.accounts.signTransaction(trx, account_from.privateKey);
        return await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
    }
}
