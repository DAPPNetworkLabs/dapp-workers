import { dispatch, dispatchService } from './dispatch';
const fs = require('fs');
const path = require('path');

import { getAccount } from './getAccount';
import { web3, provider } from './web3global';
import { postTrx } from './postTrx';
import { callTrx } from './callTrx';

let abi = require(process.env.NEXUS_PATH || '/nexus/artifacts/contracts/Nexus.sol/Nexus.json');

export { address };
const dal = require('./dal/models/index');
const { fetchAllUsageInfo, getUsageInfo, updateUsageInfo, removeUsageInfo } = require('./dal/dal')
import { execPromise } from './exec';

let startup = true;
const seconds = 30; // interval length

const address = process.env.ADDRESS;
const fromBlock = process.env.FROM_BLOCK || 0; // load and save to file
const theContract = new web3.eth.Contract(
    abi.abi,
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
        return base / (1000 * 1000);
    } else if(size == 'KB') {
        return base / 1000;
    } else if(size == 'MB') {
        return base;
    } else if(size == 'GB') {
        return base * 1000;
    } else if(size == 'TB') {
        return base * 1000 * 1000;
    } else {
        throw new Error(`should not get here: ${size}, ${base}`);
    }
}

async function validateDataLimits(id) {
    return await theContract.methods.getWORKERDataLimits(id, workerAccount.address).call({ from: workerAccount.address });
}

const completeService = async (jobID, outputFS, ioMegaBytesUsed, storageMegaBytesUsed) => {
    await postTrx("serviceComplete", workerAccount, {
        jobID,
        outputFS,
        ioMegaBytesUsed,
        storageMegaBytesUsed
    });
}

