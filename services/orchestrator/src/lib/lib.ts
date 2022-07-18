const abi = require(process.env.NEXUS_PATH || '/nexus/artifacts/contracts/Nexus.sol/Nexus.json');
const { web3, provider } = require('../web3global');
const { postTrx } = require('../postTrx');
const { execPromise } = require('../exec');
const { dispatch, dispatchService } = require('../dispatch');
const { fetchAllUsageInfo, removeUsageInfo } = require('../dal/dal')
// const { fetchAllUsageInfo, getUsageInfo, updateUsageInfo, removeUsageInfo } = require('../dal/dal')

let startup: boolean = true;

export const theContract = new web3.eth.Contract(
    abi.abi,
    process.env.ADDRESS,
    {}
);

export async function validateDataLimits(id, workerAccount: { address: string, privateKey: string }) {
    return await theContract.methods.getWORKERDataLimits(id, workerAccount.address).call({ from: workerAccount.address });
}

export const completeService = async (jobID, outputFS, workerAccount: { address: string, privateKey: string }) => {
    await postTrx("serviceComplete", workerAccount, null, {
        jobID,
        outputFS
    });
}

export const deleteService = async (imageName: string, id: number) => {
    const cmd = `PRIORITY_CLASS=${"high"} WORKERS_SERVICE_NAME=${imageName}-${id} IPFS_HOST=${process.env.IPFS_HOST} envsubst < /dapp-workers/k8s/test/images/${imageName}.yaml | kubectl delete -f -`
    await execPromise(cmd,{});
}

export const endService = async (job, msg, log, workerAccount: { address: string, privateKey: string }) => {
    await removeUsageInfo(job.key);
    await deleteService(job.imageName,job.key);
    await completeService(
        job.key,
        msg,
        workerAccount
    );
}

export const endServiceError = async (job, msg, log, workerAccount: { address: string, privateKey: string }) => {
    await deleteService(job.imageName,job.key);
    await postTrx("serviceError", workerAccount, null, {
        jobID: job.key,
        stdErr: msg,
        outputFS: ""
    });
    await removeUsageInfo(job.key);
}

export const intervalCallback = async (workerAccount) => {
    const jobs = await fetchAllUsageInfo();
    for(const index in jobs) {
        let job = jobs[index];
        
        // console.log(`interval callback hit: ${job.key}, ${job.imageName}`)
        
        if (await isProcessed(job.key, false, workerAccount)) {
            await removeUsageInfo(job.key);
            await deleteService(job.imageName, job.key);
            return;
            // throw new Error(`already processed job or worker not selected: ${job.key}`)
        }
        
        if(await isServiceDone(job.key, workerAccount)) {
            await endService(job, "service time exceeded", `service time exceeded: ${job.key} | image: ${job.imageName}`, workerAccount);
        }
    }
}

export async function isProcessed(jobID: number, isJob, workerAccount: { address: string, privateKey: string }) {
    return await theContract.methods.jobServiceCompleted(jobID, workerAccount.address, isJob).call({ from: workerAccount.address });
}

export async function isServiceDone(jobID: number, workerAccount: { address: string, privateKey: string }) {
    return await theContract.methods.isServiceDone(jobID).call({ from: workerAccount.address });
}

export async function validateJobBalance(consumer:string, gasLimit:string, imageName: string, workerAccount: { address: string, privateKey: string }) {
    const workerData = await theContract.methods.workerData(consumer, workerAccount.address).call({ from: workerAccount.address });
    const requiredAmount = await theContract.methods.getMaxPaymentForGas(gasLimit, imageName, workerAccount.address).call({ from: workerAccount.address });

    if (Number(workerData.amount) >= Number(requiredAmount)) {
        return true;
    } else {
        console.log(`validateJobBalance: false ${imageName} ${gasLimit} ${workerData.amount} ${requiredAmount} ${typeof(workerData.amount)} ${typeof(requiredAmount)} ${workerAccount.address}`);
        return false;
    }
}

export async function validateServiceBalance(consumer, serviceId: number, workerAccount: { address: string, privateKey: string }) {
    const workerData = await theContract.methods.workerData(consumer, workerAccount.address).call({ from: workerAccount.address });
    const requiredAmount = await theContract.methods.getMinBalance(serviceId, "service", workerAccount.address).call({ from: workerAccount.address });

    if (Number(workerData.amount) >= Number(requiredAmount)) {
        return true;
    } else {
        console.log(`validateServiceBalance: false ${workerData.amount} ${requiredAmount} ${typeof(workerData.amount)} ${typeof(requiredAmount)} ${workerAccount.address}`);
        return false;
    }
}

