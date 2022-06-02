const Web3 = require('web3');
console.log(`process.env.ETH_ADDR`,process.env.ETH_ADDR)
import { subscribe } from './index';

export let provider = new Web3.providers.WebsocketProvider(process.env.ETH_ADDR, {
    reconnect: {
        auto: true,
        delay: 5000,
        onTimeout: false,
    },
    timeout: 6000000,
    clientConfig: {
        // maxReceivedFrameSize: 5000000000000,
        // maxReceivedMessageSize: 5000000000000,
        keepalive: true,
        keepaliveInterval: 60000,
        // dropConnectionOnKeepaliveTimeout: true,
        // keepaliveGracePeriod: 30000,
    }
})
.on("connect", () => {
    console.log(`connected!`);
}).on("reconnect", () => {
    console.log(`reconnecting...`);
}).on('end', socketError)
.on('close', socketError)
.on('error', e => console.log('WS Error', e));

export let web3 = new Web3(provider);

function socketError(e){
    console.log('WS closed');
    console.log('Attempting to reconnect...');

    provider.on('connect', function () {
        console.log('WSS Reconnected');
    });
    provider.on('end', socketError);
    provider.on('close', socketError);

    web3.setProvider(provider);
    if(theContract)
        subscribe(theContract);
}

const address = process.env.ADDRESS;
let abi = require(process.env.NEXUS_PATH || '/nexus/artifacts/contracts/Nexus.sol/Nexus.json');
const theContract = new web3.eth.Contract(
    abi.abi,
    address,
    {}
);