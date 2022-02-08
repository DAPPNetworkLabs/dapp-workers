import { dispatch, dispatchService } from './dispatch';
const fs = require('fs');
const path = require('path');

import { getAccount } from './getAccount';
import { web3, provider } from './web3global';
import { postTrx } from './postTrx';
import { callTrx } from './callTrx';

const Web3 = require('web3');
let abi = require('/nexus/abi/contracts/Nexus.sol/Nexus.json');
// abi = JSON.stringify(abi);

const dal = require('./dal/models/index');
const { fetchAllUsageInfo } = require('./dal/dal')
import { execPromise } from './exec';

let startup = true;

provider.on('error', e => console.log('WS Error', e));
function socketError(e) {
    console.log('WS closed');
    console.log('Attempting to reconnect...');
    const provider = new Web3.providers.WebsocketProvider(process.env.ETH_ADDR);

    provider.on('connect', function () {
        console.log('WSS Reconnected');
    });
    provider.on('end', socketError);
    provider.on('close', socketError);

    web3.setProvider(provider);
    if (theContract)
        subscribe(theContract);
}
provider.on('end', socketError);
provider.on('close', socketError);

const address = process.env.ADDRESS;
const fromBlock = 0; // load and save to file
const theContract = new web3.eth.Contract(
    abi,
    address,
    {}
);

const intervalCallback = async () => {
    const jobs = await fetchAllUsageInfo();
    for(const el of jobs) {
        const serviceInfo = await getInfo(el.id,"service");
        console.log(`cron service info: ${JSON.stringify(serviceInfo)}`)
        const res = await validateServiceBalance(serviceInfo.consumer, el.id);
        console.log(`res for service: ${res}`);
        if(res == true) {
            
        } else if (res == false) {
            await execPromise(`docker stop ${el.dockerId}`,{});
            await execPromise(`docker rm ${el.dockerId} -v`,{});
        }
    }
}

export { abi, address };
let dspAccount;
let ownerAccount;
const run = () => {
    dspAccount = getAccount();
    subscribe(theContract);
    console.log('running interval callback')
    setInterval(() => {
        intervalCallback();
    }, 1000 * 30);
    console.log('done running interval callback')
}

run();

async function isProcessed(jobID, isJob) {
    return await theContract.methods.jobServiceCompleted(jobID, dspAccount.address, isJob).call({ from: dspAccount.address });
}

async function validateJobBalance(consumer, gasLimit, imageName) {
    const dspData = await theContract.methods.dspData(consumer, dspAccount.address).call({ from: dspAccount.address });
    const requiredAmount = await theContract.methods.getMaxPaymentForGas(gasLimit, imageName, dspAccount.address).call({ from: dspAccount.address });

    if (Number(dspData.amount) >= Number(requiredAmount)) {
        return true;
    } else {
        console.log(`validateJobBalance: false ${imageName} ${gasLimit} ${dspData.amount} ${requiredAmount} ${typeof(dspData.amount)} ${typeof(requiredAmount)} ${dspData.amount >= requiredAmount}`);
        return false;
    }
}

async function validateServiceBalance(consumer, serviceId) {
    const dspData = await theContract.methods.dspData(consumer, dspAccount.address).call({ from: dspAccount.address });
    const requiredAmount = await theContract.methods.getMinBalance(serviceId, "service", dspAccount.address).call({ from: dspAccount.address });

    if (Number(dspData.amount) >= Number(requiredAmount)) {
        return true;
    } else {
        console.log(`validateServiceBalance: false ${dspData.amount} ${requiredAmount} ${typeof(dspData.amount)} ${typeof(requiredAmount)} ${dspData.amount >= requiredAmount}`);
        return false;
    }
}

const getInfo = async (jobId, type) => {
    if (type == "job") {
        return await theContract.methods.jobs(jobId).call({ from: dspAccount.address });
    } else if (type == "service") {
        return await theContract.methods.services(jobId).call({ from: dspAccount.address });
    }
}

