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

const fetchDspData = async (dsp) => {
    console.log(await contract.methods.dspData(dsp).call());
    // return await contract.methods.dspData(dsp).call();
}

const fetchConsumerData = async (consumer) => {
    console.log(await contract.methods.consumerData(consumer).call());
    // return await contract.methods.consumerData(consumer).call();
}

const fetchDockerImage = async (image) => {
    console.log(await contract.methods.dockerImages(image).call());
    // return await contract.methods.dockerImages(image).call();
}

const fetchServices = async (thisObject) => {
    for(let i=0; i < await fetchLastJob(); i++) {
        const job = await contract.methods.services(i).call();
        services.push(job);
    }
    thisObject.setState({services: JSON.stringify(services)});
}

const fetchJobImage = async (thisObject) => {
    const imageName = await contract.methods.getDockerImage(
        thisObject.state.getDockerImage.imageName
    ).call();
    thisObject.setState({image: imageName});
}

const fetchIsImageApprovedForDSP = async (thisObject) => {
    const approvedImage = await contract.methods.isImageApprovedForDSP(
        thisObject.state.isImageApprovedForDSP.imageName
    ).call();
    thisObject.setState({approvedImage});
}

const fetchPortForDSP = async (thisObject) => {
    const port = await contract.methods.getPortForDSP(
        thisObject.state.getPortForDSP.jobID,
        thisObject.state.getPortForDSP.dsp
    ).call();
    thisObject.setState({port});
}

const fetchEndpointForDSP = async (thisObject) => {
    const endpoint = await contract.methods.getDSPEndpoint(
        thisObject.state.getDSPEndpoint.dsp
    ).call();
    thisObject.setState({endpoint});
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
        thisObject.state.approveDocker.imageName
    ]);
    await runTrx(data,["DockerApprovalChanged"],thisObject);
}

const unapproveDockerImage = async (thisObject) => {
    const abi = returnAbi("unapproveDockerForDSP");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.unapproveDockerForDSP.imageName
    ]);
    await runTrx(data,["DockerApprovalChanged"],thisObject);
}

const deprecateDSP = async (thisObject) => {
    const abi = returnAbi("deprecateDSP");
    const data = web3.eth.abi.encodeFunctionCall(abi, []);
    await runTrx(data,["DSPStatusChanged"],thisObject);
}

const regDSP = async (thisObject) => {
    const abi = returnAbi("regDSP");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.regDSP.endpoint
    ]);
    await runTrx(data,["DSPStatusChanged"],thisObject);
}

const claimFor = async (thisObject) => {
    const abi = returnAbi("claimFor");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.claimFor._consumer,
        thisObject.state.claimFor._dsp
    ]);
    await runTrx(data,["ClaimedGas"],thisObject);
}

const sellGas = async (thisObject) => {
    const abi = returnAbi("sellGas");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.sellGas._amountToSell,
        thisObject.state.sellGas._dsp
    ]);
    await runTrx(data,["SoldGas"],thisObject);
}

const buyGasFor = async (thisObject) => {
    const abi = returnAbi("buyGasFor");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.buyGasFor._amount,
        thisObject.state.buyGasFor._consumer,
        thisObject.state.buyGasFor._dsp
    ]);
    await runTrx(data,["BoughtGas"],thisObject);
}

const setConsumerCallback = async (thisObject) => {
    const abi = returnAbi("setConsumerCallback");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.setConsumerCallback.enabled
    ]);
    await runTrx(data,[],thisObject);
}

const setConsumerPermissions = async (thisObject) => {
    const abi = returnAbi("setConsumerPermissions");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.setConsumerPermissions.owner
    ]);
    await runTrx(data,[],thisObject);
}

const setQuorum = async (thisObject) => {
    const abi = returnAbi("setQuorum");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.setQuorum.consumer,
        thisObject.state.setQuorum.dsps
    ]);
    await runTrx(data,[],thisObject);
}

const jobError = async (thisObject) => {
    const abi = returnAbi("jobError");
    const data = web3.eth.abi.encodeFunctionCall(abi, []);
    await runTrx(data,[],thisObject);
}

const serviceError = async (thisObject) => {
    const abi = returnAbi("serviceError");
    const data = web3.eth.abi.encodeFunctionCall(abi, []);
    await runTrx(data,[],thisObject);
}

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
    fetchJobImage,
    fetchIsImageApprovedForDSP,
    fetchPortForDSP,
    fetchEndpointForDSP,
    fetchDspInfo,
    fetchDspData,
    fetchConsumerData,
    fetchDockerImage,
    postJobOrService,
    runJob,
    runService,
    setDockerImage,
    approveDockerImage,
    unapproveDockerImage,
    deprecateDSP,
    regDSP,
    claimFor,
    sellGas,
    buyGasFor,
    setConsumerCallback,
    setConsumerPermissions,
    setQuorum,
    jobError,
    serviceError
}