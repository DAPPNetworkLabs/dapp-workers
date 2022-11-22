import Web3 from 'web3';
import NexusJSON from '../../abi/Nexus.json';

// const provider = new Web3.providers.WebsocketProvider(process.env.REACT_APP_ETH_ADDR || 'ws://dapp-workers.liquidapps.io');
// const web3 = new Web3(provider);
const secret_api_key = "";
const web3 = new Web3(process.env.REACT_APP_ETH_ADDR || `https://polygon-mumbai.g.alchemy.com/v2/${secret_api_key}`); // use infura for ropsten
const contractAddress = process.env.REACT_APP_ADDRESS || '0x7e6121E9D5349544509A122f9BC81c04A2B10a27';
const contract = new web3.eth.Contract(NexusJSON.abi,contractAddress);
const ethereum = window.ethereum;

const {approvedImages} = require('./approvedImages')

// START GETTER

const returnAbi = (func) => {
    return NexusJSON.abi.find(el => el.name == func && el.type == "function");
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
            const dappGas = await contract.methods.getWorkerAmount(
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
            worker
        ).call();
        if(thisObject.state[stateSpecifier].owner) {
            const dappGas = await contract.methods.getWorkerAmount(
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
    thisObject.setState({
        [stateSpecifier]: {
            ...thisObject.state[stateSpecifier],
            workers
        }
    });
}

const fetchLastJob = async () => {
    const id = await contract.methods.lastJobID().call();
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
                    const endpoint = await contract.methods.getWorkerEndpoint(
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

const fetchIsImageApprovedForWorker = async (thisObject) => {
    const approvedImage = await contract.methods.isImageApprovedForWorker(
        thisObject.state.isImageApprovedForWorker.worker,
        thisObject.state.isImageApprovedForWorker.imageName
    ).call();
    thisObject.setState({approvedImage});
}

const fetchEndpointForWorker = async (thisObject) => {
    const endpoint = await contract.methods.getWorkerEndpoint(
        thisObject.state.getWorkerEndpoint.worker
    ).call();
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
    const workerInfo = await contract.methods.registeredWorkers(
        thisObject.state.registeredWorkers.worker
    ).call()
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
        const endpoint = await contract.methods.getWorkerEndpoint(
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
        const endpoint = await contract.methods.getWorkerEndpoint(
            el
        ).call();
        let jobsCompleted = 0, servicesCompleted = 0, dappGas;
        dappGas = await contract.methods.getWorkerAmount(
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
    thisObject.setState({workerData});
}

const fetchJobServiceCompleted = async (thisObject) => {
    const jobServiceCompleted = await contract.methods.jobServiceCompleted(
        thisObject.state.jobServiceCompleted.id,
        thisObject.state.jobServiceCompleted.worker,
        thisObject.state.jobServiceCompleted.isJob
    ).call();
    thisObject.setState({jobServiceCompleted});
}

const fetchIsServiceDone = async (thisObject) => {
    const isServiceDone = await contract.methods.isServiceDone(
        thisObject.state.isServiceDone.id
    ).call();
    thisObject.setState({isServiceDone});
}

const fetchGetMaxPaymentForGas = async (thisObject) => {
    const getMaxPaymentForGas = await contract.methods.getMaxPaymentForGas(
        thisObject.state.getMaxPaymentForGas.gasLimit,
        thisObject.state.getMaxPaymentForGas.imageName,
        thisObject.state.getMaxPaymentForGas.worker,
    ).call();
    thisObject.setState({getMaxPaymentForGas});
}

const fetchGetConfig = async (thisObject) => {
    const getConfig = await contract.methods.getConfig().call();
    thisObject.setState({getConfig});
}

const fetchGetWorkerAddresses = async (thisObject) => {
    const getWorkerAddresses = await contract.methods.getWorkerAddresses().call();
    thisObject.setState({getWorkerAddresses});
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
        thisObject.state.extendService.secs

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
            secs: thisObject.state.queueService.secs
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
    const abi = returnAbi("unapproveDockerForWorker");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.unapproveImage.imageName
    ]);
    await runTrx(data,["DockerApprovalChanged"],thisObject);
}

const deprecateWorker = async (thisObject) => {
    const abi = returnAbi("deprecateWorker");
    const data = web3.eth.abi.encodeFunctionCall(abi, []);
    await runTrx(data,["WorkerStatusChanged"],thisObject);
}

const regWorker = async (thisObject) => {
    const abi = returnAbi("regWorker");
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        thisObject.state.regWorker.endpoint
    ]);
    await runTrx(data,["WorkerStatusChanged"],thisObject);
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
    fetchIsImageApprovedForWorker,
    fetchEndpointForWorker,
    fetchWorkerInfo,
    fetchWorkerData,
    setDockerImage,
    unapproveDockerImage,
    deprecateWorker,
    regWorker,
    claim,
    sellGas,
    buyGasFor,
    fetchWorkersByConsumer,
    fetchJobServiceCompleted,
    fetchIsServiceDone,
    fetchGetMaxPaymentForGas,
    fetchGetConfig,
    fetchGetWorkerAddresses,
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