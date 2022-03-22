import Web3 from 'web3';
import NexusJSON from '../../abi/Nexus.json';

// const provider = new Web3.providers.WebsocketProvider(process.env.REACT_APP_ETH_ADDR || 'ws://localhost:8545');
console.log(process.env.REACT_APP_ETH_ADDR || 'ws://localhost:8545');
// const web3 = new Web3(provider);

const web3 = new Web3(process.env.REACT_APP_ETH_ADDR || 'http://localhost:8545');
const contractAddress = process.env.REACT_APP_ADDRESS || '0x2751cAA3ECfbd0AAC09f60420f7A51F6233fcDB5';
const contract = new web3.eth.Contract(NexusJSON.abi,contractAddress);
const ethereum = window.ethereum;

const {approvedImages} = require('./approvedImages')

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

const uniq = (arr) =>  {
    let jsonObject = arr.map(JSON.stringify);
      
    console.log(jsonObject);

    let uniqueSet = new Set(jsonObject);
    return Array.from(uniqueSet).map(JSON.parse);
}

const fetchWorkerStats = async (thisObject,stateSpecifier) => {
    const workers = await contract.methods.totalDsps().call();
    const gasPaid = await contract.methods.totalDappGasPaid().call();
    thisObject.setState({
        [stateSpecifier]: {
            ...thisObject.state[stateSpecifier],
            workers,
            gasPaid
        }
    });
}

const fetchLastJob = async () => {
    const id = await contract.methods.lastJobID().call();
    console.log(id);
    return id;
}

const fetchJobs = async (thisObject, stateSpecifier) => {
    try {
        let jobs = [];
        const lastJob = await fetchLastJob();
        for(let i=lastJob; i > 0; i--) {
            const job = await contract.methods.jobs(i).call();
            if(job.owner != "0x0000000000000000000000000000000000000000") jobs.push({
                ...job,
                id:i
            });
        }
        thisObject.setState({
            [stateSpecifier]: {
                ...thisObject.state[stateSpecifier],
                jobs
            }
        });
    } catch(e) {
        console.log(e);
    }
}

const fetchServices = async (thisObject, stateSpecifier) => {
    try {
        let services = [];
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const lastJob = await fetchLastJob();
        for(let i=lastJob; i > 0; i--) {
            const service = await contract.methods.services(i).call();
            if(service.owner != "0x0000000000000000000000000000000000000000") {
                let 
                selectedDsps = [], 
                noError=true, 
                index = 0;
                while(noError && accounts[0]) {
                    try {
                        const dsp = await contract.methods.providers(accounts[0],index).call();
                        selectedDsps.push(dsp)
                        index++;
                    } catch(e) {
                        noError = false;
                    }
                }
                let endpoints = [];
                for(const el of selectedDsps) {
                    const port = await contract.methods.getPortForDSP(i,el).call();
                    const endpoint = await contract.methods.getDSPEndpoint(
                        el
                    ).call();
                    let response, ioUsed, storageUsed;
                    try {
                        response = await fetch(`${endpoint}:${process.env.ALT_API_PORT || 8050}/dapp-workers/io?id=${i}`);
                        ioUsed =  await response.json();
                        response = await fetch(`${endpoint}:${process.env.ALT_API_PORT || 8050}/dapp-workers/storage?id=${i}`);
                        storageUsed =  await response.json();
                    } catch(e) {
                        console.log("issue fetching io/storage usage from dsp",e);
                    }
                    endpoints.push({
                        dsp: el,
                        endpoint: `${endpoint}:${port}`,
                        ioUsed: ioUsed ? ioUsed.io_usage : '?',
                        storageUsed: storageUsed ? storageUsed.storage_usage : '?'
                    })
                }
                services.push({
                    ...service,
                    endpoints,
                    id:i
                });
                console.log(services)
            }
        }
        thisObject.setState({
            [stateSpecifier]: {
                ...thisObject.state[stateSpecifier],
                services
            }
        });
    } catch(e) {
        console.log(e);
    }
}

// const fetchJobImage = async (thisObject) => {
//     const imageName = await contract.methods.getDockerImage(
//         thisObject.state.getDockerImage.imageName
//     ).call();
//     console.log(imageName);
//     thisObject.setState({image: imageName});
// }

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

