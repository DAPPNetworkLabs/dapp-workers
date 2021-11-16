import Web3 from 'web3';
import NexusJSON from '../../abi/Nexus.json';

const jobs = [];
const web3 = new Web3('http://localhost:8545');
const contractAddress = "0x94D387F50569200aDACFd903345D077ef6ABcE11";
const contract = new web3.eth.Contract(NexusJSON.abi,contractAddress);
const ethereum = window.ethereum;

const fetchJobs = async (thisObject) => {
    console.log(contract);
    const lastJob = await contract.methods.lastJobID().call();
    console.log(`lastJob: ${lastJob}`);
    for(let i=0; i < lastJob; i++) {
        const job = await contract.methods.jobs(i).call();
        jobs.push(job);
    }
    console.log(`jobs: ${jobs}`);
    thisObject.setState({jobs: JSON.stringify(jobs)});
}

const runJob = async (form) => {
    const abi = NexusJSON.abi.find(el => el.name == "run" && el.type == "function");
    console.log(abi);
    const data = web3.eth.abi.encodeFunctionCall(abi, [
        form.consumer,
        form.imageName,
        form.inputFS,form.args
    ]);
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

    const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
    });
    console.log(`trx: ${txHash}`);
    // await contract.events.Run({}, function(error, event){
    //     console.log(error);
    //     console.log(event); 
    // });
}

export default { 
    fetchJobs,
    runJob
}