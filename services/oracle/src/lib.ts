const { web3 } = require('./web3Oracle');
const deviationPercentage = process.env.DAPP_WORKER_DEVIATION_PERCENTAGE || .03;

const fetchDappUsd = async () => {
    // fetch bancor
}

const fetchDappEth = async () => {
    // fetch bancor
}

/*

    If Ethereum use chainlink fast gas feed
    If private use trx.gasPrice
    All else, fetch current gas price
    Handle for EIP/Non EIP1559 if necessary
    Polygon/Mumbai/Goerli EIP-1559 assuming
    BSC/BSCTest not EIP-1559

*/
const fetchGasWei = async () => {
    if(process.env.DAPP_WORKERS_CHAIN === 'polygon') {

    } else if(process.env.DAPP_WORKERS_CHAIN === 'bsc') {

    } else if(process.env.DAPP_WORKERS_CHAIN === 'mumbai') {

    } else if(process.env.DAPP_WORKERS_CHAIN === 'bsctest') {

    } else if(process.env.DAPP_WORKERS_CHAIN === 'goerli') {

    } else if(process.env.DAPP_WORKERS_CHAIN === 'ropsten') {

    } else if(process.env.DAPP_WORKERS_CHAIN === 'rinkeby') {

    }
}

const checkUpdateOracleDappUsd = async () => {
    // set deviation percentage, if doesn't exceed, do not update
    return true;
}

const checkUpdateOracleDappEth = async () => {
    return true;
}

const checkUpdateOracleGasWei = async () => {
    return true;
}

const updateOracleDappUsd = async () => {
    // update dapp usd oracle price
}

const updateOracleDappEth = async () => {
    
}

const updateOracleGasWei = async () => {
    
}


/*

    If Polygon/BSC pull ETH price from chain and update gas/dappusd oracles
    If testnet, update all oracles
    If private, use on chain trx.gasPrice, updat other prices

*/
export const oracleInterval = async () => {
    if(process.env.DAPP_WORKERS_CHAIN === 'polygon' || 
        process.env.DAPP_WORKERS_CHAIN === 'bsc'
    ) {
        if(await checkUpdateOracleDappUsd()) await updateOracleDappUsd();
        if(await checkUpdateOracleGasWei()) await updateOracleGasWei();
    } else if(process.env.DAPP_WORKERS_CHAIN === 'ethereum') {

    } else if(process.env.DAPP_WORKERS_CHAIN === 'mumbai' || 
        process.env.DAPP_WORKERS_CHAIN === 'bsctest' ||
        process.env.DAPP_WORKERS_CHAIN === 'goerli' ||
        process.env.DAPP_WORKERS_CHAIN === 'ropsten' ||
        process.env.DAPP_WORKERS_CHAIN === 'rinkeby'
    ) {
        if(await checkUpdateOracleDappUsd()) await updateOracleDappUsd();
        if(await checkUpdateOracleDappEth()) await updateOracleDappEth();
        if(await checkUpdateOracleGasWei()) await updateOracleGasWei();
    } else if(process.env.DAPP_WORKERS_CHAIN === 'private') {
        if(await checkUpdateOracleDappUsd()) await updateOracleDappUsd();
        if(await checkUpdateOracleDappEth()) await updateOracleDappEth();
    }
}