const fetchDsps = async () => {
    const dsps = [];
    const totalDsps = await contract.methods.totalDsps().call();
    for(let i = 0; i < totalDsps; i++) {
        const dsp = await contract.methods.dspList(i).call();
        dsps.push(dsp);
    }
    return dsps;
}

const fetchImages = async (thisObject,stateSelector) => {
    const dsps = await fetchDsps();
    let jobImages = [], serviceImages = [];
    for(const dsp of dsps){
        for(const image of approvedImages){
            if(image.type == "job") {
                const info = await contract.methods.dspApprovedImages(dsp,image.name).call();
                if(Number(info.jobFee) > 0) {
                    jobImages.push({
                        ...info,
                        image: image.name,
                        dsp
                    });
                }
            } else if(image.type == "service") {
                const info = await contract.methods.dspApprovedImages(dsp,image.name).call();
                if(Number(info.baseFee) > 0) {
                    serviceImages.push({
                        ...info,
                        image: image.name,
                        dsp
                    });
                }
            }
        }
    }
    thisObject.setState({
        [stateSelector]: {
            ...thisObject.state[stateSelector],
            jobImages,
            serviceImages
    }});
}

const fetchDspInfo = async (thisObject) => {
    const dspInfo = await contract.methods.registeredDSPs(
        thisObject.state.registeredDSPs.dsp
    ).call()
    console.log(dspInfo);
    thisObject.setState({dspInfo});
}

const fetchAllDsps = async(thisObject,stateSelector) => {
    const totalDsps = await contract.methods.totalDsps().call();
    let allDspInfo = [];
    let 
    selectedDsps = [], finalDsps = [], 
    noError=true, 
    serviceErrors=0, jobErrors=0, 
    i = 0;
    let jobsCompleted = 0, servicesCompleted = 0, dappGas;
    for(let i = 0; i < totalDsps; i++) {
        let obj = {
            dsp:'',
            images: []
        };
        const dsp = await contract.methods.dspList(i).call();
        obj.dsp = dsp;
        const endpoint = await contract.methods.getDSPEndpoint(
            dsp
        ).call();
        allDspInfo.push({
            ...obj,
            endpoint,
            jobsCompleted,
            servicesCompleted,
            jobErrors,
            serviceErrors
        });
    }
    thisObject.setState({
        [stateSelector]: {
            ...thisObject.state[stateSelector],
            allDspInfo
    }});
}

const fetchDspsByConsumer = async (thisObject,stateSelector) => {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    let 
    selectedDsps = [], finalDsps = [], 
    noError=true, 
    serviceErrors=0, jobErrors=0, 
    i = 0, port = '';
    while(noError && accounts[0]) {
        try {
            const dsp = await contract.methods.providers(accounts[0],i).call();
            selectedDsps.push(dsp)
            i++;
        } catch(e) {
            noError = false;
        }
    }
    for(const el of selectedDsps) {
        const endpoint = await contract.methods.getDSPEndpoint(
            el
        ).call();
        let jobsCompleted = 0, servicesCompleted = 0, dappGas;
        dappGas = await contract.methods.getDSPAmount(
            accounts[0],
            el
        ).call();
        const lastJob = await fetchLastJob();
        for(let i=lastJob; i > 0; i--) {
            const service = await contract.methods.services(i).call();
            if(
                service.owner != "0x0000000000000000000000000000000000000000" && 
                service.owner.toLowerCase() == accounts[0].toLowerCase()
            ) {
                const completed = await contract.methods.jobServiceCompleted(i,el,false).call();
                if(completed) servicesCompleted++;
                if(completed && service.started) serviceErrors++;
            }
            const job = await contract.methods.jobs(i).call();
            if(
                job.owner != "0x0000000000000000000000000000000000000000" && 
                job.owner.toLowerCase() == accounts[0].toLowerCase()
            ) {
                const completed = await contract.methods.jobServiceCompleted(i,el,true).call();
                if(completed) jobsCompleted++;
                jobErrors = selectedDsps.length - job.resultsCount
            }
        }
        finalDsps.push({
            dsp: el,
            endpoint,
            jobsCompleted,
            servicesCompleted,
            dappGas,
            jobErrors,
            serviceErrors,
            port
        });
    }
    thisObject.setState({
        [stateSelector]: {
            ...thisObject.state[stateSelector],
            dsps: finalDsps
    },});
}

