import { approvedServicesType } from './types';
import Web3 from 'web3';

const abi = require('./abi/Nexus/Nexus.json');
const web3 = new Web3(process.env.ETH_ADDR);
const nexus = new web3.eth.Contract(abi.abi, process.env.ADDRESS);

const nodeFetch = require('node-fetch');

export const preCheck = async (image,res) => {
    const servicesObj = await fetchApprovedImages();
    if(!image || !servicesObj.approvedServices.includes(image)) {
        return res.status(401).send("Image doesn't exist or not supported");
    }
}

const fetchApprovedImages = async (): Promise<approvedServicesType> => {
    const cid = await nexus.methods.APPROVED_IMAGES_IPFS().call({
        from: "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe"
    });
    return await nodeFetch(`http://${process.env.IPFS_HOST}:8080/ipfs/${cid}`);
}