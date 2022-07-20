import Web3 from 'web3';
import NexusJSON from '../../abi/Nexus.json';

// const provider = new Web3.providers.WebsocketProvider(process.env.REACT_APP_ETH_ADDR || 'ws://dapp-workers.liquidapps.io');
// const web3 = new Web3(provider);
const web3 = new Web3(process.env.REACT_APP_ETH_ADDR || 'http://dapp-workers.liquidapps.io');
const contractAddress = process.env.REACT_APP_ADDRESS || '0x2751cAA3ECfbd0AAC09f60420f7A51F6233fcDB5';
const contract = new web3.eth.Contract(NexusJSON.abi,contractAddress);
const ethereum = window.ethereum;

const {approvedImages} = require('./approvedImages')

// START GETTER

const returnAbi = (func) => {
    return NexusJSON.abi.find(el => el.name == func && el.type == "function");
}

const uniq = (arr) =>  {
    let jsonObject = arr.map(JSON.stringify);
      
    console.log(jsonObject);

    let uniqueSet = new Set(jsonObject);
    return Array.from(uniqueSet).map(JSON.parse);
}

const fetchJobDapps = async (thisObject,stateSpecifier) => {
    let sufficientGas = true, totalDapps = 0;
    const workers = await fetchWorkers();
    for(const worker of workers) {
        const dapps = await contract.methods.getMaxPaymentForGas(
            thisObject.state[stateSpecifier].gasLimit.toString(),
            thisObject.state[stateSpecifier].imageName,
            worker
        ).call();
        if(thisObject.state[stateSpecifier].owner) {
            const dappGas = await contract.methods.getWORKERAmount(
                thisObject.state[stateSpecifier].owner,
                worker
            ).call();
            if(Number(dapps) > Number(dappGas)) sufficientGas = false;
            totalDapps += Number(dapps);
        }
    }
    thisObject.setState({
        [stateSpecifier]: {
            ...thisObject.state[stateSpecifier],
            sufficientGas,
            totalDapps
        }
    });
}

const fetchServiceDapps = async (thisObject,stateSpecifier) => {
    let sufficientGas = true, totalDapps = 0;
    const workers = await fetchWorkers();
    for(const worker of workers) {
        const dapps = await contract.methods.calcServiceDapps(
            thisObject.state[stateSpecifier].imageName,
            worker,
            true
        ).call();
        if(thisObject.state[stateSpecifier].owner) {
            const dappGas = await contract.methods.getWORKERAmount(
                thisObject.state[stateSpecifier].owner,
                worker
            ).call();
            if(Number(dapps) > Number(dappGas)) sufficientGas = false;
            totalDapps += Number(dapps);
        }
    }
    thisObject.setState({
        [stateSpecifier]: {
            ...thisObject.state[stateSpecifier],
            sufficientGas,
            totalDapps
        }
    });
}