const fetchDspData = async (thisObject) => {
    const dspData = await contract.methods.dspData(
        thisObject.state.dspDataForm.account,
        thisObject.state.dspDataForm.dsp
    ).call();
    console.log(dspData);
    thisObject.setState({dspData});
}

// const fetchConsumerData = async (thisObject) => {
//     const consumerData = await contract.methods.consumerData(
//         thisObject.state.consumerDataForm.consumer
//     ).call();
//     console.log(consumerData);
//     thisObject.setState({consumerData});
// }

const fetchJobServiceCompleted = async (thisObject) => {
    const jobServiceCompleted = await contract.methods.jobServiceCompleted(
        thisObject.state.jobServiceCompleted.id,
        thisObject.state.jobServiceCompleted.dsp,
        thisObject.state.jobServiceCompleted.isJob
    ).call();
    console.log(jobServiceCompleted);
    thisObject.setState({jobServiceCompleted});
}

const fetchGetMinBalance = async (thisObject) => {
    const getMinBalance = await contract.methods.getMinBalance(
        thisObject.state.getMinBalance.id,
        thisObject.state.getMinBalance.jobType,
        thisObject.state.getMinBalance.dsp
    ).call();
    console.log(getMinBalance);
    thisObject.setState({getMinBalance});
}

const fetchIsServiceDone = async (thisObject) => {
    const isServiceDone = await contract.methods.isServiceDone(
        thisObject.state.isServiceDone.id
    ).call();
    console.log(isServiceDone);
    thisObject.setState({isServiceDone});
}

const fetchGetMaxPaymentForGas = async (thisObject) => {
    const getMaxPaymentForGas = await contract.methods.getMaxPaymentForGas(
        thisObject.state.getMaxPaymentForGas.gasLimit,
        thisObject.state.getMaxPaymentForGas.imageName,
        thisObject.state.getMaxPaymentForGas.dsp,
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
        thisObject.state.getDSPDataLimits.id,
        thisObject.state.getDSPDataLimits.dsp,
    ).call();
    console.log(getDSPDataLimits);
    thisObject.setState({getDSPDataLimits});
}

// END GETTER

// START SETTER

const approveImage = async (thisObject) => {
    const abi = returnAbi("approveImage");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.approveImage.imageName,
        thisObject.state.approveImage.imageHash
    ]);
    await runTrx(data,[],thisObject);
}

const unapproveImage = async (thisObject) => {
    const abi = returnAbi("unapproveImage");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.unapproveImage.imageName,
        thisObject.state.unapproveImage.imageHash

    ]);
    await runTrx(data,[],thisObject);
}

const extendService = async (thisObject) => {
    const abi = returnAbi("extendService");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.extendService.serviceId,
        thisObject.state.extendService.imageName,
        thisObject.state.extendService.months,
        thisObject.state.extendService.ioMb,
        thisObject.state.extendService.storageMb

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
        thisObject.state.setDsps.dsps

    ]);
    await runTrx(data,["UpdateDsps"],thisObject);
}

const setConsumerContract = async (thisObject) => {
    const abi = returnAbi("setConsumerContract");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.setConsumerContract.authorized_contract

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
        thisObject.state.unapproveImage.imageName
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
    fetchAllDsps,
    fetchJobs,
    fetchServices,
    // fetchJobImage,
    fetchIsImageApprovedForDSP,
    fetchPortForDSP,
    fetchEndpointForDSP,
    fetchDspInfo,
    fetchDspData,
    // fetchConsumerData,
    setDockerImage,
    unapproveDockerImage,
    deprecateDSP,
    regDSP,
    claim,
    sellGas,
    buyGasFor,
    setQuorum,
    fetchDspsByConsumer,
    fetchJobServiceCompleted,
    fetchGetMinBalance,
    fetchIsServiceDone,
    fetchGetMaxPaymentForGas,
    fetchGetConfig,
    fetchGetDspAddresses,
    fetchGetDSPDataLimits,
    approveImage,
    unapproveImage,
    extendService,
    setConfig,
    setDsps,
    setConsumerContract,
    queueJob,
    queueService,
    updateDockerImage,
    fetchLastJob,
    fetchImages,
    fetchWorkerStats
}