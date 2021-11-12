
import React, { Component } from 'react';
import classes from './Home.module.scss';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

import Web3 from 'web3';
import NexusJSON from '../../abi/Nexus.json';

const fetchJobs = async () => {
  const web3 = new Web3('http://localhost:8545');
  const contractAddress = "0x94D387F50569200aDACFd903345D077ef6ABcE11";
  const contract = new web3.eth.Contract(NexusJSON.abi,contractAddress);
  console.log(contract);
  const lastJob = await contract.methods.lastJobID().call();
  const jobs = await contract.methods.jobs(lastJob).call();
  console.log(jobs);
}

class Home extends Component {
    constructor(props) {
      super(props);
    }
  
    render() {
        fetchJobs();
        return (
            <div>
                <Header/>
                <Footer/>
            </div>
        );
    }
  }
  
  export default Home;
  