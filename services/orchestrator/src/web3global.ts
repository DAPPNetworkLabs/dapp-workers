const Web3 = require('web3');
console.log(`process.env.ETH_ADDR`,process.env.ETH_ADDR)
export let provider = new Web3.providers.WebsocketProvider(process.env.ETH_ADDR);
export let web3 = new Web3(provider);