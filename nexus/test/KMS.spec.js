const { expect } = require("chai");
const { network, ethers } = require("hardhat");

const fs = require('fs');
const path = require('path');

const { AwsKmsSigner } = require ("ethers-aws-kms-signer");

const bancorNetwork = "0x2F9EC37d6CcFFf1caB21733BdaDEdE11c823cCB0";
const fastGasFeed = "0x169e633a2d1e6c10dd91238ba11c4a708dfef37c";
const paymentPremiumPPB = 200000000;
const stalenessSeconds = 86400;
const fallbackGasPrice = 200000000000;
const gasCeilingMultiplier = 2;

const AWS_KMS_KEY = process.env.ADDRESS;

let outputFSRes, nonce = 0;

function loadfsRoot(fsrootName){
  if(process.env.PRIVATE_KEY) {
    return fs.readFileSync(path.resolve('/services/orchestrator', `fsroots/${fsrootName}.ipfs`)).toString().trim();
  } else {
    return fs.readFileSync(path.resolve('../services/orchestrator', `fsroots/${fsrootName}.ipfs`)).toString().trim();
  }
}

const signKms = async (unsignedTx, nexusContract, signer) => {
    const txPop = await nexusContract.signer.populateTransaction(unsignedTx);
    const txPopCopy = {
      ...txPop
    };
    delete txPopCopy.from;
  
    const utx = txPopCopy;
    utx.nonce = nonce++;
    console.log('utx',utx);
    let txSign = await signer.signTransaction(utx);
    console.log('txSign',txSign);
  
    await nexusContract.provider.sendTransaction(txSign);
}

describe("Nexus KMS", function(done) {
  this.timeout(1000000);
  let addr1, addr2;
  let dappTokenContract, nexusContract;

  before(async function() {
    [addr1, addr2] = await ethers.getSigners();

    const dappTokenFactory = await ethers.getContractFactory("DappToken", addr1);
    console.log(addr1.address);
    console.log(addr2.address);
    const nexusTokenFactory = await ethers.getContractFactory("Nexus", addr1);

    dappTokenContract = await dappTokenFactory.deploy();
    nexusContract = await upgrades.deployProxy(nexusTokenFactory, 
      [
        [
          dappTokenContract.address,
          bancorNetwork,
          fastGasFeed,
          paymentPremiumPPB,
          stalenessSeconds,
          fallbackGasPrice,
          gasCeilingMultiplier,
          "0x939B462ee3311f8926c047D2B576C389092b1649",
          "0x33A23d447De16a8Ff802c9Fcc917465Df01A3977",
          "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C",
          "0xb1CD6e4153B2a390Cf00A6556b0fC1458C4A5533",
          "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
          100,
          1e6,
          "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          "0x5365B5BC56493F08A38E5Eb08E36cBbe6fcC8306"
        ]
      ]
    );
    
    console.log(`proxy address: ${nexusContract.address}\n nexus address: ${await upgrades.erc1967.getImplementationAddress(nexusContract.address)}`);
    
    await network.provider.send("hardhat_setBalance", [
      AWS_KMS_KEY,
      "0x80000000000000",
    ]);
  });

  it("Queue job kms", async function() {
    await nexusContract.approveImage("runner","90f68b2ae2d91b55528012e711f58333b2bf1040b190b6416f5e7f3c4f1ceb85");
    await nexusContract.approveImage("rust-compiler","a2abab32c09fbcf07daba4f0ed4798df0f3ffe6cece68a3a49152fa75a9832e3");
    
    const kmsCredentials = {
        accessKeyId: process.env.WORKER_AWS_KMS_ACCESS_KEY_ID || "AKIAxxxxxxxxxxxxxxxx", // credentials for your IAM user with KMS access
        secretAccessKey: process.env.WORKER_AWS_KMS_SECRET_ACCESS_KEY || "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", // credentials for your IAM user with KMS access
        region: process.env.WORKER_AWS_KMS_REGION || "ap-southeast-1",
        keyId: process.env.WORKER_AWS_KMS_KEY_ID || "arn:aws:kms:ap-southeast-1:123456789012:key/123a1234-1234-4111-a1ab-a1abc1a12b12",
    };
    
    const signer = new AwsKmsSigner(kmsCredentials);
    
    let unsignedTx = await nexusContract.populateTransaction.regWORKER("http://wasi-service");
    await signKms(unsignedTx, nexusContract, signer);
    unsignedTx = await nexusContract.populateTransaction.setDockerImage("runner",100000,100000,100000,100000,100,100);
    await signKms(unsignedTx, nexusContract, signer);
    unsignedTx = await nexusContract.populateTransaction.setDockerImage("rust-compiler",100000,100000,100000,100000,100,100);
    await signKms(unsignedTx, nexusContract, signer);
    
    await nexusContract.setWorkers([AWS_KMS_KEY]);
    
    console.log('workers',await nexusContract.providers(addr1.address,0))
    console.log('endpoint',await nexusContract.registeredWORKERs(AWS_KMS_KEY))
    
    const prevTotalDappGasPaid = await nexusContract.totalDappGasPaid();
    
    const dapps = ethers.utils.parseUnits("800000",4);
    await dappTokenContract.mint(addr1.address, dapps);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.buyGasFor(dapps, addr1.address, AWS_KMS_KEY);
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "rust-compiler",
      inputFS: loadfsRoot("pngWriterTest"),
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: []
    });
    
    console.log('queueJob done');
    
    const id1 = await nexusContract.lastJobID();

    const eventPromise = new Promise((resolve, reject) => {
        nexusContract.once("JobResult", (
            consumer, 
            worker, 
            outputFS, 
            outputHash,
            dapps,
            jobID
          ) => {
            resolve(outputFS);
          }
        );
    });

    await eventPromise.then(val => {
      outputFSRes = val;
    });

    console.log('queueJob2');
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "runner",
      inputFS: outputFSRes,
      // inputFS: "QmPDKw5a5THGW4PDKcddQ6r2Tq3uNwfyKmzX62ovC6dKqx",
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: ["target/wasm32-wasi/release/test"]
    });

    console.log('queueJob2 done');
    
    const id2 = await nexusContract.lastJobID();

    const job = await nexusContract.jobs(id1);

    expect(job.consumer).to.equal(addr1.address);
    expect(job.callback).to.equal(false);
    expect(job.resultsCount.toString()).to.equal('1');
    expect(job.imageName).to.equal("rust-compiler");

    const job2 = await nexusContract.jobs(id2);

    expect(job2.consumer).to.equal(addr1.address);
    expect(job2.callback).to.equal(false);
    expect(job2.resultsCount.toString()).to.equal('0');
    expect(job2.imageName).to.equal("runner");

    const postTotalDappGasPaid = await nexusContract.totalDappGasPaid();
    expect(postTotalDappGasPaid).is.above(prevTotalDappGasPaid);
  });
});
