import { getAccount } from './getAccount';
import { web3 } from './web3global';
import { postTrx } from "./postTrx";
export const pendingJobs = {};
export async function runJob(image, inputFS, args): Promise<any> {
    const account2 = getAccount("m/44'/60'/0'/0/1");
    const rcpt = await postTrx("run", account2, {
        consumer:account2.address, 
        imageName: image,
        inputFS, 
        callback: true, 
        dapps:"10000",
        args
    });
    const log = rcpt.logs[0];
    // console.log("waiting for",log) 
    const data = web3.eth.abi.decodeLog([
        {
          "components": [
            {
              "internalType": "address",
              "name": "consumer",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "imageName",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "inputFS",
              "type": "string"
            },
            {
              "internalType": "bool",
              "name": "callback",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "dapps",
              "type": "uint256"
            },
            {
              "internalType": "string[]",
              "name": "args",
              "type": "string[]"
            }
          ],
          "internalType": "struct Nexus.runArgs",
          "name": "args",
          "type": "tuple"
        }
      ], log.data, log.topics.slice(1));
    const jobID = data.id;
    console.log("waiting for", jobID);
    return new Promise((done) => {
        pendingJobs[jobID] = function (jobDoneObj) {
            done(jobDoneObj);
        };
    });
}

export async function runService(image, inputFS, args, wait = true):Promise<any> {
    const account2 = getAccount("m/44'/60'/0'/0/1");            
    const jobID = await postTrx("run", account2, account2.address, image,inputFS, args);
}