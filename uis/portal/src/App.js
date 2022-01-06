import React from 'react'
// import logo from './logo.svg';
import 'css/main.scss'
import NexusJSON from 'abi/Nexus.json'
import AppRoutes from "./pages";
import {BrowserRouter} from 'react-router-dom';
import Header from "layout/Header";
import MainMenu from "layout/MainMenu";

const getAbi = (func) => {
    return NexusJSON.abi.find(el => el.name === func && el.type === "function");
}

// UNUSED
// gasPerTimeUnit
// getConfig
// setConfig
// getMaxPaymentForGas
// getMinBalance
//
// jobCallback
// jobError
// jobs
// lastJobID
//
// serviceCallback
// serviceError
// services
//

const globalFunctions = [
    'token',
    '',
]

const searchFunctions = [
    'registeredDSPs',
    'getDSPDataLimits',
    'getDSPEndpoint',
    'getDspAddresses',
    'getPortForDSP',

    'jobDockerImages',
    'serviceDockerImages',
    '',
    '',
]

const servicesFunctions = [
    'extendService', // by consumer
    'runService',
]

const jobsFunctions = [
    'runJob',
]

const consumerFunctions = [
    'buyGasFor',
    'sellGas',
    'setConsumerPermissions',
    'dspData', // mapping(address => mapping(address => PerConsumerDSPEntry))
]

const dspFunctions = [
    'regDSP',
    'deprecateDSP',

    'claim',

    'setJobDockerImage',
    'setServiceDockerImage',

    'approveDockerForDSP',
    'isImageApprovedForDSP',
    'unapproveDockerForDSP',
]

function App() {

    return (
        <div className="App">
            <BrowserRouter>
                <Header/>
                {/*<MainMenu/>*/}
                <AppRoutes/>
            </BrowserRouter>
        </div>
    );
}

export default App;
