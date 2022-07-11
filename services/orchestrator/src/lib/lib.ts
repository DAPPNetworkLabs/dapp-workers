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

export const completeService = async (jobID, outputFS, storageMegaBytesUsed, workerAccount: { address: string, privateKey: string }) => {
    await postTrx("serviceComplete", workerAccount, null, {
        jobID,
        outputFS,
        // ioMegaBytesUsed,
        storageMegaBytesUsed
    });
}

export const deleteService = async (imageName: string, id: number) => {
    // try {
        const cmd = `PRIORITY_CLASS=${"high"} WORKERS_SERVICE_NAME=${imageName}-${id} IPFS_HOST=${process.env.IPFS_HOST} envsubst < /dapp-workers/k8s/test/images/${imageName}.yaml | kubectl delete -f -`
        // console.log(cmd);
        await execPromise(cmd,{});
    // } catch(e) {
    //     console.log(`error deleting service`,e);
    // }
}

export const endService = async (job, msg, log, workerAccount: { address: string, privateKey: string }) => {
    await removeUsageInfo(job.key);
    // await execPromise(`docker stop ${job.dockerId}`,{});
    await deleteService(job.imageName,job.key);
    await completeService(
        job.key,
        msg, 
        // job.io_usage, 
        // job.storage_usage,
        0, 
        workerAccount
    );
}

export const endServiceError = async (job, msg, log, workerAccount: { address: string, privateKey: string }) => {
    // await execPromise(`docker stop ${job.dockerId}`,{});
    await deleteService(job.imageName,job.key);
    await postTrx("serviceError", workerAccount, null, {
        jobID: job.key,
        stdErr: msg,
        outputFS: "",
        // ioMegaBytesUsed:0,
        storageMegaBytesUsed:0
    });
    await removeUsageInfo(job.key);
}

// export const returnUsage = async (job, workerAccount) => {
//     let storageUsed: string, ioInfo: any, failedCheck = false;
    
//     try {
//         storageUsed = await execPromise(`docker ps --size --filter "id=${job.dockerId}" --format "{{.Size}}"`,{});
        
//         const cmd = `docker stats --no-stream --format "{{.NetIO}}" ${job.dockerId}`;

//         ioInfo = await execPromise(cmd,{});
//     } catch(e) {
//         failedCheck = true;
//     }

//     if(ioInfo) {
//         const inputUsage: number = toMegaBytes(ioInfo.split(' / ')[0].replace(/[\n\r]/g, ''));
//         const outputUsage: number = toMegaBytes(ioInfo.split(' / ')[1].replace(/[\n\r]/g, ''));
        
//         if(startup == true) {
//             job.last_io_usage = Math.floor(job.io_usage);
//             startup = false;
//         }
        
//         job.io_usage = Math.floor((inputUsage + outputUsage) + job.last_io_usage);
//         job.storage_usage = Math.floor(toMegaBytes(storageUsed.split(' ')[0]));
//     } else {
//         if(failedCheck) {
//             console.log(`container not found: ${job.dockerId}, removing ${job.key}`);
//             await removeUsageInfo(job.key);
//             await postTrx("serviceError", workerAccount, null, {
//                 jobID: job.key,
//                 stdErr: "error dispatching",
//                 outputFS: "",
//                 ioMegaBytesUsed:job.io_usage,
//                 storageMegaBytesUsed:job.storage_usage
//             });
//         }
//     }
    
//     return job;
// }

