import { dispatch } from './dispatch';
import { getAccount } from './getAccount';
import { compile } from './compile';
import { deploy } from './deploy';
import { web3,provider } from './web3global';
const Web3 = require('web3');

provider.on('error', e => console.log('WS Error', e));
function socketError(e){
    console.log('WS closed');
    console.log('Attempting to reconnect...');
    let provider = new Web3.providers.WebsocketProvider(process.env.ETH_ADDR);

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


let address = process.env.ADDRESS;
const fromBlock = 0; // load and save to file
let theContract;
let abi;
const run = async()=>{    
    let init = false;
    const contractFile = await compile();
    let bytecode = contractFile.evm.bytecode.object;
    abi = contractFile.abi;

    /// deploy contract if needed
    if(!address){
        if(process.env.COMPOSE_PROFILES != "debug"){
            throw new Error("can only deploy when COMPOSE_PROFILES=debug")
        }
        address =await deploy(bytecode,abi); 
        init = true;
    }
    const account_dsp = getAccount();

    
    theContract = new web3.eth.Contract(
        abi,
        address,
        {
        }
    );
    subscribe(theContract);
    if(init){
        
        await postTrx("setDockerImage",account_dsp,"wasmrunner","runner","hash");
        await postTrx("setDockerImage",account_dsp,"rust-compiler","rust-compiler","hash");
        
        // todo: check if already registered
        await postTrx("regDSP",account_dsp);
        await postTrx("approveDockerForDSP",account_dsp,"wasmrunner");
        await postTrx("approveDockerForDSP",account_dsp,"rust-compiler");


        await testConsumer(account_dsp.address);
    }
}

run() ;
async function testConsumer( address: any) {
    const account2 = getAccount("m/44'/60'/0'/0/1");        
    await postTrx("setQuorum", account2, account2.address, [address]);    
    // await postTrx("runJob", account2, account2.address, "rust-compiler", "QmUm1JD5os8p6zu6gQBPr7Rov2VD6QzMeRBH5j4ojFBzi6", []);
    await postTrx("runJob", account2, account2.address, "wasmrunner", "QmPDKw5a5THGW4PDKcddQ6r2Tq3uNwfyKmzX62ovC6dKqx", ["/target/wasm32-wasi/release/test"]);
}

async function getDockerImage(imageName, dspAddress){    
    const account2 = getAccount("m/44'/60'/0'/0/0");        
    const image = await callTrx("getDockerImage", account2, imageName);
    const isApproved = await callTrx("isImageApprovedForDSP", {address:dspAddress}, imageName);
    if(!isApproved)
        throw new Error("not approved");
    // todo: verify hash
    console.log("res",image,isApproved)
    return image;
    
}
function subscribe(theContract: any) {
    theContract.events["Job"]({
        fromBlock: fromBlock || 0
    }, async function (error, result) {
        if (error) {
            console.log(error);
            return;
        }
        // console.log("Job event", result);
        // run dispatcher
        const returnValues = result.returnValues;
        let fidx = 0;
        const consumer = returnValues[fidx++];
        const jobType = returnValues[fidx++];
        const inputFS = returnValues[fidx++];
        const args = returnValues[fidx++];
        const jobID = returnValues[fidx++];

        // todo: check if user has enough dapp gas

        // todo: check if already processed (in case not caught up with events)
        
        // todo: verify docker image approved
        // todo: resolve image from registry
        const account_dsp = getAccount();
        const dockerImage = await getDockerImage(jobType, account_dsp.address);

        const dispatchResult = await dispatch(dockerImage, inputFS, args);
        const { outputFS } = dispatchResult;
        // todo: kill docker if running too long and fail.
        // todo: handle fail.
        const dapps = 0;
        // todo: check if user has enough dapp gas
        
        // post results
        const rcpt = await postTrx("jobCallback", account_dsp, jobID,  outputFS, dapps);
        console.log(`posted results`,consumer,jobType);
    });
    theContract.events["JobDone"]({
        fromBlock: fromBlock || 0
    }, async function (error, result) {
        if (error) {
            console.log(error);
            return;
        }
        // run dispatcher
        const returnValues = result.returnValues;
        let fidx = 0;        
        const obj={
            consumer:returnValues[fidx++],
            // stdOut:returnValues[fidx++],
            outputFS:returnValues[fidx++],
            inconsistent:returnValues[fidx++],
            jobID:returnValues[fidx++],
        }
        console.log(`got final results`,obj);
    });
    
}

async function postTrx(method, account_from,...args) {
    const theContract2 = new web3.eth.Contract(
        abi,
        address,
        {
            from:account_from.address
        }
    );
    const nexusTx = theContract2.methods[method](...args);
    
    const createTransaction = await web3.eth.accounts.signTransaction({
        from: account_from.address,
        to:address,
        data: await nexusTx.encodeABI(),
        gas: await nexusTx.estimateGas(),
    }, account_from.privateKey);
    const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
    return createReceipt;
}


// move to client lib
const pendingJobs = {}
async function postTrxAndWait(method, account_from,...args) {
    const theContract2 = new web3.eth.Contract(
        abi,
        address,
        {
            from:account_from.address
        }
    );
    const nexusTx = theContract2.methods[method](...args);
    
    const createTransaction = await web3.eth.accounts.signTransaction({
        from: account_from.address,
        to:address,
        data: await nexusTx.encodeABI(),
        gas: await nexusTx.estimateGas(),
    }, account_from.privateKey);
    const createReceipt = await web3.eth.sendSignedTransaction(createTransaction.rawTransaction);
    
    // todo: get jobid and save in pendingJobs
    return new Promise(function(resolve){

        return createReceipt;
    });
    
}


async function callTrx(method, account_from,...args) {
    const theContract2 = new web3.eth.Contract(
        abi,
        address,
        {
            from:account_from.address
        }
    );
    const result = await theContract2.methods[method](...args).call({from:account_from.address,
        to:address});
    
    return result;
}