const runService = async (returnValues) => {
        let fidx = 0;
        const consumer = returnValues[fidx++];
        const owner = returnValues[fidx++];
        const imageName = returnValues[fidx++];
        const ioMegaBytes = returnValues[fidx++];
        const storageMegaBytes = returnValues[fidx++];
        const id = returnValues[fidx++];
        const inputFS = returnValues[fidx++];
        const args = returnValues[fidx++];

        const jobType = "service";

        const service = await getInfo(id, jobType);

        if (await isProcessed(id, false)) {
            console.log(`already processed job or dsp not selected: ${id}`)
            return;
        }

        if (!await validateServiceBalance(consumer, id)) {
            console.log(`min balance not met service: ${id}`)
            // TODO use actual values used
            // TODO ensure DAPP gas sufficient to cover gas of trx
            const ioMegaBytesUsed = 1;
            const storageMegaBytesUsed = 1;
            const rcpterr = await postTrx("serviceError", dspAccount, {
                jobID: id,
                stdErr: "service error",
                outputFS: "service error",
                ioMegaBytesUsed,
                storageMegaBytesUsed
            });
            return;
        }

        /*
        
            - check if already processed jobID, replay
                if not, ensure DSP selected by owner
                    if so, continue
                    if not, do not process
            - check if consumer balance sufficient
            - run docker job
                if error run job error with output
            - run job callback with output of docker job
        
        */

        let serviceResults;
        try{
            serviceResults = await dispatchService(id, imageName, inputFS, args);
        }
        catch(e){
            // todo: handle failure. 
            const ioMegaBytesUsed = 1;
            const storageMegaBytesUsed = 1;
            const rcpterr = await postTrx("serviceError", dspAccount, {
                jobID: id,
                stdErr: "service error",
                outputFS: "service error",
                ioMegaBytesUsed,
                storageMegaBytesUsed
            });
            console.log(e);
            console.log(rcpterr);
        }
        // // post results
        const servicercpt = await postTrx("serviceCallback", dspAccount, id, serviceResults.port);
        console.log(`posted service results`,consumer,imageName, serviceResults.port);
}

// todo: subscribe to Kill

function subscribe(theContract: any) {
    theContract.events["QueueJob"]({
        fromBlock: 0
    }, async function (error, result) {
        if (error) {
            console.log(error);
            return;
        }
        const returnValues = result.returnValues;
        let fidx = 0;
        const jobInfo = {
            consumer: returnValues[fidx++],
            owner: returnValues[fidx++],
            imageName: returnValues[fidx++],
            jobID: returnValues[fidx++],
            inputFS: returnValues[fidx++],
            args: returnValues[fidx++]
        }
        const jobType = "job";

        const job = await getInfo(jobInfo.jobID, jobType);


        if (await isProcessed(jobInfo.jobID, true)) {
            console.log(`already processed job or dsp not selected: ${jobInfo.jobID}`)
            return;
        }

        if (!await validateJobBalance(jobInfo.consumer, job.gasLimit, job.imageName)) {
            console.log(`min balance not met job: ${jobInfo.jobID}`)
            return;
        }

        let dispatchResult

        try {
            dispatchResult = await dispatch(job.imageName, jobInfo.inputFS, jobInfo.args);
        }
        catch (e) {
            await postTrx("jobError", dspAccount, jobInfo.jobID, "error dispatching", "");
            console.log("jobError",e);
        }

        console.log("dispatchResult");
        console.log(dispatchResult);
        const { outputFS } = dispatchResult;

        const rcpt = await postTrx("jobCallback", dspAccount, {
            jobID: jobInfo.jobID,
            outputFS: outputFS,
            outputHash: "hash"
        });
        console.log(`posted results`, jobInfo.consumer, job.jobImage, rcpt.transactionHash);
    });

    theContract.events["QueueService"]({
        fromBlock: 0
    }, async function (error, result) {
        if (error) {
            console.log(error);
            return;
        }

        await runService(result.returnValues);
    });

    theContract.events["ServiceComplete"]({
        fromBlock: 0
    }, async function (error, result) {
        console.log('ServiceComplete hit');
        if (error) {
            console.log("event error",error);
            return;
        }
    });

    theContract.events["ServiceError"]({
        fromBlock: 0
    }, async function (error, result) {
        console.log('ServiceError hit');
        if (error) {
            console.log("event error",error);
            return;
        }
    });
}