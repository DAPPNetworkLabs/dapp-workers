const { oracleInterval } = require('./lib');
const nodeFetch = require('node-fetch');
const intervalTime = process.env.DAPP_WORKER_INTERVAL_TIME || 15 * 1000 * 60; // 15m default

// set interval
// apis for polygon / bsc gas price
// api dappusd price -> call bancor
// api dappeth price -> call bancor

const run = () => {
    setInterval(() => {
        oracleInterval();
    }, Number(intervalTime));
}

run();