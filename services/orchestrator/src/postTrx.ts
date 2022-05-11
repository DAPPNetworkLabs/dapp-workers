import { web3 } from './web3global';
import { address } from './index'; 
import { AwsKmsSigner } from "./kms";
import { ethers } from "ethers";

const numberToHex = (number) => {
  if (typeof (number) == 'number')
    return `0x${number.toString(16)}`;
  if (typeof (number) == 'string' && !(number.startsWith('0x')))
    return `0x${parseInt(number).toString(16)}`;
  return number;
};

const signKms = async (unsignedTx, nexusContract, signer) => {
    console.log('unsignedTx',unsignedTx);
    const voidSigner = nexusContract.provider.getSigner(process.env.WORKER_AWS_KMS_ADDRESS);
    const txPop = await voidSigner.populateTransaction(unsignedTx);
    
    console.log('txPop',txPop);
    const txPopCopy = {
      ...txPop
    };
    // delete txPopCopy.from;
  
    const utx = txPopCopy;
    const nonce = await web3.eth.getTransactionCount(process.env.WORKER_AWS_KMS_ADDRESS);
    utx.nonce = nonce;
    console.log(nonce);
    
    // const gasLimit = process.env.WORKER_EVM_GAS_LIMIT || 1000000;
    // const maxPriorityFeePerGas = process.env.WORKER_EVM_MAX_PRIORITY_FEE_PER_GAS || 3000000000;
    // const maxFeePerGas = process.env.WORKER_EVM_MAX_FEE_PER_GAS || 100000000000;
    
    // utx.gasLimit = numberToHex(gasLimit);
    // utx.maxPriorityFeePerGas = numberToHex(maxPriorityFeePerGas);
    // utx.maxFeePerGas = numberToHex(maxFeePerGas);
    
    console.log('utx',utx);
    
    const txSign = await signer.signTransaction(utx);
    
    try {
        const res = await nexusContract.provider.sendTransaction(txSign);
        
        console.log('res',res);
        
        const wait_res = await res.wait()
        
        console.log('wait_res',wait_res);
        console.log('next nonce',await web3.eth.getTransactionCount(process.env.WORKER_AWS_KMS_ADDRESS))
      
        return wait_res;
    } catch(e) {
        console.log(e);
    }
}

let abi = require(process.env.NEXUS_PATH || '/nexus/artifacts/contracts/Nexus.sol/Nexus.json');
export async function postTrx(method, account_from, ...args) {
    console.log('method',method);
    console.log('args',...args);
    if(process.env.WORKER_AWS_KMS_ENABLED && process.env.WORKER_AWS_KMS_ENABLED.toString() == "true") {
        const kmsCredentials = {
            accessKeyId: process.env.WORKER_AWS_KMS_ACCESS_KEY_ID || "AKIAxxxxxxxxxxxxxxxx", // credentials for your IAM user with KMS access
            secretAccessKey: process.env.WORKER_AWS_KMS_SECRET_ACCESS_KEY || "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // credentials for your IAM user with KMS access
            region: process.env.WORKER_AWS_KMS_REGION || "ap-southeast-1",
            keyId: process.env.WORKER_AWS_KMS_KEY_ID || "arn:aws:kms:ap-southeast-1:123456789012:key/123a1234-1234-4111-a1ab-a1abc1a12b12",
        };
        const signer = new AwsKmsSigner(kmsCredentials);
        const provider = ethers.getDefaultProvider(process.env.ETH_ADDR);
        const nexusContract = new ethers.Contract(address, abi.abi, provider);
        const unsignedTx = await nexusContract.populateTransaction[method](...args);
        
        return await signKms(unsignedTx, nexusContract, signer);
    } else {
        const theContract2 = new web3.eth.Contract(abi.abi, address, {
            from: account_from.address
        });
        const nexusTx = theContract2.methods[method](...args);
        let trx;
        
        if(process.env.WORKER_EIP1559_ENABLED && process.env.WORKER_EIP1559_ENABLED.toString() == "true") {
            trx = {
                from: account_from.address,
                to: address,
                data: await nexusTx.encodeABI(),
                gasLimit: process.env.WORKER_EVM_GAS_LIMIT || await nexusTx.estimateGas(),
                maxPriorityFeePerGas: process.env.WORKER_EVM_MAX_PRIORITY_FEE_PER_GAS || 3000000000,
                maxFeePerGas: process.env.WORKER_EVM_MAX_FEE_PER_GAS || 100000000000
            }
        } else {
            trx = {
                from: account_from.address,
                to: address,
                data: await nexusTx.encodeABI(),
                gas: await nexusTx.estimateGas(),
            }
        }
        trx.nonce = await web3.eth.getTransactionCount(account_from.address);
        const createTransaction = await web3.eth.accounts.signTransaction(trx, account_from.privateKey);
        try {
            return await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
        } catch(e) {
            console.log('caught e',e,typeof(e));
            console.log('e.message',e.message,typeof(e.message));
            if(e && e.message && e.message.includes('Nonce')) {
                const first = e.message.indexOf('be');
                const last = e.message.indexOf(' but');
                const newNonce = parseInt(e.message.slice(first+3,last));
                console.log('newNonce',newNonce,typeof(newNonce),first,last);
                trx.nonce = newNonce;
                const createTransaction = await web3.eth.accounts.signTransaction(trx, account_from.privateKey);
                return await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
            } else {
                console.log(e);
            }
        }
    }
}
