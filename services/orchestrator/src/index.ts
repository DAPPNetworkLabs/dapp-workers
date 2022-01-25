import { dispatch, dispatchService } from './dispatch';
const fs = require('fs');
const path = require('path');

import { getAccount } from './getAccount';
import { compile, contractWrapper } from './compile';
import { deploy } from './deploy';
import { web3,provider } from './web3global';
import { runJob, runService, pendingJobs } from './jobClient';
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

export const address = process.env.ADDRESS;
const fromBlock = 0; // load and save to file
const theContract = new web3.eth.Contract(
    abi,
    address,
    {}
);
export { abi };
let dspAccount;
let ownerAccount;
// async function approveImage(image){
//     await postTrx("approveDockerForDSP",dspAccount,image);
// }

// async function setImage(alias,image = null, jobType = "job"){
//     if(image == null){
//         image= alias;
//     }
//     if(jobType == "job") {
//         // job fee 10, with 2 decimal places $0.10 per hour
//         await postTrx("setJobDockerImage",ownerAccount,alias,image,"hash",10);
//     } else {
//         // base,storage,and io fees 10, with 2 decimal places $0.10 per hour/gb
//         await postTrx("setServiceDockerImage",ownerAccount,alias,image,"hash",10,10,10);
//     }
// }
const run = ()=>{
// const run = async()=>{
    // let init = false;
    // const contractFile = await compile();
    // // const contractFile = require('/nexus/artifacts/contracts/Nexus.sol/Nexus.json');
    // const bytecode = contractFile.bytecode;
    // abi = contractFile.abi;
    
    // /// deploy contract if needed
    dspAccount = getAccount();    
    // if(!address){
    //     ownerAccount = dspAccount;
    //     if(process.env.COMPOSE_PROFILES != "debug"){
    //         throw new Error("can only deploy when COMPOSE_PROFILES=debug")
    //     }
    //     address =await deploy(bytecode,abi,ownerAccount); 
    //     init = true;
    // }
    // else
    //     contractWrapper.address = address;
    
    // theContract = new web3.eth.Contract(
    //     abi,
    //     address,
    //     {}
    // );
    subscribe(theContract);
    // if(init){
    //     await setImage("wasmrunner","runner");
    //     await setImage("rust-compiler");
    //     await setImage("wasi-service", "wasi-service","service");
    // }
    // // todo: check if already registered        
    // // gas fee mult 20/100 = 20%
    // await postTrx("regDSP",dspAccount, "http://test.com",20);
    // await approveImage("wasmrunner");
    // await approveImage("rust-compiler");
    // await approveImage("wasi-service");

    // if(init){
    //     await testConsumer(dspAccount.address);
    // }
    // console.log(`Deployed to: ${address}`);
}

run() ;
// subscribe(theContract);
// function loadfsRoot(fsrootName){
//     return fs.readFileSync(path.resolve('.', `fsroots/${fsrootName}.ipfs`)).toString().trim();
// }
// async function testConsumer(address: any) {
//     const account2 = getAccount("m/44'/60'/0'/0/1");

//     await postTrx("setQuorum", account2, account2.address, [address]);
//     const jobCompileResult = await runJob("rust-compiler", loadfsRoot("pngWriterTest"), []);
//     const serviceCompileResult = await runJob("rust-compiler", loadfsRoot("serviceTest"), []);

//     const jobResult = await runJob("wasmrunner", jobCompileResult.outputFS, ["target/wasm32-wasi/release/test"]);
//     console.log("jobResult",jobResult);
//     // swagger wasi service
    
//     // console.log("serviceCompileResult",serviceCompileResult);
//     // const srvcfs = "QmYhAAxgWmjv6EaApGGJvsqEsmfFfHVQRQ9e7ifbAvqpEF";
//     const srvcfs = serviceCompileResult.outputFS ;
//     const serviceResult = await runService("wasi-service", srvcfs, ["target/wasm32-wasi/release/test"]);
//     console.log("serviceCompileResult", serviceResult);
// }

async function getDockerImage(imageName, dspAddress, imageType){    
    const dspAccount = getAccount("m/44'/60'/0'/0/0");   
    const image = await callTrx("getDockerImage", dspAccount, imageName, imageType);
    const isApproved = await callTrx("isImageApprovedForDSP", {address:dspAddress}, dspAddress, imageName);    
    if(!isApproved)
        throw new Error("not approved");
    // todo: verify hash
    return image;
}

async function getConsumerDAPPGas(consumer){
    // todo: get remaining on chain
    // todo: get pending in this process
    return 0;
}

async function getDAPPPriceInEth(){
    // todo: fetch from dex
    return 0.005;
}

async function EthGAS2DAPPs(gas){
    const price = await getDAPPPriceInEth();
    return gas * (1/price);
}

async function getGasPrice(){
    return 33;
}

async function getGasForCallback(type){
    // todo: fill real numbers
    if(type = "service"){
        return 100;
    }
    if(type = "job"){
        return 100;    
    }
}

async function DAPPsFor(minutes){
    return minutes * 100;
}

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
        
        let job = await getInfo(jobInfo.jobID, jobType);
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

        // const dappGasRemaining = await getConsumerDAPPGas(consumer);
        // // todo: resolve image from registry
        // const account_dsp = dspAccount;
        // const dockerImage = await getDockerImage(jobImage, account_dsp.address,jobType);
        // const gasPrice = await getGasPrice();
        // const gasForCallback = await getGasForCallback(jobType);
        // let dapps = (await EthGAS2DAPPs(gasForCallback * gasPrice));
        
        // // run dispatcher
        const start = Date.now();
        let dispatchResult
        try{
            dispatchResult  = await dispatch(job.imageName, jobInfo.inputFS, jobInfo.args);
        }
        catch(e){
            // todo: handle failure. 
            const rcpterr = await theContract.methods.jobError(jobInfo.jobID, "error dispatching","").call({from:dspAccount.address});
            console.log(e);
            console.log(rcpterr);
        }

        console.log("dispatchResult");
        console.log(dispatchResult);
        const { outputFS } = dispatchResult;


        const millis = Date.now() - start;
        // // todo: kill docker if running too long and fail with not enough gas

        const rcpt = await theContract.methods.jobCallback({
            jobID:jobInfo.jobID, 
            outputFS:outputFS,
            outputHash:"hash"
        }).call({from:dspAccount.address});
        console.log(`posted results`,jobInfo.consumer,job.jobImage);
    });
    // theContract.events["JobDone"]({
    //     fromBlock: 0
    // }, async function (error, result) {
    //     console.log('JobDone hit');
    //     if (error) {
    //         console.log("event error",error);
    //         return;
    //     }

    //     const returnValues = result.returnValues;
    //     let fidx = 0;        
    //     const obj={
    //         consumer:returnValues[fidx++],
    //         outputFS:returnValues[fidx++],
    //         outputHash:returnValues[fidx++],
    //         inconsistent:returnValues[fidx++],
    //         jobID:returnValues[fidx++]
    //     }
    //     // if(pendingJobs[obj.jobID]){
    //     //     await pendingJobs[obj.jobID](obj);
    //     //     delete pendingJobs[obj.jobID];
    //     // }
    //     // console.log(`got final results`,obj);
    // });

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