import { web3 } from './web3global';
import { contractWrapper } from './compile';
export async function callTrx(method, account_from, ...args) {
    const {abi, address} = contractWrapper;
    const theContract2 = new web3.eth.Contract(abi, address, {
        from: account_from.address
    });
    const result = await theContract2.methods[method](...args).call({
        from: account_from.address,
        to: address
    });
    return result;
}