const endService = async (job, msg, log) => {
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

const endServiceError = async (job, msg, log) => {
    await execPromise(`docker stop ${job.dockerId}`,{});
    // await execPromise(`docker rm ${job.dockerId}`,{});
    // await execPromise(`docker rm ${job.dockerId} -v`,{});
    await postTrx("serviceError", workerAccount, {
        jobID: job.key,
        stdErr: msg,
        outputFS: "",
        ioMegaBytesUsed:0,
        storageMegaBytesUsed:0
    });
    await removeUsageInfo(job.key);
}

const intervalCallback = async () => {
    const jobs = await fetchAllUsageInfo();
    for(const index in jobs) {
        const job = jobs[index];
        // console.log(`ids: ${job.key}`);
        // console.log(`docker id: ${job.dockerId}`);
        
        if (await isProcessed(job.key, false)) {
            throw new Error(`already processed job or worker not selected: ${job.key}`)
            // await removeUsageInfo(job.key);
        }
        
        let storageUsed: any, ioInfo: any;
        
        try {
            storageUsed = await execPromise(`docker ps --size --filter "id=${job.dockerId}" --format "{{.Size}}"`,{});
            
            const cmd = `docker stats --no-stream --format "{{.NetIO}}" ${job.dockerId}`;
    
            ioInfo = await execPromise(cmd,{});
        } catch(e) {
            console.log('error right about here',e);
            await postTrx("serviceError", workerAccount, {
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
            await endServiceError(job, "io/storage resource limit reached", `max io/storage limit reached for job id: ${job.key} | docker id: ${job.dockerId} | io usage: ${job.io_usage} | io limit: ${limits.ioMegaBytesLimit} | storage usage: ${job.storage_usage} | storage limit: ${limits.storageMegaBytesLimit}`)
        }
        
        const serviceInfo = await getInfo(job.key,"service");
        const valid = await validateServiceBalance(serviceInfo.consumer, job.key);
        if (valid == false) {
            await endServiceError(job, "dapp gas limit reached", `dapp gas ran out for job id: ${job.key} | docker id: ${job.dockerId}`)
        }
        
        if(await isServiceDone(job.key)) {
            await endService(job, "service time exceeded", `service time exceeded: ${job.key} | docker id: ${job.dockerId}`);
        }
        
        await updateUsageInfo(job.key, job.io_usage, job.storage_usage, job.last_io_usage);
    }
}
let workerAccount;
let ownerAccount;
const run = () => {
    workerAccount = getAccount();
    if(process.env.WORKER_AWS_KMS_ENABLED && process.env.WORKER_AWS_KMS_ENABLED.toString() == "true") {
        workerAccount.address = process.env.WORKER_AWS_KMS_ADDRESS;
        console.log('setting address',workerAccount)
        console.log('setting address',workerAccount.address)
    }
    subscribe(theContract);
    setInterval(() => {
        intervalCallback();
    }, 1000 * seconds);
}

run();

async function isProcessed(jobID, isJob) {
    return await theContract.methods.jobServiceCompleted(jobID, workerAccount.address, isJob).call({ from: workerAccount.address });
}

async function isServiceDone(jobID) {
    return await theContract.methods.isServiceDone(jobID).call({ from: workerAccount.address });
}

async function validateJobBalance(consumer, gasLimit, imageName) {
    const workerData = await theContract.methods.workerData(consumer, workerAccount.address).call({ from: workerAccount.address });
    const requiredAmount = await theContract.methods.getMaxPaymentForGas(gasLimit, imageName, workerAccount.address).call({ from: workerAccount.address });

    if (Number(workerData.amount) >= Number(requiredAmount)) {
        return true;
    } else {
        console.log(`validateJobBalance: false ${imageName} ${gasLimit} ${workerData.amount} ${requiredAmount} ${typeof(workerData.amount)} ${typeof(requiredAmount)} ${workerAccount.address}`);
        return false;
    }
}

async function validateServiceBalance(consumer, serviceId) {
    const workerData = await theContract.methods.workerData(consumer, workerAccount.address).call({ from: workerAccount.address });
    const requiredAmount = await theContract.methods.getMinBalance(serviceId, "service", workerAccount.address).call({ from: workerAccount.address });

    if (Number(workerData.amount) >= Number(requiredAmount)) {
        return true;
    } else {
        console.log(`validateServiceBalance: false ${workerData.amount} ${requiredAmount} ${typeof(workerData.amount)} ${typeof(requiredAmount)} ${workerAccount.address}`);
        return false;
    }
}

const getInfo = async (jobId, type) => {
    if (type == "job") {
        return await theContract.methods.jobs(jobId).call({ from: workerAccount.address });
    } else if (type == "service") {
        return await theContract.methods.services(jobId).call({ from: workerAccount.address });
    }
}

const verifyImageHash = async (image, id, isJob) => {
    let hash:any = await execPromise(`docker images --no-trunc --quiet ${image}`,{});
    hash = hash.slice(7).replace(/ +/g, "").replace(/[\n\r]/g, '');
    const chainHash = await theContract.methods.approvedImages(image).call({ from: workerAccount.address });
    if(hash != chainHash) {
        if(isJob) {
            console.log('jobError chain hash mismatch,image,hash,chainHash',image,hash,chainHash);
            await postTrx("jobError", workerAccount, id, "chain hash mismatch", "");
        } else {
            console.log('serviceError chain hash mismatch,image,hash,chainHash',image,hash,chainHash);
            await postTrx("serviceError", workerAccount, {
                jobID: id,
                stdErr: "chain hash mismatch",
                outputFS: "",
                ioMegaBytesUsed:0,
                storageMegaBytesUsed:0
            });
        }
        return;
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

        await verifyImageHash(imageName, id, false);
        
        const ioMegaBytesUsed = 0;
        const storageMegaBytesUsed = 0;

        const jobType = "service";

        const service = await getInfo(id, jobType);

        if (await isProcessed(id, false)) {
            console.log(`already processed job or worker not selected: ${id}`)
            return;
        }

        if (!await validateServiceBalance(consumer, id)) {
            console.log(`min balance not met service: ${id}`)
            // TODO use actual values used
            // TODO ensure DAPP gas sufficient to cover gas of trx
            const rcpterr = await postTrx("serviceError", workerAccount, {
                jobID: id,
                stdErr: "min balance not met",
                outputFS: "",
                ioMegaBytesUsed,
                storageMegaBytesUsed
            });
            return;
        }

        const serviceResults = await dispatchService(id, imageName, inputFS, args);
        
        if(serviceResults.error) {
            console.log("jobError", serviceResults.error);
            await postTrx("serviceError", workerAccount, {
                jobID: id,
                stdErr: "service error",
                outputFS: "service error",
                ioMegaBytesUsed,
                storageMegaBytesUsed
            });
            await removeUsageInfo(id);
        } else {
            // post results
            await postTrx("serviceCallback", workerAccount, id, serviceResults.port);
            console.log(`posted service results`,consumer,imageName, serviceResults.port);
        }
}

function subscribe(theContract: any) {
    theContract.events["QueueJob"]({}, async function (error, result) {
        console.log('QueueJob hit');
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

        await verifyImageHash(jobInfo.imageName, jobInfo.jobID, true);

        const jobType = "job";

        const job = await getInfo(jobInfo.jobID, jobType);

        if (await isProcessed(jobInfo.jobID, true)) {
            console.log(`already processed job or worker not selected: ${jobInfo.jobID}`)
            return;
        }

        if (!await validateJobBalance(jobInfo.consumer, job.gasLimit, job.imageName)) {
            console.log(`min balance not met job: ${jobInfo.jobID}`)
            return;
        }

        const dispatchResult:any = await dispatch(job.imageName, jobInfo.inputFS, jobInfo.args);
        
        if(dispatchResult.dockerError) {
            console.log("jobError", dispatchResult.dockerError, dispatchResult);
            await postTrx("jobError", workerAccount, jobInfo.jobID, "error dispatching", "");
        } else {
            const { outputFS } = dispatchResult;
            console.log("outputFS", outputFS);
    
            const rcpt = await postTrx("jobCallback", workerAccount, {
                jobID: jobInfo.jobID,
                outputFS: outputFS,
                outputHash: "hash"
            });
            console.log(`posted results`, jobInfo.consumer, job.imageName, rcpt.transactionHash);
        }
    });

    theContract.events["QueueService"]({}, async function (error, result) {
        if (error) {
            console.log(error);
            return;
        }

        await runService(result.returnValues);
    });

    theContract.events["ServiceComplete"]({}, async function (error, result) {
        console.log('ServiceComplete hit');
        if (error) {
            console.log("event error",error);
            return;
        }
    });

    theContract.events["ServiceError"]({}, async function (error, result) {
        console.log('ServiceError hit');
        if (error) {
            console.log("event error",error);
            return;
        }
    });

    theContract.events["JobError"]({}, async function (error, result) {
        console.log('JobError hit');
        if (error) {
            console.log("event error",error);
            return;
        }
    });
}

const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
const port = 8050;
const fetch = require('node-fetch');

app.get('/dapp-workers/io', async function(req, res, next) {
    try {
        const job = await getUsageInfo(req.query.id);
      
        const cmd = `docker stats --no-stream --format "{{.NetIO}}" ${job.dockerId}`;
    
        const ioInfo: any = await execPromise(cmd,{});
    
        const inputUsage = toMegaBytes(ioInfo.split(' / ')[0].replace(/[\n\r]/g, ''));
        const outputUsage = toMegaBytes(ioInfo.split(' / ')[1].replace(/[\n\r]/g, ''));
                
        res.send({
            io_usage: Math.floor((inputUsage + outputUsage) + job.last_io_usage)
        })
    } catch(e) {
        next(e);
    }
});

app.get('/dapp-workers/storage', async function(req, res, next) {
    try {
        const job = await getUsageInfo(req.query.id);
        const storageUsed: any = await execPromise(`docker ps --size --filter "id=${job.dockerId}" --format "{{.Size}}"`,{});
                
        res.send({
            storage_usage: Math.floor(toMegaBytes(storageUsed.split(' ')[0]))
        })
    } catch(e) {
        next(e);
    }
});

app.get('/dapp-workers', async function(req, res, next) {
    try {
        console.log(`url`,`http://${req.query.image}-${req.query.id}:${req.query.port}`);
        const response = await fetch(`http://${req.query.image}-${req.query.id}:${req.query.port}`, {method: 'GET'});
        console.log('response',response);
    
        let body = {};
        if(req.query.text && req.query.text.toString() == "true") {
            console.log('text')
            body = await response.text();
        } else {
            console.log('json')
            body = await response.json();
        }
                
        res.send(body)
    } catch(e) {
        next(e);
    }
});

app.post('/dapp-workers', async function(req, res, next) {
    try {
        console.log(`url`,`http://${req.query.image}-${req.query.id}:${req.query.port}`);
        console.log(`req.body`,req.body);
        const response = await fetch(`http://${req.query.image}-${req.query.id}:${req.query.port}`, {
          method: 'POST', 
          body: req.body,
          headers: { "Content-Type": "application/json" }
        });
        // console.log('response',response);
    
        let body = {};
        if(req.query.text && req.query.text.toString() == "true") {
            console.log('text')
            body = await response.text();
        } else {
            console.log('json')
            body = await response.json();
        }
        console.log('body',body)
                
        res.send(body)
        // console.log(`url`,`http://${req.query.image}-${req.query.id}:${req.query.port}`);
        // const response = await fetch(`http://${req.query.image}-${req.query.id}:${req.query.port}`, {
        //   method: 'POST', 
        //   body: req.body,
        //   headers: req.headers
        // });
                
        // res.send(response)
    } catch(e) {
        next(e);
    }
});

app.get('/', function(req, res) {
  res.send('Hello World!')
});

app.listen(port, function() {
  console.log(`Example app listening on port ${port}!`)
});