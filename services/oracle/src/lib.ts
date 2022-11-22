const { web3 } = require('./web3Oracle');
const deviationPercentage = process.env.DAPP_WORKER_DEVIATION_PERCENTAGE || .03;

const fetchDappUsd = async () => {
    // fetch bancor
}

const checkUpdateOracleDappUsd = async () => {
    // set deviation percentage, if doesn't exceed, do not update
    return true;
}

const updateOracleDappUsd = async () => {
    // update dapp usd oracle price
}


/*

    If Polygon/BSC pull ETH price from chain and update gas/dappusd oracles
    If testnet, update all oracles
    If private, use on chain trx.gasPrice, updat other prices

*/
export const oracleInterval = async () => {
    if(process.env.DAPP_WORKERS_CHAIN === 'polygon'
    ) {
        if(await checkUpdateOracleDappUsd()) await updateOracleDappUsd();
    } else if(process.env.DAPP_WORKERS_CHAIN === 'mumbai'
    ) {
        if(await checkUpdateOracleDappUsd()) await updateOracleDappUsd();
    } else if(process.env.DAPP_WORKERS_CHAIN === 'private') {
        if(await checkUpdateOracleDappUsd()) await updateOracleDappUsd();
    }
}