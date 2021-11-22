
import React, { Component } from 'react';
import classes from './Home.module.scss';
import Header from '../../components/Header/Header';
import Jobs from '../../components/Home/Jobs/Jobs';
import Services from '../../components/Home/Services/Services';
import Form from '../../components/UI/Form/Form';
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
            dspData:null,
            consumerData:null,
            dockerImage:null,
            dspInfo:null,
            run: {
                consumer: '0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f',
                imageName: 'rust-compiler',
                inputFS: 'QmUm1JD5os8p6zu6gQBPr7Rov2VD6QzMeRBH5j4ojFBzi6',
                callback: true,
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
                imageName: 'test',
                imageAddress: 'test',
                imageHash: 'test',
                imageType: 'service'
            },
            approveDocker: {
                imageName: 'test'
            },
            registeredDSPs: {
                dsp:'0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f'
            },
            getDockerImage: {
                imageName:'test'
            },
            isImageApprovedForDSP: {
                imageName:'test'
            },
            getPortForDSP: {
                jobID:'1',
                dsp:'0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f'
            },
            getDSPEndpoint: {
                dsp:'0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f'
            },
            unapproveDockerForDSP: {
                imageName:'test'
            },
            regDSP: {
                endpoint:'http://testing.com'
            },
            claimFor: {
                _consumer:'0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f',
                _dsp:'0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f'
            },
            sellGas: {
                _amountToSell:1,
                _dsp:'0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f'
            },
            buyGasFor: {
                _amount:1,
                _consumer:'0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f',
                _dsp:'0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f'
            },
            // setConsumerCallback: {
            //     enabled:null
            // },
            setConsumerPermissions: {
                owner:'0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f'
            },
            setQuorum: {
                consumer:'0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f',
                dsps:['0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f']
            },
            jobError: {
                jobID:'1',
                stdErr:'',
                outputFS:''
            },
            serviceError: {
                jobID:'1',
                stdErr:'',
                outputFS:''
            },
            dspDataForm: {
                account: '0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f',
                dsp:'0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f'
            },
            consumerDataForm: {
                consumer: '0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f'
            },
            dockerImages: {
                imageName: 'test'
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

    forms = [
        {
            onClick:()=>lib.web3.postJobOrService(this),
            buttonText:"Post Job or Service",
            event:"run",
            inputs:[
                { name:"consumer",placeholder: "address consumer"},
                { name:"imageName",placeholder: "string imageName"},
                { name:"inputFS",placeholder: "string inputFS"},
                { name:"callback",placeholder: "bool callback"},
                { name:"args",placeholder: "string[] args"}
            ]
        },
        {
            onClick:()=>lib.web3.runJob(this),
            buttonText:"Run Job",
            event:"runJob",
            inputs:[
                { name:"jobID",placeholder: "uint256 jobID"},
                { name:"outputFS",placeholder: "string outputFS"},
                { name:"dapps",placeholder: "uint256 dapps"},
            ]
        },
        {
            onClick:()=>lib.web3.runService(this),
            buttonText:"Run Service",
            event:"runService",
            inputs:[
                { name:"jobId",placeholder: "uint256 jobId"},
                { name:"port",placeholder: "uint256 port"},
                { name:"dapps",placeholder: "uint256 dapps"},
            ]
        },
        {
            onClick:()=>lib.web3.setDockerImage(this),
            buttonText:"Set Docker Image",
            event:"setDockerImage",
            inputs:[
                { name:"imageName",placeholder: "string imageName"},
                { name:"imageAddress",placeholder: "string imageAddress"},
                { name:"imageHash",placeholder: "string imageHash"},
                { name:"imageType",placeholder: "string imageType"},
            ]
        },
        {
            onClick:()=>lib.web3.approveDockerImage(this),
            buttonText:"Approve Docker Image",
            event:"approveDocker",
            inputs:[
                { name:"imageName",placeholder: "string imageName"},
            ]
        },
        {
            onClick:()=>lib.web3.fetchDspInfo(this),
            buttonText:"Fetch DSP Info",
            event:"registeredDSPs",
            inputs:[
                { name:"dsp",placeholder: "address dsp"},
            ]
        },
        {
            onClick:()=>lib.web3.fetchDspData(this),
            buttonText:"Fetch DSP Data",
            event:"dspDataForm",
            inputs:[
                { name:"consumer",placeholder: "address consumer"},
                { name:"dsp",placeholder: "address dsp"},
            ]
        },
        {
            onClick:()=>lib.web3.fetchConsumerData(this),
            buttonText:"Fetch Consumer Data",
            event:"consumerDataForm",
            inputs:[
                { name:"consumer",placeholder: "address consumer"},
            ]
        },
        // {
        //     onClick:()=>lib.web3.fetchDockerImage(this),
        //     buttonText:"Fetch Docker Image",
        //     event:"dockerImages",
        //     inputs:[
        //         { name:"imageName",placeholder: "string imageName"},
        //     ]
        // },
        {
            onClick:()=>lib.web3.fetchEndpointForDSP(this),
            buttonText:"Fetch DSP Endpoint",
            event:"getDSPEndpoint",
            inputs:[
                { name:"dsp",placeholder: "address dsp"},
            ]
        },
        {
            onClick:()=>lib.web3.fetchPortForDSP(this),
            buttonText:"Fetch DSP Port",
            event:"getPortForDSP",
            inputs:[
                { name:"jobID",placeholder: "uint256 jobID"},
                { name:"dsp",placeholder: "address dsp"},
            ]
        },
        {
            onClick:()=>lib.web3.unapproveDockerImage(this),
            buttonText:"Unapprove Docker",
            event:"unapproveDockerForDSP",
            inputs:[
                { name:"imageName",placeholder: "string imageName"},
            ]
        },
        {
            onClick:()=>lib.web3.fetchIsImageApprovedForDSP(this),
            buttonText:"Fetch Image Approval for DSP",
            event:"isImageApprovedForDSP",
            inputs:[
                { name:"imageName",placeholder: "string imageName"},
            ]
        },
        {
            onClick:()=>lib.web3.fetchJobImage(this),
            buttonText:"Fetch Docker Image",
            event:"getDockerImage",
            inputs:[
                { name:"imageName",placeholder: "string imageName"},
            ]
        },
        {
            onClick:()=>lib.web3.deprecateDSP(this),
            buttonText:"Deprecate DSP",
            event:"deprecateDSP",
            inputs:[]
        },
        {
            onClick:()=>lib.web3.regDSP(this),
            buttonText:"Register DSP Endpoint",
            event:"regDSP",
            inputs:[
                { name:"endpoint",placeholder: "string endpoint"},
            ]
        },
        {
            onClick:()=>lib.web3.claimFor(this),
            buttonText:"Claim Gas for Consumer",
            event:"claimFor",
            inputs:[
                { name:"_consumer",placeholder: "address _consumer"},
                { name:"_dsp",placeholder: "address _dsp"},
            ]
        },
        {
            onClick:()=>lib.web3.sellGas(this),
            buttonText:"Sell Gas",
            event:"sellGas",
            inputs:[
                { name:"_amountToSell",placeholder: "uint256 _amountToSell"},
                { name:"_dsp",placeholder: "address _dsp"},
            ]
        },
        {
            onClick:()=>lib.web3.buyGasFor(this),
            buttonText:"Buy Gas For DSP",
            event:"buyGasFor",
            inputs:[
                { name:"_amount",placeholder: "uint256 _amount"},
                { name:"_consumer",placeholder: "address _consumer"},
                { name:"_dsp",placeholder: "address _dsp"},
            ]
        },
        // {
        //     onClick:()=>lib.web3.setConsumerCallback(this),
        //     buttonText:"Enable/Disable Consumer Callback",
        //     event:"setConsumerCallback",
        //     inputs:[
        //         { name:"enabled",placeholder: "bool enabled"},
        //     ]
        // },
        {
            onClick:()=>lib.web3.setConsumerPermissions(this),
            buttonText:"Set Consumer Owner",
            event:"setConsumerPermissions",
            inputs:[
                { name:"owner",placeholder: "address owner"},
            ]
        },
        {
            onClick:()=>lib.web3.setQuorum(this),
            buttonText:"Set DSP Quorum for Consumer",
            event:"setQuorum",
            inputs:[
                { name:"consumer",placeholder: "address consumer"},
                { name:"dsps",placeholder: "address[] dsps"},
            ]
        },
        {
            onClick:()=>lib.web3.jobError(this),
            buttonText:"Handle Job Error",
            event:"jobError",
            inputs:[
                { name:"jobID",placeholder: "uint256 jobID"},
                { name:"stdErr",placeholder: "string stdErr"},
                { name:"outputFS",placeholder: "string outputFS"}
            ]
        },
        {
            onClick:()=>lib.web3.serviceError(this),
            buttonText:"Handle Service Error",
            event:"serviceError",
            inputs:[
                { name:"jobID",placeholder: "uint256 jobID"},
                { name:"stdErr",placeholder: "string stdErr"},
                { name:"outputFS",placeholder: "string outputFS"}
            ]
        }
    ]
  
    render() {
        const forms = this.forms.map(el => {
            return (
                <Form
                    onClick={el.onClick}
                    onChange={this.handleChange}
                    buttonText={el.buttonText}
                    event={el.event}
                    inputs={el.inputs}
                />
            )
        })
        return (
            <div>
                <Header
                    login={()=>lib.metamask.login(this)}
                    logout={()=>lib.metamask.logout(this)}
                    account={this.state.account}
                />
                {/* <Jobs
                    jobs={this.state.jobs}
                />
                <Services
                    services={this.state.services}
                /> */}
                {forms}
                <Footer/>
            </div>
        );
    }
  }
  
  export default Home;
  