export const intervalCallback = async (workerAccount) => {
    // if(process.env.DAPP_WORKERS_K8S) {
        // console.log('k8s enabled')
        // check if service finished on chain, remove from db, delete if not deleted
        // check if service time finished, complete, remove from db, delete if not deleted
        // check output usage, if exceeds
        // io - $0.00 for 1150 Mbps per r5.xlarge instance-hour (or partial hour)
            // All data transfer in	$0.00 per GB
            // First 10 TB / Month	$0.09 per GB
            // how to monitor output
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
    // } else {
    //     const jobs = await fetchAllUsageInfo();
    //     for(const index in jobs) {
    //         let job = jobs[index];
            
    //         if (await isProcessed(job.key, false, workerAccount)) {
    //             await removeUsageInfo(job.key);
    //             return;
    //             // throw new Error(`already processed job or worker not selected: ${job.key}`)
    //         }
            
    //         job = await returnUsage(job, workerAccount);
            
    //         const limits = await validateDataLimits(job.key, workerAccount);
            
    //         if(job.io_usage > limits.ioMegaBytesLimit || job.storage_usage > limits.storageMegaBytesLimit) {
    //             await endServiceError(job, 
    //             "io/storage resource limit reached", `max io/storage limit reached for job id: ${job.key} | docker id: ${job.dockerId} | io usage: ${job.io_usage} | io limit: ${limits.ioMegaBytesLimit} | storage usage: ${job.storage_usage} | storage limit: ${limits.storageMegaBytesLimit}`
    //             ,workerAccount)
    //         }
            
    //         const serviceInfo = await getInfo(job.key,"service", workerAccount);
    //         const valid = await validateServiceBalance(serviceInfo.consumer, job.key, workerAccount);
    //         if (valid == false) {
    //             await endServiceError(
    //                 job, 
    //                 "dapp gas limit reached", `dapp gas ran out for job id: ${job.key} | docker id: ${job.dockerId}`,
    //                 workerAccount
    //             )
    //         }
            
    //         if(await isServiceDone(job.key, workerAccount)) {
    //             await endService(job, "service time exceeded", `service time exceeded: ${job.key} | docker id: ${job.dockerId}`, workerAccount);
    //         }
            
    //         console.log(`job 
    //             id: ${job.key}, 
    //             docker id: ${job.dockerId}, 
    //             io_usage: ${job.io_usage}/${limits.ioMegaBytesLimit}, 
    //             storage_usage: ${job.storage_usage}/${limits.storageMegaBytesLimit}`
    //         );
            
    //         await updateUsageInfo(job.key, job.io_usage, job.storage_usage, job.last_io_usage);
    //     }
    // }
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
                outputFS: "",
                // ioMegaBytesUsed:0,
                storageMegaBytesUsed:0
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
    // const ioMegaBytes = returnValues[fidx++];
    const storageMegaBytes = returnValues[fidx++];
    const id = returnValues[fidx++];
    const inputFS = returnValues[fidx++];
    const args = returnValues[fidx++];

    await verifyImageHash(imageName, id, false, workerAccount);
    
    // const ioMegaBytesUsed = 0;
    const storageMegaBytesUsed = 0;

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
            outputFS: "",
            // ioMegaBytesUsed,
            storageMegaBytesUsed
        });
        return;
    }

    const serviceResults = await dispatchService(id, imageName, inputFS, args);
    
    if(serviceResults.error) {
        console.log("serviceError", serviceResults.error);
        await postTrx("serviceError", workerAccount, null, {
            jobID: id,
            stdErr: "service error",
            outputFS: "service error",
            // ioMegaBytesUsed,
            storageMegaBytesUsed
        });
        await removeUsageInfo(id);
    } else {
        // post results
        await postTrx("serviceCallback", workerAccount, null, id, serviceResults.port);
        console.log(`posted service results`,consumer,imageName, serviceResults.port);
    }
}

export const handleSize = (size, base, item) => {
    if(size == '') {
        size = "B";
        base = Number(item.slice(0,-1));
    }
    
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

export const toMegaBytes = (item) => {
    const sizes = [{name:'KB'},{name:'MB'},{name:'GB'},{name:'TB'}];
    let size = '', base;
    
    for(const index in sizes) {
        if(item.slice(-2).toUpperCase() == sizes[index].name) {
            size = sizes[index].name;
            base = Number(item.slice(0,-2));
        }
    }
    
    return handleSize(size, base, item);
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