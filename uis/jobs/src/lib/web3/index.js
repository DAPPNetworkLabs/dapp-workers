import Web3 from 'web3';
import NexusJSON from '../../abi/Nexus.json';

const jobs = [];
const services = [];
// const provider = new Web3.providers.WebsocketProvider('ws://localhost:8545');
// const web3 = new Web3(provider);
const web3 = new Web3('http://localhost:8545');
const contractAddress = "0x94D387F50569200aDACFd903345D077ef6ABcE11";
const contract = new web3.eth.Contract(NexusJSON.abi,contractAddress);
const ethereum = window.ethereum;

const returnAbi = (func) => {
    return NexusJSON.abi.find(el => el.name == func && el.type == "function");
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

    const txHash = await runTrx(data);
    // await contract.events.Run({}, function(error, event){
    //     console.log(error);
    //     console.log(event);
    // });
}

const runJob = async (form) => {
    const abi = returnAbi("jobCallback");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        form.jobId,
        form.outputFS,
        form.dapps
    ]);

    const txHash = await runTrx(data);
    // await contract.events.JobResult({}, function(error, event){
    //     console.log(error);
    //     console.log(event);
    // });
    // await contract.events.JobDone({}, function(error, event){
    //     console.log(error);
    //     console.log(event);
    // });
}

const runService = async (form) => {
    const abi = returnAbi("serviceCallback");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        form.jobId,
        form.port,
        form.serviceDapps
    ]);

    const txHash = await runTrx(data);
    // await contract.events.ServiceRunning({}, function(error, event){
    //     console.log(error);
    //     console.log(event);
    // });
}

const setDockerImage = async (form) => {
    const abi = returnAbi("setDockerImage");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        form.imageName,
        form.imageAddress,
        form.imageHash,
        form.imageType
    ]);

    const txHash = await runTrx(data);
    // await contract.events.DockerSet({}, function(error, event){
    //     console.log(error);
    //     console.log(event);
    // });
}

const approveDockerImage = async (form) => {
    const abi = returnAbi("approveDockerForDSP");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        form.imageName
    ]);

    const txHash = await runTrx(data);
    // await contract.events.DockerSet({}, function(error, event){
    //     console.log(error);
    //     console.log(event);
    // });
}

const runTrx = async (data) => {
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
    return await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
    });
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