export const getInfo = async (jobId: number, type: string, workerAccount: { address: string, privateKey: string }) => {
    if (type == "job") {
        return await theContract.methods.jobs(jobId).call({ from: workerAccount.address });
    } else if (type == "service") {
        return await theContract.methods.services(jobId).call({ from: workerAccount.address });
    }
}

export const verifyImageHash = async (image: string, id: number, isJob: boolean, workerAccount: { address: string, privateKey: string }) => {
    let hash:any = await execPromise(`docker images --digests --format "{{.Digest}}" ${image}`,{});
    // console.log('hit hash',hash,await execPromise(`docker images --digests --format "{{.Digest}}" ${image}`,{}))
    let tries = 3;
    while(!hash && tries--) {
        await execPromise(`docker pull ${image}`,{});
        hash = await execPromise(`docker images --digests --format "{{.Digest}}" ${image}`,{});
        console.log('retried pulling image for hash',hash);
    }
    hash = hash.slice(7).replace(/ +/g, "").replace(/[\n\r]/g, '');
    const chainHash = await theContract.methods.approvedImages(image).call({ from: workerAccount.address });
    if(hash != chainHash) {
        if(isJob) {
            console.log('jobError chain hash mismatch,image,hash,chainHash',image,hash,chainHash);
            await postTrx("jobError", workerAccount, null, id, "chain hash mismatch", "");
        } else {
            console.log('serviceError chain hash mismatch,image,hash,chainHash',image,hash,chainHash);
            await postTrx("serviceError", workerAccount, null, {
                jobID: id,
                stdErr: "chain hash mismatch",
                outputFS: ""
            });
        }
        return;
    }
}

export const runService = async (returnValues, workerAccount: { address: string, privateKey: string }) => {
    let fidx = 0;
    const consumer = returnValues[fidx++];
    const owner = returnValues[fidx++];
    const imageName = returnValues[fidx++];
    const id = returnValues[fidx++];
    const inputFS = returnValues[fidx++];
    const args = returnValues[fidx++];

    await verifyImageHash(imageName, id, false, workerAccount);
    
    const jobType = "service";

    const service = await getInfo(id, jobType, workerAccount);

    if (await isProcessed(id, false, workerAccount)) {
        console.log(`already processed job or worker not selected: ${id}`)
        return;
    }

    if (!await validateServiceBalance(consumer, id, workerAccount)) {
        console.log(`min balance not met service: ${id}`)
        // TODO use actual values used
        // TODO ensure DAPP gas sufficient to cover gas of trx
        const rcpterr = await postTrx("serviceError", workerAccount, null, {
            jobID: id,
            stdErr: "min balance not met",
            outputFS: ""
        });
        return;
    }

    const serviceResults = await dispatchService(id, imageName, inputFS, args);
    
    if(serviceResults.error) {
        console.log("serviceError", serviceResults.error);
        await postTrx("serviceError", workerAccount, null, {
            jobID: id,
            stdErr: "service error",
            outputFS: "service error"
        });
        await removeUsageInfo(id);
    } else {
        // post results
        await postTrx("serviceCallback", workerAccount, null, id, serviceResults.port);
        console.log(`posted service results`,consumer,imageName, serviceResults.port);
    }
}

export const handleQueueJob = async (result, workerAccount) => {
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

    await verifyImageHash(jobInfo.imageName, jobInfo.jobID, true, workerAccount);

    const jobType = "job";

    const job = await getInfo(jobInfo.jobID, jobType, workerAccount);

    if (await isProcessed(jobInfo.jobID, true, workerAccount)) {
        console.log(`already processed job or worker not selected: ${jobInfo.jobID}`)
        return;
    }

    if (!await validateJobBalance(jobInfo.consumer, job.gasLimit, job.imageName, workerAccount)) {
        console.log(`min balance not met job: ${jobInfo.jobID}`)
        return;
    }

    const dispatchResult:any = await dispatch(job.imageName, jobInfo.inputFS, jobInfo.args);
    
    if(dispatchResult.dockerError) {
        console.log("jobError", dispatchResult.dockerError, dispatchResult);
        await postTrx("jobError", workerAccount, null, jobInfo.jobID, "error dispatching", "");
    } else {
        const { outputFS } = dispatchResult;

        const rcpt = await postTrx("jobCallback", workerAccount, null, {
            jobID: jobInfo.jobID,
            outputFS: outputFS,
            outputHash: "hash"
        });
    }
}