const fetchWorkerStats = async (thisObject,stateSpecifier) => {
    const workers = await contract.methods.totalWorkers().call();
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
                selectedWorkers = [], 
                noError=true, 
                index = 0;
                while(noError && accounts[0]) {
                    try {
                        const worker = await contract.methods.providers(accounts[0],index).call();
                        selectedWorkers.push(worker)
                        index++;
                    } catch(e) {
                        noError = false;
                    }
                }
                let endpoints = [];
                for(const el of selectedWorkers) {
                    const endpoint = await contract.methods.getWORKEREndpoint(
                        el
                    ).call();
                    endpoints.push({
                        worker: el,
                        endpoint
                    });
                }
                services.push({
                    ...service,
                    endpoints,
                    id:i
                });
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

const fetchIsImageApprovedForWORKER = async (thisObject) => {
    const approvedImage = await contract.methods.isImageApprovedForWORKER(
        thisObject.state.isImageApprovedForWORKER.worker,
        thisObject.state.isImageApprovedForWORKER.imageName
    ).call();
    console.log(approvedImage);
    thisObject.setState({approvedImage});
}

const fetchEndpointForWORKER = async (thisObject) => {
    const endpoint = await contract.methods.getWORKEREndpoint(
        thisObject.state.getWORKEREndpoint.worker
    ).call();
    console.log(endpoint);
    thisObject.setState({endpoint});
}

const fetchWorkers = async () => {
    const workers = [];
    const totalWorkers = await contract.methods.totalWorkers().call();
    for(let i = 0; i < totalWorkers; i++) {
        const worker = await contract.methods.workerList(i).call();
        workers.push(worker);
    }
    return workers;
}

const fetchImages = async (thisObject,stateSelector) => {
    const workers = await fetchWorkers();
    let jobImages = [], serviceImages = [];
    for(const worker of workers){
        for(const image of approvedImages){
            if(image.type == "job") {
                const info = await contract.methods.workerApprovedImages(worker,image.name).call();
                if(Number(info.jobFee) > 0) {
                    jobImages.push({
                        ...info,
                        image: image.name,
                        worker
                    });
                }
            } else if(image.type == "service") {
                const info = await contract.methods.workerApprovedImages(worker,image.name).call();
                if(Number(info.baseFee) > 0) {
                    serviceImages.push({
                        ...info,
                        image: image.name,
                        worker
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

const fetchWorkerInfo = async (thisObject) => {
    const workerInfo = await contract.methods.registeredWORKERs(
        thisObject.state.registeredWORKERs.worker
    ).call()
    console.log(workerInfo);
    thisObject.setState({workerInfo});
}

const fetchAllWorkers = async(thisObject,stateSelector) => {
    const totalWorkers = await contract.methods.totalWorkers().call();
    let allWorkerInfo = [];
    let 
    selectedWorkers = [], finalWorkers = [], 
    noError=true, 
    serviceErrors=0, jobErrors=0, 
    i = 0;
    let jobsCompleted = 0, servicesCompleted = 0, dappGas;
    for(let i = 0; i < totalWorkers; i++) {
        let obj = {
            worker:'',
            images: []
        };
        const worker = await contract.methods.workerList(i).call();
        obj.worker = worker;
        const endpoint = await contract.methods.getWORKEREndpoint(
            worker
        ).call();
        allWorkerInfo.push({
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
            allWorkerInfo
    }});
}

const fetchWorkersByConsumer = async (thisObject,stateSelector) => {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    let 
    selectedWorkers = [], finalWorkers = [], 
    noError=true, 
    serviceErrors=0, jobErrors=0, 
    i = 0, port = '';
    while(noError && accounts[0]) {
        try {
            const worker = await contract.methods.providers(accounts[0],i).call();
            selectedWorkers.push(worker)
            i++;
        } catch(e) {
            noError = false;
        }
    }
    for(const el of selectedWorkers) {
        const endpoint = await contract.methods.getWORKEREndpoint(
            el
        ).call();
        let jobsCompleted = 0, servicesCompleted = 0, dappGas;
        dappGas = await contract.methods.getWORKERAmount(
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
                jobErrors = selectedWorkers.length - job.resultsCount
            }
        }
        finalWorkers.push({
            worker: el,
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
            workers: finalWorkers
    },});
}

const fetchWorkerData = async (thisObject) => {
    const workerData = await contract.methods.workerData(
        thisObject.state.workerDataForm.account,
        thisObject.state.workerDataForm.worker
    ).call();
    console.log(workerData);
    thisObject.setState({workerData});
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
        thisObject.state.jobServiceCompleted.worker,
        thisObject.state.jobServiceCompleted.isJob
    ).call();
    console.log(jobServiceCompleted);
    thisObject.setState({jobServiceCompleted});
}

const fetchGetMinBalance = async (thisObject) => {
    const getMinBalance = await contract.methods.getMinBalance(
        thisObject.state.getMinBalance.id,
        thisObject.state.getMinBalance.jobType,
        thisObject.state.getMinBalance.worker
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
        thisObject.state.getMaxPaymentForGas.worker,
    ).call();
    console.log(getMaxPaymentForGas);
    thisObject.setState({getMaxPaymentForGas});
}

const fetchGetConfig = async (thisObject) => {
    const getConfig = await contract.methods.getConfig().call();
    console.log(getConfig);
    thisObject.setState({getConfig});
}

const fetchGetWorkerAddresses = async (thisObject) => {
    const getWorkerAddresses = await contract.methods.getWorkerAddresses().call();
    console.log(getWorkerAddresses);
    thisObject.setState({getWorkerAddresses});
}

const fetchGetWORKERDataLimits = async (thisObject) => {
    const getWORKERDataLimits = await contract.methods.getWORKERDataLimits(
        thisObject.state.getWORKERDataLimits.id,
        thisObject.state.getWORKERDataLimits.worker,
    ).call();
    console.log(getWORKERDataLimits);
    thisObject.setState({getWORKERDataLimits});
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
        thisObject.state.extendService.months

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

const setWorkers = async (thisObject) => {
    const abi = returnAbi("setWorkers");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.setWorkers.workers

    ]);
    await runTrx(data,["UpdateWorkers"],thisObject);
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
        thisObject.state.setDockerImage.baseFee
    ]);
    await runTrx(data,["DockerSet"],thisObject);
}

const updateDockerImage = async (thisObject) => {
    const abi = returnAbi("updateDockerImage");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.updateDockerImage.imageName,
        thisObject.state.updateDockerImage.jobFee,
        thisObject.state.updateDockerImage.baseFee
    ]);
    await runTrx(data,["updateDockerImage"],thisObject);
}

const unapproveDockerImage = async (thisObject) => {
    const abi = returnAbi("unapproveDockerForWORKER");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.unapproveImage.imageName
    ]);
    await runTrx(data,["DockerApprovalChanged"],thisObject);
}

