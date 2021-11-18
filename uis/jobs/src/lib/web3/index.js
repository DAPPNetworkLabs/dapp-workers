import Web3 from 'web3';
import NexusJSON from '../../abi/Nexus.json';

const jobs = [];
const services = [];
const provider = new Web3.providers.WebsocketProvider('ws://localhost:8545');
const web3 = new Web3(provider);
const contractAddress = "0x94D387F50569200aDACFd903345D077ef6ABcE11";
const contract = new web3.eth.Contract(NexusJSON.abi,contractAddress);
const ethereum = window.ethereum;

const returnAbi = (func) => {
    return NexusJSON.abi.find(el => el.name == func && el.type == "function");
}

const fetchContractEvent = async (event) => {
    await contract.events[event]({}, function(error, event){
        if(error) alert(error);
        if(event) return event;
    });
}

const fetchLastJob = async () => {
    return await contract.methods.lastJobID().call();
}

const fetchJobs = async (thisObject) => {
    for(let i=0; i < await fetchLastJob(); i++) {
        const job = await contract.methods.jobs(i).call();
        jobs.push(job);
    }
    thisObject.setState({jobs: JSON.stringify(jobs)});
}

const fetchDspInfo = async (dsp) => {
    console.log(await contract.methods.registeredDSPs(dsp).call());
    // return await contract.methods.registeredDSPs(dsp).call();
}

const fetchServices = async (thisObject) => {
    for(let i=0; i < await fetchLastJob(); i++) {
        const job = await contract.methods.services(i).call();
        services.push(job);
    }
    console.log(`services: ${services}`);
    thisObject.setState({services: JSON.stringify(services)});
}

const postJobOrService = async (form) => {
    const abi = returnAbi("run");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        form.consumer,
        form.imageName,
        form.inputFS,
        form.args
    ]);

    const trxData = await runTrx(data,["Run"]);
}

const runJob = async (form) => {
    const abi = returnAbi("jobCallback");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        form.jobId,
        form.outputFS,
        form.dapps
    ]);

    const trxData = await runTrx(data,["JobResult","JobDone"]);
}

const runService = async (form) => {
    const abi = returnAbi("serviceCallback");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        form.jobId,
        form.port,
        form.serviceDapps
    ]);

    const trxData = await runTrx(data,["ServiceRunning"]);
}

const setDockerImage = async (form) => {
    const abi = returnAbi("setDockerImage");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        form.imageName,
        form.imageAddress,
        form.imageHash,
        form.imageType
    ]);

    const trxData = await runTrx(data,["DockerSet"]);
}

const approveDockerImage = async (form) => {
    const abi = returnAbi("approveDockerForDSP");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        form.imageName
    ]);

    const trxData = await runTrx(data,["DockerApprovalChanged"]);
}

const runTrx = async (data,events) => {
    const trxInfo = {
        trxHash: null,
        events: []
    };
    const transactionParameters = {
        nonce: '0x00',
        gasPrice: '2000000000',
        gasLimit: '21000',
        to: contractAddress,
        from: ethereum.selectedAddress,
        value: '0x00',
        data,
        chainId: '0x3', // Used to prevent transaction reuse across blockchains. Auto-filled by MetaMask.
    };
    trxInfo.trxHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
    });
    if(events.length) {
        for(const event of events) {
            trxInfo.events.push({event, response: await fetchContractEvent(event)});
        }
    }
    return trxInfo;
}

export default { 
    fetchJobs,
    fetchServices,
    fetchDspInfo,
    postJobOrService,
    runJob,
    runService,
    setDockerImage,
    approveDockerImage
}