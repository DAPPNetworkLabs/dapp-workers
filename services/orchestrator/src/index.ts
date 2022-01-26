import { dispatch, dispatchService } from './dispatch';
const fs = require('fs');
const path = require('path');

import { getAccount } from './getAccount';
import { web3,provider } from './web3global';
import { postTrx } from './postTrx';
import { callTrx } from './callTrx';

const Web3 = require('web3');
let abi = require('/nexus/abi/contracts/Nexus.sol/Nexus.json');
// abi = JSON.stringify(abi);

provider.on('error', e => console.log('WS Error', e));
function socketError(e){
    console.log('WS closed');
    console.log('Attempting to reconnect...');
    const provider = new Web3.providers.WebsocketProvider(process.env.ETH_ADDR);

    provider.on('connect', function () {
        console.log('WSS Reconnected');
    });
    provider.on('end', socketError);
    provider.on('close', socketError);

    web3.setProvider(provider);
    if(theContract)
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
export { abi, address };
let dspAccount;
let ownerAccount;
const run = ()=>{
    dspAccount = getAccount();    
    subscribe(theContract);
}

run();

async function isProcessed(jobID, isJob){
    return await theContract.methods.jobServiceCompleted(jobID, dspAccount.address, isJob).call({from:dspAccount.address});
}

async function validateBalance(consumer, gasLimit, imageName){
    const dspData =  await theContract.methods.dspData(consumer,dspAccount.address).call({from:dspAccount.address});
    const requiredAmount =  await theContract.methods.getMaxPaymentForGas(gasLimit, imageName, dspAccount.address).call({from:dspAccount.address});

    if(dspData.amount >= requiredAmount) {
        console.log(`validateBalance: true`);
        return true;
    } else {
        console.log(`validateBalance: false`);
        return false;
    }
}

const getInfo = async(jobId,type) => {
    if(type=="job") {
        return await theContract.methods.jobs(jobId).call({from:dspAccount.address});
    } else if(type=="service") {
        return await theContract.methods.services(jobId).call({from:dspAccount.address});
    }
}

// todo: subscribe to Kill

function subscribe(theContract: any) {
    console.log('subscribing');
    theContract.events["QueueJob"]({
        fromBlock: 0
    }, async function (error, result) {
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
        const jobType = "job";
        console.log("jobInfo");
        console.log(jobInfo);
        
        const job = await getInfo(jobInfo.jobID, jobType);
        console.log("job");
        console.log(job);
        
        // add read function to tell whether dsp done with jobv

        /*
        
            - DONE - check if already processed jobID, replay
                if not, ensure DSP selected by owner
                    if so, continue
                    if not, do not process
            - DONE - check if consumer balance sufficient
            - run docker job
                if error run job error with output
            - run job callback with output of docker job
        
        */
        

        // check if already processed (in case not caught up with events)
        if(await isProcessed(jobInfo.jobID, true)){
            console.log(`already processed job or dsp not selected: ${jobInfo.jobID}`)
            return;
        }

        if(!await validateBalance(jobInfo.consumer, job.gasLimit, job.imageName)) {
            console.log(`min balance not met: ${jobInfo.jobID}`)
            return;
        }
        
        const start = Date.now();
        let dispatchResult
        try{
            dispatchResult  = await dispatch(job.imageName, jobInfo.inputFS, jobInfo.args);
        }
        catch(e){
            // todo: handle failure. 
            const rcpterr = await postTrx("jobError", dspAccount, jobInfo.jobID, "error dispatching","");
            console.log(e);
            console.log(rcpterr);
        }

        console.log("dispatchResult");
        console.log(dispatchResult);
        const { outputFS } = dispatchResult;


        const millis = Date.now() - start;
        // // todo: kill docker if running too long and fail with not enough gas

        const rcpt = await postTrx("jobCallback", dspAccount, {
            jobID:jobInfo.jobID, 
            outputFS:outputFS,
            outputHash:"hash"
        });
        // const rcpt = await theContract.methods.jobCallback({
        //     jobID:jobInfo.jobID, 
        //     outputFS:outputFS,
        //     outputHash:"hash"
        // }).sendTransaction({from:dspAccount.address});
        console.log(`posted results`,jobInfo.consumer,job.jobImage, rcpt.transactionHash);
        // console.log(rcpt);
    });

    // theContract.events["QueueService"]({
    //     fromBlock: "earliest"
    // }, async function (error, result) {
    //     console.log('QueueService hit');
    //     if (error) {
    //         console.log(error);
    //         return;
    //     }
        
    //     const returnValues = result.returnValues;
    //     let fidx = 0;
    //     const consumer = returnValues[fidx++];
    //     // const jobImage = returnValues[fidx++];
    //     // const inputFS = returnValues[fidx++];
    //     // const ioMegaBytes = returnValues[fidx++];
    //     // const storageMegaBytes = returnValues[fidx++];
    //     // const args = returnValues[fidx++];
    //     const jobID = returnValues[fidx++];
    //     // const months = returnValues[fidx++];
    //     const jobType = "service";
        
    //     let serviceInfo = await getInfo(jobID, jobType);
    //     serviceInfo = {
    //         owner: serviceInfo[fidx++],
    //         imageName: serviceInfo[fidx++],
    //         lastCalled: serviceInfo[fidx++],
    //         endDate: serviceInfo[fidx++],
    //         months: serviceInfo[fidx++],
    //         ioMegaBytes: serviceInfo[fidx++],
    //         storageMegaBytes: serviceInfo[fidx++]
    //     }
    //     console.log("serviceInfo");
    //     console.log(serviceInfo);

    //     // const dappGasRemaining = await getConsumerDAPPGas(consumer);

    //     // // check if already processed (in case not caught up with events)
    //     //  if(!await isProcessed(jobID)){
    //     //      return;
    //     //  }
    //     // // todo: resolve image from registry
    //     // const account_dsp = dspAccount;
    //     // const dockerImage = await getDockerImage(jobImage, account_dsp.address,jobType);
    //     // const gasPrice = await getGasPrice();
    //     // const gasForCallback = await getGasForCallback(jobType);
    //     // let dapps = (await EthGAS2DAPPs(gasForCallback * gasPrice));
        
    //     // dapps += (await DAPPsFor(24 * 60));
    //     // // todo: check if user has enough dapp gas for one hour of service before starting
    //     // if(dappGasRemaining < dapps){
    //     //     // todo: fail
    //     //     const rcpterr = await postTrx("serviceError", account_dsp, jobID, "", dapps.toFixed());
    //     // }
    //     // let serviceResults;
    //     // try{
    //     //     serviceResults = await dispatchService(dockerImage, inputFS, args);
    //     // }
    //     // catch(e){
    //     //     // todo: handle failure. 
    //     //     const rcpterr = await postTrx("serviceError", account_dsp, jobID, "", dapps.toFixed());
    //     //     console.log(e);
    //     //     console.log(rcpterr);
    //     // }
    //     // // post results
    //     // const servicercpt = await postTrx("serviceCallback", account_dsp, jobID, serviceResults.port);
    //     // setInterval(async ()=>{
    //     //     const servicercpt2 = await postTrx("serviceCallback", account_dsp, jobID, serviceResults.port, await DAPPsFor(24 * 60) + await EthGAS2DAPPs(gasForCallback * gasPrice));
    //     //     console.log(`posting alive`,consumer,jobImage);    
    //     //     // todo: kill if not enough gas
    //     // },1000 * 60 * 60 * 24)
    //     // // todo: set a timer to periodically post serviceCallback
    //     // console.log(`posted service results`,consumer,jobImage, serviceResults.port,dapps.toFixed());
    // });

    // theContract.events["ServiceRunning"]({
    //     fromBlock: 0
    // }, async function (error, result) {
    //     console.log('ServiceRunning hit');
    //     if (error) {
    //         console.log("event error",error);
    //         return;
    //     }

    //     // const returnValues = result.returnValues;
    //     // let fidx = 0;        
    //     // const obj={
    //     //     consumer: returnValues[fidx++],
    //     //     dsp: returnValues[fidx++],
    //     //     jobID: returnValues[fidx++],
    //     //     port: returnValues[fidx++]
    //     // }
    //     // if(pendingJobs[obj.jobID]){
    //     //     await pendingJobs[obj.jobID](obj);
    //     //     delete pendingJobs[obj.jobID];
    //     // }
    //     // console.log(`got final results`,obj);
    // });
}