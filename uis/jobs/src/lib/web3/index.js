import Web3 from 'web3';
import NexusJSON from '../../abi/Nexus.json';

const jobs = [];

const fetchJobs = async (thisObject) => {
    const web3 = new Web3('http://localhost:8545');
    const contractAddress = "0x94D387F50569200aDACFd903345D077ef6ABcE11";
    const contract = new web3.eth.Contract(NexusJSON.abi,contractAddress);
    console.log(contract);
    const lastJob = await contract.methods.lastJobID().call();
    for(let i=0; i < lastJob; i++) {
        const job = await contract.methods.jobs(i).call();
        jobs.push(job);
    }
    console.log(jobs);
    thisObject.setState({jobs: JSON.stringify(jobs)});
}

export default { 
    fetchJobs
}