import { getAccount } from './getAccount';
import { web3 } from './web3global';
import { postTrx } from "./postTrx";
export const pendingJobs = {};
export async function runJob(image, inputFS, args): Promise<any> {
    const account2 = getAccount("m/44'/60'/0'/0/1");
    const rcpt = await postTrx("run", account2, account2.address, image, inputFS, args);
    const log = rcpt.logs[0];
    // console.log("waiting for",log) 
    var data = web3.eth.abi.decodeLog([
        {
            type: 'address',
            name: 'consumer',
            indexed: true
        },
        {
            type: 'string',
            name: 'imageName',
        },
        {
            type: 'string',
            name: 'inputFS',
        },
        {
            type: 'string[]',
            name: 'args',
        },
        {
            type: 'uint256',
            name: 'id',
        },
        {
            type: 'string',
            name: 'imageType',
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