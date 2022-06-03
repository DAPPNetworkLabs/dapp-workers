const { getAccount } = require('./getAccount');
const { postTrx } = require('./postTrx');
const { callTrx } = require('./callTrx');
const dal = require('./dal/models/index');
const { handleQueueJob, runService, theContract, intervalCallback } = require('./lib/lib');

const fs = require('fs');
const path = require('path');

const seconds: number = 15; // interval length
const fromBlock = process.env.FROM_BLOCK || 0; // load and save to file
let workerAccount: { address: string, privateKey: string } = {
    address:'',
    privateKey:''
};

const run = () => {
    workerAccount = getAccount();
    if(process.env.WORKER_AWS_KMS_ENABLED && process.env.WORKER_AWS_KMS_ENABLED.toString() == "true") {
        workerAccount.address = process.env.WORKER_AWS_KMS_ADDRESS;
        console.log('setting address',workerAccount)
        console.log('setting address',workerAccount.address)
    }
    subscribe(theContract);
    setInterval(() => {
        intervalCallback(workerAccount);
    }, 1000 * seconds);
}

run();

export function subscribe(theContract: any) {
    theContract.events["QueueJob"]({}, async function (error, result) {
        console.log('QueueJob hit');
        if (error) {
            console.log('we got an error',error);
            return;
        }
        await handleQueueJob(result, workerAccount);
    });

    theContract.events["QueueService"]({}, async function (error, result) {
        console.log('QueueService hit');
        if (error) {
            console.log('we got an error',error);
            return;
        }
        
        await runService(result.returnValues, workerAccount);
    });

    theContract.once("ServiceComplete", async function (error, result) {
        console.log('ServiceComplete hit');
        if (error) {
            console.log('we got an error',error);
            return;
        }
    });

    theContract.once("ServiceError", async function (error, result) {
        console.log('ServiceError hit');
        if (error) {
            console.log('we got an error',error);
            return;
        }
    });

    theContract.once("JobError", async function (error, result) {
        console.log('JobError hit');
        if (error) {
            console.log('we got an error',error);
            return;
        }
    });
}