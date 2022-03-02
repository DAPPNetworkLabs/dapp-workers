import Web3 from 'web3';
import NexusJSON from '../../abi/Nexus.json';

const jobs = [];
const services = [];
const provider = new Web3.providers.WebsocketProvider(process.env.ETH_ADDR || 'ws://localhost:8545');
const web3 = new Web3(provider);
// const web3 = new Web3(process.env.ETH_ADDR || 'http://localhost:8545');
const contractAddress = process.env.ADDRESS || '0x0b182A261cFad7983f12f6F15022774Cb020aFD6';
const contract = new web3.eth.Contract(NexusJSON.abi,contractAddress);
const ethereum = window.ethereum;

// START GETTER

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
    const id = await contract.methods.lastJobID().call();
    console.log(id);
    return id;
}

const fetchJobs = async (thisObject) => {
    for(let i=0; i < await fetchLastJob(); i++) {
        const job = await contract.methods.jobs(i).call();
        jobs.push(job);
    }
    console.log(JSON.stringify(jobs));
    thisObject.setState({jobs: JSON.stringify(jobs)});
}

const fetchServices = async (thisObject) => {
    for(let i=0; i < await fetchLastJob(); i++) {
        const job = await contract.methods.services(i).call();
        services.push(job);
    }
    console.log(JSON.stringify(services));
    thisObject.setState({services: JSON.stringify(services)});
}

const fetchJobImage = async (thisObject) => {
    const imageName = await contract.methods.getDockerImage(
        thisObject.state.getDockerImage.imageName
    ).call();
    console.log(imageName);
    thisObject.setState({image: imageName});
}

const fetchIsImageApprovedForDSP = async (thisObject) => {
    const approvedImage = await contract.methods.isImageApprovedForDSP(
        thisObject.state.isImageApprovedForDSP.dsp,
        thisObject.state.isImageApprovedForDSP.imageName
    ).call();
    console.log(approvedImage);
    thisObject.setState({approvedImage});
}

const fetchPortForDSP = async (thisObject) => {
    const port = await contract.methods.getPortForDSP(
        thisObject.state.getPortForDSP.jobID,
        thisObject.state.getPortForDSP.dsp
    ).call();
    console.log(port);
    thisObject.setState({port});
}

const fetchEndpointForDSP = async (thisObject) => {
    const endpoint = await contract.methods.getDSPEndpoint(
        thisObject.state.getDSPEndpoint.dsp
    ).call();
    console.log(endpoint);
    thisObject.setState({endpoint});
}

const fetchDspInfo = async (thisObject) => {
    const dspInfo = await contract.methods.registeredDSPs(
        thisObject.state.registeredDSPs.dsp
    ).call()
    console.log(dspInfo);
    thisObject.setState({dspInfo});
}

const fetchDspData = async (thisObject) => {
    const dspData = await contract.methods.dspData(
        thisObject.state.dspDataForm.account,
        thisObject.state.dspDataForm.dsp
    ).call();
    console.log(dspData);
    thisObject.setState({dspData});
}

const fetchConsumerData = async (thisObject) => {
    const consumerData = await contract.methods.consumerData(
        thisObject.state.consumerDataForm.consumer
    ).call();
    console.log(consumerData);
    thisObject.setState({consumerData});
}

const fetchJobServiceCompleted = async (thisObject) => {
    const jobServiceCompleted = await contract.methods.jobServiceCompleted(
        thisObject.state.jobServiceCompletedParams.id,
        thisObject.state.jobServiceCompletedParams.dsp,
        thisObject.state.jobServiceCompletedParams.isJob
    ).call();
    console.log(jobServiceCompleted);
    thisObject.setState({jobServiceCompleted});
}

const fetchGetMinBalance = async (thisObject) => {
    const getMinBalance = await contract.methods.getMinBalance(
        thisObject.state.getMinBalanceParams.id,
        thisObject.state.getMinBalanceParams.jobType,
        thisObject.state.getMinBalanceParams.dsp
    ).call();
    console.log(getMinBalance);
    thisObject.setState({getMinBalance});
}

const fetchIsServiceDone = async (thisObject) => {
    const isServiceDone = await contract.methods.isServiceDone(
        thisObject.state.isServiceDoneParams.id
    ).call();
    console.log(isServiceDone);
    thisObject.setState({isServiceDone});
}

const fetchGetMaxPaymentForGas = async (thisObject) => {
    const getMaxPaymentForGas = await contract.methods.getMaxPaymentForGas(
        thisObject.state.getMaxPaymentForGasParams.gasLimit,
        thisObject.state.getMaxPaymentForGasParams.imageName,
        thisObject.state.getMaxPaymentForGasParams.dsp,
    ).call();
    console.log(getMaxPaymentForGas);
    thisObject.setState({getMaxPaymentForGas});
}

const fetchGetConfig = async (thisObject) => {
    const getConfig = await contract.methods.getConfig().call();
    console.log(getConfig);
    thisObject.setState({getConfig});
}

