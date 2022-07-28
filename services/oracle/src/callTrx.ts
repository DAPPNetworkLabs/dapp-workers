import { web3 } from './web3Global'; 
const abiBancor = require('../abi/Bancor/Bancor.json');
const abiOracle = require('/nexus/artifacts/contracts/DappOracle.sol/DappOracle.json');
export async function callTrx(method, account_from, isOracle, ...args) {
    const theContract2 = new web3.eth.Contract(
        isOracle ? abiOracle.abi : abiBancor.abi, 
        isOracle ? process.env.DAPP_WORKERS_ORACLE_ADDR : process.env.DAPP_WORKERS_BANCOR_ADDR, {
        from: account_from.address
    });
    return await theContract2.methods[method](...args).call({
        from: account_from.address,
        to: process.env.ADDRESS
    });
}
