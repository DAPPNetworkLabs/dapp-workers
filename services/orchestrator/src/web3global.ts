const Web3 = require('web3');
console.log(`process.env.ETH_ADDR`,process.env.ETH_ADDR)
export let provider = new Web3.providers.WebsocketProvider(process.env.ETH_ADDR, {
    reconnect: {
        auto: true,
        delay: 1000,
        onTimeout: false,
    },
    timeout: 30000,
    clientConfig: {
        maxReceivedFrameSize: 50000000000,
        maxReceivedMessageSize: 50000000000,
        keepalive: true,
        keepaliveInterval: 60000,
        // dropConnectionOnKeepaliveTimeout: true,
        // keepaliveGracePeriod: 30000,
    }
})
// .on("connect", () => {
//     console.log(`connected!`);
// }).on("reconnect", () => {
//     console.log(`reconnecting...`);
// }).on("close", () => {
//     console.log(`disconnected`);
// });
export let web3 = new Web3(provider);