import { getAccount } from './getAccount';
import { web3 } from './web3global';
import { postTrx } from "./postTrx";
export const pendingJobs = {};
export async function runJob(image, inputFS, args): Promise<any> {
    const account2 = getAccount("m/44'/60'/0'/0/1");
    const rcpt = await postTrx("run", account2, {
        consumer:account2.address, 
        imageName: image,
        imageType: "job",
        inputFS, 
        callback: true, 
        args
    });
    const log = rcpt.logs[0];
    const data = web3.eth.abi.decodeLog([
      {
        "indexed": true,
        "internalType": "address",
        "name": "consumer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "imageName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "inputFS",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "callback",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "string[]",
        "name": "args",
        "type": "string[]"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "imageType",
        "type": "string"
      }
    ], log.data, log.topics.slice(1));
    const jobID = data.id;
    // console.log("waiting for", jobID);
    return new Promise((done) => {
        pendingJobs[jobID] = function (jobDoneObj) {
            done(jobDoneObj);
        };
    });
}

export async function runService(image, inputFS, args, wait = true):Promise<any> {
    const account2 = getAccount("m/44'/60'/0'/0/1");
    const jobID = await postTrx("run", account2,{
      consumer:account2.address, 
      imageName: image,
      imageType: "service",
      inputFS, 
      callback: true, 
      args
    });
}