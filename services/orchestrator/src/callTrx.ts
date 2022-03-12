import { web3 } from './web3global';
import { address } from './index'; 
let abi = require(process.env.NEXUS_PATH || '/nexus/artifacts/contracts/Nexus.sol/Nexus.json');
export async function callTrx(method, account_from, ...args) {
    const theContract2 = new web3.eth.Contract(abi.abi, address, {
        from: account_from.address
    });
    const result = await theContract2.methods[method](...args).call({
        from: account_from.address,
        to: address
    });
    return result;
}
