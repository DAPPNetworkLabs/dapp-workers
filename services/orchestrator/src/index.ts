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
const { fetchAllUsageInfo, updateUsageInfo, removeUsageInfo } = require('./dal/dal')
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

const toMegaBytes = (item) => {
    // console.log(`before item: ${item} ${item.length}`);
    const sizes = [{name:'KB'},{name:'MB'},{name:'GB'},{name:'TB'}];
    let size = '', base;
    for(const index in sizes) {
        if(item.slice(-2).toUpperCase() == sizes[index].name) {
            size = sizes[index].name;
            base = Number(item.slice(0,-2));
        }
    }
    if(size == '') {
        size = "B";
        base = Number(item.slice(0,-1));
    }
    
    // console.log(`size: ${size} | base: ${base} | base / 1000: ${base / 1000}, size == 'KB': ${size == 'KB'}`);
    
    if(size == 'B') {
        return base / 1000;
    } else if(size == 'MB') {
        return base;
    } else if(size == 'KB') {
        return base / 1000;
    } else if(size == 'GB') {
        return base * 1000;
    } else if(size == 'TB') {
        return base * 1000 * 1000;
    } else {
        throw new Error(`should not get here: ${size}, ${base}`);
    }
}

async function validateDataLimits(id) {
    return await theContract.methods.getDSPDataLimits(id, dspAccount.address).call({ from: dspAccount.address });
}

const completeService = async (jobID, outputFS, ioMegaBytesUsed, storageMegaBytesUsed) => {
    await postTrx("serviceComplete", dspAccount, {
        jobID,
        outputFS,
        ioMegaBytesUsed,
        storageMegaBytesUsed
    });
}

const endService = async (job, msg, log) => {
    console.log(log);
    await execPromise(`docker stop ${job.dockerId}`,{});
    // await execPromise(`docker rm ${job.dockerId}`,{});
    // await execPromise(`docker rm ${job.dockerId} -v`,{});
    await completeService(
        job.key,
        msg, 
        job.io_usage, 
        job.storage_usage
    );
    await removeUsageInfo(job.key);
}

const intervalCallback = async () => {
    const jobs = await fetchAllUsageInfo();
    for(const index in jobs) {
        const job = jobs[index];
        console.log(`ids: ${job.key}`);
        console.log(`docker id: ${job.dockerId}`);
        
        if (await isProcessed(job.key, false)) {
            throw new Error(`already processed job or dsp not selected: ${job.key}`)
            // await removeUsageInfo(job.key);
        }
        
        let storageUsed: any, ioInfo: any;
        
        try {
            storageUsed = await execPromise(`docker ps --size --filter "id=${job.dockerId}" --format "{{.Size}}"`,{});
            
            const cmd = `docker stats --no-stream --format "{{.NetIO}}" ${job.dockerId}`;
    
            ioInfo = await execPromise(cmd,{});
        } catch(e) {
            console.log('error right about here');
            await postTrx("serviceError", dspAccount, {
                jobID: job.key,
                stdErr: "error dispatching",
                outputFS: "",
                ioMegaBytesUsed:0,
                storageMegaBytesUsed:0
            });
            await removeUsageInfo(job.key);
            continue;
        }

        const inputUsage = toMegaBytes(ioInfo.split(' / ')[0].replace(/[\n\r]/g, ''));
        const outputUsage = toMegaBytes(ioInfo.split(' / ')[1].replace(/[\n\r]/g, ''));
        
        if(startup == true) {
            job.last_io_usage = Math.floor(job.io_usage);
            startup = false;
        }
        
        job.io_usage = Math.floor((inputUsage + outputUsage) + job.last_io_usage);
        job.storage_usage = Math.floor(toMegaBytes(storageUsed.split(' ')[0]));
        
        // console.log(`inputUsage: ${inputUsage}`);
        // console.log(`outputUsage: ${outputUsage}`);
        // console.log(`storage used: ${storageUsed}MB`);
        
        const limits = await validateDataLimits(job.key);
        
        // console.log(`limits: ${typeof(limits)=="object"?JSON.stringify(limits):limits}`)
        
        // console.log(job.key, job.io_usage, job.storage_usage, job.last_io_usage);
        
        if(job.io_usage > limits.ioMegaBytesLimit || job.storage_usage > limits.storageMegaBytesLimit) {
            await endService(job, "io/storage resource limit reached", `max io/storage limit reached for job id: ${job.key} | docker id: ${job.dockerId} | io usage: ${job.io_usage} | io limit: ${limits.ioMegaBytesLimit} | storage usage: ${job.storage_usage} | storage limit: ${limits.storageMegaBytesLimit}`);
        }
        
        const serviceInfo = await getInfo(job.key,"service");
        const valid = await validateServiceBalance(serviceInfo.consumer, job.key);
        if (valid == false) {
            await endService(job, "dapp gas limit reached", `dapp gas ran out for job id: ${job.key} | docker id: ${job.dockerId}`);
        }
        
        if(await isServiceDone(job.key)) {
            await endService(job, "service time exceeded", `service time exceeded: ${job.key} | docker id: ${job.dockerId}`);
        }
        
        await updateUsageInfo(job.key, job.io_usage, job.storage_usage, job.last_io_usage);
    }
}

export { abi, address };
let dspAccount;
let ownerAccount;
const run = () => {
    dspAccount = getAccount();
    subscribe(theContract);
    setInterval(() => {
        intervalCallback();
    }, 1000 * 30);
}

run();

async function isProcessed(jobID, isJob) {
    return await theContract.methods.jobServiceCompleted(jobID, dspAccount.address, isJob).call({ from: dspAccount.address });
}

async function isServiceDone(jobID) {
    return await theContract.methods.isServiceDone(jobID).call({ from: dspAccount.address });
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
        
        const ioMegaBytesUsed = 0;
        const storageMegaBytesUsed = 0;

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

        const serviceResults = await dispatchService(id, imageName, inputFS, args);
        
        if(serviceResults.error) {
            console.log("jobError", serviceResults.error);
            // todo: handle failure. 
            const rcpterr = await postTrx("serviceError", dspAccount, {
                jobID: id,
                stdErr: "service error",
                outputFS: "service error",
                ioMegaBytesUsed,
                storageMegaBytesUsed
            });
        } else {
            // post results
            const servicercpt = await postTrx("serviceCallback", dspAccount, id, serviceResults.port);
            console.log(`posted service results`,consumer,imageName, serviceResults.port);
        }
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

        const dispatchResult:any = await dispatch(job.imageName, jobInfo.inputFS, jobInfo.args);
        
        if(dispatchResult.dockerError) {
            console.log("jobError", dispatchResult.dockerError, dispatchResult);
            await postTrx("jobError", dspAccount, jobInfo.jobID, "error dispatching", "");
        } else {
            console.log("dispatchResult", dispatchResult);
            const { outputFS } = dispatchResult;
    
            const rcpt = await postTrx("jobCallback", dspAccount, {
                jobID: jobInfo.jobID,
                outputFS: outputFS,
                outputHash: "hash"
            });
            console.log(`posted results`, jobInfo.consumer, job.jobImage, rcpt.transactionHash);
        }
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

    theContract.events["JobError"]({
        fromBlock: 0
    }, async function (error, result) {
        console.log('JobError hit');
        if (error) {
            console.log("event error",error);
            return;
        }
    });
}