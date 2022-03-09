import React, { Component } from 'react';
import classes from './Home.module.scss';
import Header from '../../components/Header/Header';
import Jobs from '../../components/Home/Jobs/Jobs';
import Services from '../../components/Home/Services/Services';
import Form from '../../components/UI/Form/Form';
import Footer from '../../components/Footer/Footer';
import lib from '../../lib/index';

import { GlobalStyles } from '../../view/css/global';

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
            jobServiceCompleted:null,
            getMinBalance:null,
            isServiceDone:null,
            getMaxPaymentForGas:null,
            getConfig: {},
            getDspAddresses: [],
            getDSPDataLimits: null,
            getDSPDataLimitsParams: {
                id:null,
                dsp:null
            },
            approveImageParams: {
                imageName:null,
                imageHash:null
            },
            getMaxPaymentForGasParams:{
                gasLimit:null, 
                imageName:null, 
                dsp:null
            },
            extendServiceParams: {
                serviceId:null,
                imageName:null,
                months:null,
                ioMb:null,
                storageMb:null
            },
            isServiceDoneParams: {
                id:null
            },
            getMinBalanceParams: {
                id:null,
                jobType:null,
                dsp:null
            },
            setConsumerContractParams: {
                authorized_contract:null
            },
            setDspsParams: {
                dsps:[]                
            },
            setConfig: {
                paymentPremiumPPB:null,
                gasCeilingMultiplier:null,
                fallbackGasPrice:null,
                stalenessSeconds:null,
            },
            jobServiceCompletedParams: {
                id:null,
                dsp:null,
                isJob:null,
            },
            queueJob: {
                owner: '0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f',
                imageName: 'rust-compiler',
                inputFS: 'QmUm1JD5os8p6zu6gQBPr7Rov2VD6QzMeRBH5j4ojFBzi6',
                callback: true,
                gasLimit: 1000000,
                requireConsistent: true,
                args: []
            },
            queueService: {
                owner: null,
                imageName: null,
                ioMegaBytes: null,
                storageMegaBytes: null,
                inputFS: null,
                args: [],
                months: null
            },
            // runJob: {
            //     jobId: 5,
            //     outputFS: '',
            //     outputHash: ''
            // },
            // runService: {
            //     jobId: 5,
            //     port: 8080,
            //     dapps: 804000
            // },
            setDockerImage: {
                imageName: null,
                jobFee:null,
                baseFee:null,
                storageFee:null,
                ioFee:null,
                minStorageMegaBytes:null,
                minIoMegaBytes:null
            },
            updateDockerImage: {
                imageName: null,
                jobFee:null,
                baseFee:null,
                storageFee:null,
                ioFee:null,
                minStorageMegaBytes:null,
                minIoMegaBytes:null
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
                dsp:null,
                imageName:null
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
            claim: {
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
        // lib.web3.fetchJobs(this);
        // lib.web3.fetchServices(this);
        // lib.metamask.runHandlers(this);
        this.setState({ account: accounts[0] });
    }

    componentWillUnmount() {
        // lib.metamask.rmHandlers();
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
            onClick:()=>lib.web3.extendService(this),
            buttonText:"Extend Service",
            stateSelector:"ServiceExtended",
            inputs:[
                { name:"serviceId",placeholder: "uint serviceId"},
                { name:"imageName",placeholder: "string calldata imageName"},
                { name:"months",placeholder: "uint months"},
                { name:"ioMb",placeholder: "uint ioMb"},
                { name:"storageMb",placeholder: "uint storageMb"},
            ]
        },
        {
            onClick:()=>lib.web3.setConfig(this),
            buttonText:"Set Config",
            stateSelector:"ConfigSet",
            inputs:[
                { name:"paymentPremiumPPB",placeholder: "uint32 paymentPremiumPPB"},
                { name:"gasCeilingMultiplier",placeholder: "uint16 gasCeilingMultiplier"},
                { name:"fallbackGasPrice",placeholder: "uint256 fallbackGasPrice"},
                { name:"stalenessSeconds",placeholder: "uint24 stalenessSeconds"}
            ]
        },
        {
            onClick:()=>lib.web3.setDsps(this),
            buttonText:"Set DSPs",
            stateSelector:"UpdateDsps",
            inputs:[
                { name:"dsps",placeholder: "address[] calldata dsps"}
            ]
        },
        {
            onClick:()=>lib.web3.setConsumerContract(this),
            buttonText:"Set Consumer Contract",
            stateSelector:"",
            inputs:[
                { name:"dsps",placeholder: "address[] calldata dsps"}
            ]
        },
        {
            onClick:()=>lib.web3.queueJob(this),
            buttonText:"Post Job",
            stateSelector:"QueueJob",
            inputs:[
                { name:"owner",placeholder: "address owner"},
                { name:"imageName",placeholder: "string imageName"},
                { name:"inputFS",placeholder: "string inputFS"},
                { name:"callback",placeholder: "bool callback"},
                { name:"gasLimit",placeholder: "uint gasLimit"},
                { name:"requireConsistent",placeholder: "bool requireConsistent"},
                { name:"args",placeholder: "string[] args"}
            ]
        },
        {
            onClick:()=>lib.web3.queueService(this),
            buttonText:"Post Service",
            stateSelector:"QueueService",
            inputs:[
                { name:"owner",placeholder: "address owner"},
                { name:"imageName",placeholder: "string imageName"},
                { name:"ioMegaBytes",placeholder: "uint ioMegaBytes"},
                { name:"storageMegaBytes",placeholder: "uint storageMegaBytes"},
                { name:"inputFS",placeholder: "string inputFS"},
                { name:"args",placeholder: "string[] args"},
                { name:"months",placeholder: "uint months"},
            ]
        },
        {
            onClick:()=>lib.web3.setDockerImage(this),
            buttonText:"Set Docker Image",
            stateSelector:"setDockerImage",
            inputs:[
                { name:"imageName",placeholder: "string imageName"},
                { name:"jobFee",placeholder: "uint jobFee"},
                { name:"baseFee",placeholder: "uint baseFee"},
                { name:"storageFee",placeholder: "uint storageFee"},
                { name:"ioFee",placeholder: "uint ioFee"},
                { name:"minStorageMegaBytes",placeholder: "uint minStorageMegaBytes"},
                { name:"minIoMegaBytes",placeholder: "uint minIoMegaBytes"},
            ]
        },
        {
            onClick:()=>lib.web3.fetchDspInfo(this),
            buttonText:"Fetch DSP Info",
            stateSelector:"registeredDSPs",
            inputs:[
                { name:"dsp",placeholder: "address dsp"},
            ]
        },
        {
            onClick:()=>lib.web3.fetchDspData(this),
            buttonText:"Fetch DSP Data",
            stateSelector:"dspDataForm",
            inputs:[
                { name:"consumer",placeholder: "address consumer"},
                { name:"dsp",placeholder: "address dsp"},
            ]
        },
        // {
        //     onClick:()=>lib.web3.fetchConsumerData(this),
        //     buttonText:"Fetch Consumer Data",
        //     stateSelector:"consumerDataForm",
        //     inputs:[
        //         { name:"consumer",placeholder: "address consumer"},
        //     ]
        // },
        {
            onClick:()=>lib.web3.fetchEndpointForDSP(this),
            buttonText:"Fetch DSP Endpoint",
            stateSelector:"getDSPEndpoint",
            inputs:[
                { name:"dsp",placeholder: "address dsp"},
            ]
        },
        {
            onClick:()=>lib.web3.fetchPortForDSP(this),
            buttonText:"Fetch DSP Port",
            stateSelector:"getPortForDSP",
            inputs:[
                { name:"jobID",placeholder: "uint256 jobID"},
                { name:"dsp",placeholder: "address dsp"},
            ]
        },
        {
            onClick:()=>lib.web3.unapproveDockerImage(this),
            buttonText:"Unapprove Docker",
            stateSelector:"unapproveDockerForDSP",
            inputs:[
                { name:"imageName",placeholder: "string imageName"},
            ]
        },
        {
            onClick:()=>lib.web3.fetchIsImageApprovedForDSP(this),
            buttonText:"Fetch Image Approval for DSP",
            stateSelector:"isImageApprovedForDSP",
            inputs:[
                { name:"dsp",placeholder: "address dsp"},
                { name:"imageName",placeholder: "string imageName"},
            ]
        },
        // {
        //     onClick:()=>lib.web3.fetchJobImage(this),
        //     buttonText:"Fetch Docker Image",
        //     stateSelector:"getDockerImage",
        //     inputs:[
        //         { name:"imageName",placeholder: "string imageName"},
        //     ]
        // },
        {
            onClick:()=>lib.web3.deprecateDSP(this),
            buttonText:"Deprecate DSP",
            stateSelector:"deprecateDSP",
            inputs:[]
        },
        {
            onClick:()=>lib.web3.regDSP(this),
            buttonText:"Register DSP Endpoint",
            stateSelector:"regDSP",
            inputs:[
                { name:"endpoint",placeholder: "string endpoint"},
            ]
        },
        {
            onClick:()=>lib.web3.claim(this),
            buttonText:"Claim Gas for DSP",
            stateSelector:"claim",
            inputs:[]
        },
        {
            onClick:()=>lib.web3.sellGas(this),
            buttonText:"Sell Gas",
            stateSelector:"sellGas",
            inputs:[
                { name:"_amountToSell",placeholder: "uint256 _amountToSell"},
                { name:"_dsp",placeholder: "address _dsp"},
            ]
        },
        {
            onClick:()=>lib.web3.buyGasFor(this),
            buttonText:"Buy Gas For DSP",
            stateSelector:"buyGasFor",
            inputs:[
                { name:"_amount",placeholder: "uint256 _amount"},
                { name:"_consumer",placeholder: "address _consumer"},
                { name:"_dsp",placeholder: "address _dsp"},
            ]
        },
        {
            onClick:()=>lib.web3.setConsumerPermissions(this),
            buttonText:"Set Consumer Owner",
            stateSelector:"setConsumerPermissions",
            inputs:[
                { name:"owner",placeholder: "address owner"},
            ]
        },
        {
            onClick:()=>lib.web3.setQuorum(this),
            buttonText:"Set DSP Quorum for Consumer",
            stateSelector:"setQuorum",
            inputs:[
                { name:"consumer",placeholder: "address consumer"},
                { name:"dsps",placeholder: "address[] dsps"},
            ]
        },
        {
            onClick:()=>lib.web3.fetchJobServiceCompleted(this),
            buttonText:"Is Job/Service Complete",
            stateSelector:"",
            inputs:[
                { name:"id",placeholder: "uint id"},
                { name:"dsp",placeholder: "address dsp"},
                { name:"isJob",placeholder: "isJob"},
            ]
        },
        {
            onClick:()=>lib.web3.fetchGetMinBalance(this),
            buttonText:"Fetch Min Balance",
            stateSelector:"",
            inputs:[
                { name:"id",placeholder: "uint id"},
                { name:"jobType",placeholder: "string memory jobType"},
                { name:"dsp",placeholder: "address dsp"}
            ]
        },
        {
            onClick:()=>lib.web3.fetchIsServiceDone(this),
            buttonText:"Fetch Is Service Done",
            stateSelector:"",
            inputs:[
                { name:"id",placeholder: "uint id"}
            ]
        },
        {
            onClick:()=>lib.web3.fetchGetMaxPaymentForGas(this),
            buttonText:"Fetch Max Payment for Gas",
            stateSelector:"",
            inputs:[
                { name:"gasLimit",placeholder: "gasLimit"},
                { name:"imageName",placeholder: "imageName"},
                { name:"dsp",placeholder: "address dsp"}
            ]
        },
        {
            onClick:()=>lib.web3.fetchGetConfig(this),
            buttonText:"Get Config",
            stateSelector:"",
            inputs:[]
        },
        {
            onClick:()=>lib.web3.fetchGetDspAddresses(this),
            buttonText:"Get DSP Addresses",
            stateSelector:"",
            inputs:[]
        },
        {
            onClick:()=>lib.web3.fetchGetDSPDataLimits(this),
            buttonText:"Get DSP Data Limits",
            stateSelector:"",
            inputs:[
                { name:"id",placeholder: "uint id"},
                { name:"dsp",placeholder: "address dsp"}
            ]
        },
        {
            onClick:()=>lib.web3.fetchLastJob(this),
            buttonText:"Get last Job ID",
            stateSelector:"",
            inputs:[]
        },
        // {
        //     onClick:()=>lib.web3.(this),
        //     buttonText:"",
        //     stateSelector:"",
        //     inputs:[
        //         { name:"",placeholder: ""}
        //     ]
        // }
    ]
  
    render() {
        const forms = this.forms.map(el => {
            return (
                <Form
                    onClick={el.onClick}
                    onChange={this.handleChange}
                    buttonText={el.buttonText}
                    stateSelector={el.stateSelector}
                    inputs={el.inputs}
                />
            )
        });

        return (
            <>
                <GlobalStyles />
                <Header
                    login={()=>lib.metamask.login(this)}
                    logout={()=>lib.metamask.logout(this)}
                    account={this.state.account}
                />
                <div>
                    <div className={isMobile ? classes.centerMobile : classes.center}>
                        {forms}
                    </div>
                </div>
                <Footer/>
            </>
        );
    }
  }
  
  export default Home;
  