const deprecateWORKER = async (thisObject) => {
    const abi = returnAbi("deprecateWORKER");
    const data = web3.eth.abi.encodeFunctionCall(abi, []);
    await runTrx(data,["WORKERStatusChanged"],thisObject);
}

const regWORKER = async (thisObject) => {
    const abi = returnAbi("regWORKER");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.regWORKER.endpoint
    ]);
    await runTrx(data,["WORKERStatusChanged"],thisObject);
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
        thisObject.state.sellGas._worker
    ]);
    await runTrx(data,["SoldGas"],thisObject);
}

const buyGasFor = async (thisObject) => {
    const abi = returnAbi("buyGasFor");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.buyGasFor._amount,
        thisObject.state.buyGasFor._consumer,
        thisObject.state.buyGasFor._worker
    ]);
    await runTrx(data,["BoughtGas"],thisObject);
}

const setQuorum = async (thisObject) => {
    const abi = returnAbi("setQuorum");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.setQuorum.consumer,
        thisObject.state.setQuorum.workers
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
    fetchAllWorkers,
    fetchJobs,
    fetchServices,
    // fetchJobImage,
    fetchIsImageApprovedForWORKER,
    fetchEndpointForWORKER,
    fetchWorkerInfo,
    fetchWorkerData,
    // fetchConsumerData,
    setDockerImage,
    unapproveDockerImage,
    deprecateWORKER,
    regWORKER,
    claim,
    sellGas,
    buyGasFor,
    setQuorum,
    fetchWorkersByConsumer,
    fetchJobServiceCompleted,
    fetchGetMinBalance,
    fetchIsServiceDone,
    fetchGetMaxPaymentForGas,
    fetchGetConfig,
    fetchGetWorkerAddresses,
    fetchGetWORKERDataLimits,
    approveImage,
    unapproveImage,
    extendService,
    setConfig,
    setWorkers,
    setConsumerContract,
    queueJob,
    queueService,
    updateDockerImage,
    fetchLastJob,
    fetchImages,
    fetchWorkerStats,
    fetchJobDapps,
    fetchServiceDapps
}