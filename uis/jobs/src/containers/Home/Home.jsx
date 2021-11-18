
import React, { Component } from 'react';
import classes from './Home.module.scss';
import Header from '../../components/Header/Header';
import Jobs from '../../components/Home/Jobs/Jobs';
import Services from '../../components/Home/Services/Services';
import PostJobOrService from '../../components/Home/PostJobOrService/PostJobOrService';
import RunJob from '../../components/Home/RunJob/RunJob';
import RunService from '../../components/Home/RunService/RunService';
import SetDockerImage from '../../components/Home/SetDockerImage/SetDockerImage';
import ApproveDocker from '../../components/Home/ApproveDocker/ApproveDocker';
import DspInfo from '../../components/Home/DspInfo/DspInfo';
import Footer from '../../components/Footer/Footer';
import lib from '../../lib/index';

const ethereum = window.ethereum;

class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: null,
            chainId: null,
            jobs: [],
            services: [],
            connectInfo: null,
            disconnectInfo: null,
            trxInfo: null,
            events: [],
            image:null,
            port:null,
            endpoint:null,
            approvedImage:null,
            run: {
                consumer: '0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f',
                imageName: 'rust-compiler',
                inputFS: 'QmUm1JD5os8p6zu6gQBPr7Rov2VD6QzMeRBH5j4ojFBzi6',
                args: []
            },
            runJob: {
                jobId: 5,
                outputFS: '',
                dapps: 804000
            },
            runService: {
                jobId: 5,
                port: 8080,
                dapps: 804000
            },
            setDockerImage: {
                imageName: '',
                imageAddress: '',
                imageHash: '',
                imageType: ''
            },
            approveDocker: {
                imageName: ''
            },
            registeredDSPs: {
                dsp:'0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f'
            },
            getDockerImage: {
                imageName:''
            },
            isImageApprovedForDSP: {
                imageName:''
            },
            getPortForDSP: {
                jobID:'',
                dsp:''
            },
            getDSPEndpoint: {
                dsp:''
            },
            unapproveDockerForDSP: {
                imageName:''
            },
            regDSP: {
                endpoint:''
            },
            claimFor: {
                _consumer:'',
                _dsp:''
            },
            sellGas: {
                _amountToSell:'',
                _dsp:''
            },
            buyGasFor: {
                _amount:'',
                _consumer:'',
                _dsp:''
            },
            setConsumerCallback: {
                enabled:null
            },
            setConsumerPermissions: {
                owner:''
            },
            setQuorum: {
                consumer:'',
                dsps:[]
            },
            jobError: {
                jobID:'',
                stdErr:'',
                outputFS:''
            },
            serviceError: {
                jobID:'',
                stdErr:'',
                outputFS:''
            }
        }
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        const accounts = ethereum.request({ method: 'eth_requestAccounts' });
        lib.web3.fetchJobs(this);
        lib.web3.fetchServices(this);
        lib.metamask.runHandlers(this);
        this.setState({ account: accounts[0] });
    }

    componentWillUnmount() {
        lib.metamask.rmHandlers();
    }

    handleChange(event, func) {
        const { name, value } = event.target;
        this.setState({
            [func]: {
                ...this.state[func],
                [name]: value,
                error: '',
            },
        });
    }
  
    render() {
        return (
            <div>
                <Header
                    login={()=>lib.metamask.login(this)}
                    logout={()=>lib.metamask.logout(this)}
                    account={this.state.account}
                />
                <Jobs
                    jobs={this.state.jobs}
                />
                <Services
                    services={this.state.services}
                />
                <PostJobOrService
                    postJobOrService={()=>lib.web3.postJobOrService(this)}
                    onChange={this.handleChange}
                />
                <RunJob
                    runJob={()=>lib.web3.runJob(this)}
                    onChange={this.handleChange}
                />
                <RunService
                    runService={()=>lib.web3.runService(this)}
                    onChange={this.handleChange}
                />
                <SetDockerImage
                    setDockerImage={()=>lib.web3.setDockerImage(this)}
                    onChange={this.handleChange}
                />
                <ApproveDocker
                    approveDocker={()=>lib.web3.approveDockerImage(this)}
                    onChange={this.handleChange}
                />
                <DspInfo
                    fetchDspInfo={()=>lib.web3.fetchDspInfo(this.state.registeredDSPs.dsp)}
                    onChange={this.handleChange}
                />
                {/* 
                    dspData
                    consumerData
                    dockerImages
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
                */}
                <Footer/>
            </div>
        );
    }
  }
  
  export default Home;
  