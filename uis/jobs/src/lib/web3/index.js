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

const subscribeContractEvent = (eventName,thisObject) => {
    contract.once(eventName, function(error, event){
        console.log({ eventName, event, error });
        thisObject.setState({events: [...thisObject.state.events, { eventName, event, error }]});
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
    thisObject.setState({services: JSON.stringify(services)});
}

const postJobOrService = async (thisObject) => {
    const abi = returnAbi("run");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.run.consumer,
        thisObject.state.run.imageName,
        thisObject.state.run.inputFS,
        thisObject.state.run.args
    ]);
    await runTrx(data,["Run"],thisObject);
}

const runJob = async (thisObject) => {
    const abi = returnAbi("jobCallback");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.runJob.jobId,
        thisObject.state.runJob.outputFS,
        thisObject.state.runJob.dapps
    ]);
    await runTrx(data,["JobResult","JobDone"],thisObject);
}

const runService = async (thisObject) => {
    const abi = returnAbi("serviceCallback");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.runService.jobId,
        thisObject.state.runService.port,
        thisObject.state.runService.serviceDapps
    ]);
    await runTrx(data,["ServiceRunning"],thisObject);
}

const setDockerImage = async (thisObject) => {
    const abi = returnAbi("setDockerImage");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.setDockerImage.imageName,
        thisObject.state.setDockerImage.imageAddress,
        thisObject.state.setDockerImage.imageHash,
        thisObject.state.setDockerImage.imageType
    ]);
    await runTrx(data,["DockerSet"],thisObject);
}

const approveDockerImage = async (thisObject) => {
    const abi = returnAbi("approveDockerForDSP");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.imageName
    ]);
    await runTrx(data,["DockerApprovalChanged"],thisObject);
}

    /*

        getDSPEndpoint
        getPortForDSP
        unapproveDockerForDSP
        isImageApprovedForDSP
        getDockerImage
        deprecateDSP
        regDSP
        claimFor
        sellGas
        buyGasFor
        setConsumerCallback
        setConsumerPermissions
        setQuorum
        jobError
        serviceError

    */

const runTrx = async (data,events,thisObject) => {
    const trxInfo = {
        trxHash: null,
        error: ''
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
    if(events.length) {
        for(const name of events) {
            subscribeContractEvent(name,thisObject);
        }
    }
    await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
    })
    .then((result) => {
        trxInfo.trxHash = result;
    })
    .catch((error) => {
        trxInfo.error = error;
    });
    thisObject.setState({trxInfo});
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