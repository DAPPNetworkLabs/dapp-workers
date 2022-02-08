const Web3 = require('web3');
export let provider = new Web3.providers.WebsocketProvider(process.env.ETH_ADDR);
export let web3 = new Web3(provider);