const fetchGetDspAddresses = async (thisObject) => {
    const getDspAddresses = await contract.methods.getDspAddresses().call();
    console.log(getDspAddresses);
    thisObject.setState({getDspAddresses});
}

const fetchGetDSPDataLimits = async (thisObject) => {
    const getDSPDataLimits = await contract.methods.getDSPDataLimits(
        thisObject.state.getDSPDataLimitsParams.id,
        thisObject.state.getDSPDataLimitsParams.dsp,
    ).call();
    console.log(getDSPDataLimits);
    thisObject.setState({getDSPDataLimits});
}

// END GETTER

// START SETTER

const approveImage = async (thisObject) => {
    const abi = returnAbi("approveImage");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.approveImageParams.imageName,
        thisObject.state.approveImageParams.imageHash

    ]);
    await runTrx(data,[],thisObject);
}

const extendService = async (thisObject) => {
    const abi = returnAbi("extendService");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.extendServiceParams.serviceId,
        thisObject.state.extendServiceParams.imageName,
        thisObject.state.extendServiceParams.months,
        thisObject.state.extendServiceParams.ioMb,
        thisObject.state.extendServiceParams.storageMb

    ]);
    await runTrx(data,["ServiceExtended"],thisObject);
}

const setConfig = async (thisObject) => {
    const abi = returnAbi("setConfig");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.setConfig.paymentPremiumPPB,
        thisObject.state.setConfig.gasCeilingMultiplier,
        thisObject.state.setConfig.fallbackGasPrice,
        thisObject.state.setConfig.stalenessSeconds

    ]);
    await runTrx(data,["ConfigSet"],thisObject);
}

const setDsps = async (thisObject) => {
    const abi = returnAbi("setDsps");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.setDspsParams.dsps

    ]);
    await runTrx(data,["UpdateDsps"],thisObject);
}

const setConsumerContract = async (thisObject) => {
    const abi = returnAbi("setConsumerContract");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.setConsumerContractParams.authorized_contract

    ]);
    await runTrx(data,[],thisObject);
}

const queueJob = async (thisObject) => {
    const abi = returnAbi("queueJob");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        {
            owner: thisObject.state.queueJob.owner,
            imageName: thisObject.state.queueJob.imageName,
            inputFS: thisObject.state.queueJob.inputFS,
            callback: thisObject.state.queueJob.callback,
            gasLimit: thisObject.state.queueJob.gasLimit,
            requireConsistent: thisObject.state.queueJob.requireConsistent,
            args: thisObject.state.queueJob.args
        }
    ]);
    await runTrx(data,["QueueJob"],thisObject);
}

const queueService = async (thisObject) => {
    const abi = returnAbi("queueService");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        {
            owner: thisObject.state.queueService.owner,
            imageName: thisObject.state.queueService.imageName,
            ioMegaBytes: thisObject.state.queueService.ioMegaBytes,
            storageMegaBytes: thisObject.state.queueService.storageMegaBytes,
            inputFS: thisObject.state.queueService.inputFS,
            args: thisObject.state.queueService.args,
            months: thisObject.state.queueService.months
        }
    ]);
    await runTrx(data,["QueueService"],thisObject);
}

const setDockerImage = async (thisObject) => {
    const abi = returnAbi("setDockerImage");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.setDockerImage.imageName,
        thisObject.state.setDockerImage.jobFee,
        thisObject.state.setDockerImage.baseFee,
        thisObject.state.setDockerImage.storageFee,
        thisObject.state.setDockerImage.ioFee,
        thisObject.state.setDockerImage.minStorageMegaBytes,
        thisObject.state.setDockerImage.minIoMegaBytes,
    ]);
    await runTrx(data,["DockerSet"],thisObject);
}

const updateDockerImage = async (thisObject) => {
    const abi = returnAbi("updateDockerImage");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.updateDockerImage.imageName,
        thisObject.state.updateDockerImage.jobFee,
        thisObject.state.updateDockerImage.baseFee,
        thisObject.state.updateDockerImage.storageFee,
        thisObject.state.updateDockerImage.ioFee,
        thisObject.state.updateDockerImage.minStorageMegaBytes,
        thisObject.state.updateDockerImage.minIoMegaBytes,
    ]);
    await runTrx(data,["updateDockerImage"],thisObject);
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

const claim = async (thisObject) => {
    const abi = returnAbi("claim");
    const data = web3.eth.abi.encodeFunctionCall(abi, []);
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
        // for(const name of events) {
        //     subscribeContractEvent(name,thisObject);
        // }
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
    setDockerImage,
    unapproveDockerImage,
    deprecateDSP,
    regDSP,
    claim,
    sellGas,
    buyGasFor,
    setConsumerPermissions,
    setQuorum,
    fetchJobServiceCompleted,
    fetchGetMinBalance,
    fetchIsServiceDone,
    fetchGetMaxPaymentForGas,
    fetchGetConfig,
    fetchGetDspAddresses,
    fetchGetDSPDataLimits,
    approveImage,
    extendService,
    setConfig,
    setDsps,
    setConsumerContract,
    queueJob,
    queueService,
    updateDockerImage,
    fetchLastJob
}