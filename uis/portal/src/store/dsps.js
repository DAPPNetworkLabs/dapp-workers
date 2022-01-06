import _ from 'lodash'
import {makeReducer} from "utils";
import {BigNumber} from "ethers";
import {DSP1_ADDRESS, DSP2_ADDRESS, CONSUMER1_ADDRESS, CONSUMER2_ADDRESS} from "consts";

const INITIAL_STATE = {
    [DSP1_ADDRESS]: {
        // address: DSP1_ADDRESS,
        endpoint: 'https://dsp1.endpoint',
        active: true,
        registered: true,
        claimableDapp: BigNumber.from(0),
        approvedImages: {
            'wasmrunner': true,
            'wasi-service': true,
        },

        jobImages: {
            'wasmrunner': {
                owner: DSP1_ADDRESS,
                image: 'https://',
                imageHash: 'SFHKJHW4KHRWK4H5K34KRHE',
                jobFee: 15,
            },
        },
        serviceImages: {
            'wasi-service': {
                owner: DSP1_ADDRESS,
                image: 'https://',
                imageHash: 'KJLSDJF4LKJFS45L3434FJLW4JL4KW',
                baseFee: 15,
                storageFee: 20,
                ioFee: 20,
                minStorageMegaBytes: 1,
                minIoMegaBytes: 2,
            },
        },

        dspConsumerData: {
            [CONSUMER1_ADDRESS]: {amount: 1000},
            [CONSUMER2_ADDRESS]: {amount: 2000},
        },

        dbEndpoint: 'https://dsp1.db'
    },
    [DSP2_ADDRESS]: {
        // address: DSP2_ADDRESS,
        endpoint: 'https://dsp2.endpoint',
        active: true,
        registered: true,
        claimableDapp: BigNumber.from(0),
        approvedImages: {
            'wasmrunner': true,
            'wasi-service': true,
        },

        jobImages: {
            'wasmrunner': {
                owner: DSP2_ADDRESS,
                image: 'https://',
                imageHash: 'SFHKJHW4KHRWK4H5K34KRHE',
                jobFee: 15,
            },
        },
        serviceImages: {
            'wasi-service': {
                owner: DSP2_ADDRESS,
                image: 'https://',
                imageHash: 'KJLSDJF4LKJFS45L3434FJLW4JL4KW',
                baseFee: 15,
                storageFee: 20,
                ioFee: 20,
                minStorageMegaBytes: 1,
                minIoMegaBytes: 2,
            },
        },

        dspConsumerData: {
            [CONSUMER1_ADDRESS]: {amount: 2000},
            [CONSUMER2_ADDRESS]: {amount: 3000},
        },

        dbEndpoint: 'https://dsp2.db'
    },
}

export const dspsSelector = state => _.get(state, 'dsps', {})

export const dspSelector = address => state => _.get(state, ['dsps', address], {})

const dspsReducer = makeReducer({

}, INITIAL_STATE)

export default dspsReducer