const Web3 = require("web3");
const { expect } = require("chai");
const { network, ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const fetch =require('node-fetch');

let nexusAbi = require('../abi/contracts/Nexus.sol/Nexus.json')

const fs = require('fs');
const path = require('path');
const { hexValue } = require("ethers/lib/utils");

const bancorNetwork = "0x2F9EC37d6CcFFf1caB21733BdaDEdE11c823cCB0";
const fastGasFeed = "0x169e633a2d1e6c10dd91238ba11c4a708dfef37c";
const paymentPremiumPPB = 200000000;
const stalenessSeconds = 86400;
const fallbackGasPrice = 200000000000;
const gasCeilingMultiplier = 2;

const delay = s => new Promise(res => setTimeout(res, s * 1000));

let outputFSRes;
let jobId = 1;

function loadfsRoot(fsrootName){
  if(process.env.PRIVATE_KEY) {
    return fs.readFileSync(path.resolve('/services/orchestrator', `fsroots/${fsrootName}.ipfs`)).toString().trim();
  } else {
    return fs.readFileSync(path.resolve('../services/orchestrator', `fsroots/${fsrootName}.ipfs`)).toString().trim();
  }
}

describe("Nexus", function(done) {
  this.timeout(1000000);
  let owner, addr1, addr2, addr3, dsp1, dsp2, addrs;
  let dappTokenContract, nexusContract, consumerContract;

  before(async function() {
    [owner, addr1, addr2, addr3, dsp1, dsp2, ...addrs] = await ethers.getSigners();

    const dappTokenFactory = await ethers.getContractFactory("DappToken", addr1);
    const nexusTokenFactory = await ethers.getContractFactory("Nexus", addr1);
    const consumerTokenFactory = await ethers.getContractFactory("Consumer", addr2);

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
    
    consumerContract = await consumerTokenFactory.deploy(nexusContract.address, "hash");

    if(process.env.PRIVATE_KEY) {
      dsp1 = new ethers.Wallet(process.env.PRIVATE_KEY,dsp1.provider);
      // 10000 ETH
      await network.provider.send("hardhat_setBalance", [
        dsp1.address,
        "0x10000000000000000000000",
      ]);
      await network.provider.send("hardhat_setBalance", [
        "0x654Cf0636b0e85b3379BcD773672CA4B4AEf8Dc0",
        "0x10000000000000000000000",
      ]);
      await network.provider.send("hardhat_setBalance", [
        "0xE82f7108e68ceedCf48F17eDF2b9856F39464818",
        "0x10000000000000000000000",
      ]);
    }

    console.log(`nexus contract: ${nexusContract.address}`);

    console.log(`process.env.ONLY_CONTRACTS: ${process.env.ONLY_CONTRACTS} ${typeof(process.env.ONLY_CONTRACTS)}`);

    if(process.env.ONLY_CONTRACTS) {
      done()
    }
  });

  /*

    Todo tests
    - invalid hash
    - analyze / add double tries
    
  */

  it("Set get config", async function() {
    await nexusContract.setConfig(
      paymentPremiumPPB,
      gasCeilingMultiplier,
      fallbackGasPrice,
      stalenessSeconds
    );

    const config = await nexusContract.connect(dsp1).getConfig();

    expect(config.paymentPremiumPPB).to.equal(paymentPremiumPPB);
    expect(config.stalenessSeconds).to.equal(stalenessSeconds);
    expect(config.gasCeilingMultiplier).to.equal(gasCeilingMultiplier);
    expect(config.fallbackGasPrice.toString()).to.equal(fallbackGasPrice.toString());
  });

  it("Deprecate DSP", async function() {
    await nexusContract.connect(dsp1).deprecateDSP();

    const registeredDSPs = await nexusContract.registeredDSPs(dsp1.address);

    expect(registeredDSPs.active).to.equal(false);
    expect(registeredDSPs.endpoint).to.equal("deprecated");
  });

  it("Register DSP", async function() {
    await nexusContract.connect(dsp1).regDSP("http://wasi-service");

    const registeredDSPs = await nexusContract.registeredDSPs(dsp1.address);

    expect(registeredDSPs.active).to.equal(true);
    expect(registeredDSPs.endpoint).to.equal("http://wasi-service");
    expect(registeredDSPs.claimableDapp.toString()).to.equal('0');
  });

  it("Buy dapp gas", async function() {
    const dapps = ethers.utils.parseUnits("800000",4);
    await dappTokenContract.mint(addr1.address, dapps);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.buyGasFor(dapps, addr1.address, dsp1.address);

    const dspData = await nexusContract.dspData(addr1.address, dsp1.address);

    expect(dspData.amount).to.equal(dapps);
  });

  it("Sell dapp gas", async function() {
    const dapps = ethers.utils.parseUnits("100000",4);
    const dappsLeft = ethers.utils.parseUnits("700000",4);

    await nexusContract.sellGas(dapps, dsp1.address);

    const dspData = await nexusContract.dspData(addr1.address, dsp1.address);

    expect(dspData.amount.toString()).to.equal(dappsLeft);
  });

  it("Approve image", async function() {
    await nexusContract.approveImage("runner","hash");

    const hash = await nexusContract.approvedImages("runner");

    expect(hash).to.equal("hash");
  });

  it("Register image", async function() {
    await nexusContract.connect(dsp1).setDockerImage("runner",200000,200000,200000,200000,2,2);

    const dockerImage = await nexusContract.dspApprovedImages(dsp1.address,"runner");

    expect(dockerImage.jobFee.toString()).to.equal('200000');
    expect(dockerImage.baseFee.toString()).to.equal('200000');
    expect(dockerImage.storageFee.toString()).to.equal('200000');
    expect(dockerImage.ioFee.toString()).to.equal('200000');
    expect(dockerImage.minStorageMegaBytes.toString()).to.equal('2');
    expect(dockerImage.minIoMegaBytes.toString()).to.equal('2');
  });

  it("Update image", async function() {
    await nexusContract.connect(dsp1).updateDockerImage("runner",100000,100000,100000,100000,100,100);

    const dockerImage = await nexusContract.dspApprovedImages(dsp1.address,"runner");

    expect(dockerImage.jobFee.toString()).to.equal('100000');
    expect(dockerImage.baseFee.toString()).to.equal('100000');
    expect(dockerImage.storageFee.toString()).to.equal('100000');
    expect(dockerImage.ioFee.toString()).to.equal('100000');
    expect(dockerImage.minStorageMegaBytes.toString()).to.equal('100');
    expect(dockerImage.minIoMegaBytes.toString()).to.equal('100');
  });

  it("Set consumer", async function() {
    await nexusContract.connect(addr2).setConsumerContract(consumerContract.address);

    const authorizedContract = await nexusContract.contracts(addr2.address);

    expect(authorizedContract).to.equal(consumerContract.address);
  });

  it("Set dsps", async function() {
    await nexusContract.setDsps([dsp1.address]);

    const consumerData = await nexusContract.providers(addr1.address,0);

    expect(consumerData).to.equal(dsp1.address);
  });

  it("Queue job", async function() {
    await nexusContract.approveImage("rust-compiler","hash");
    await nexusContract.connect(dsp1).setDockerImage("rust-compiler",100000,100000,100000,100000,100,100);
    
    console.log('job start')
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "rust-compiler",
      inputFS: loadfsRoot("pngWriterTest"),
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: []
    });
    console.log('job end')

    const eventPromise = new Promise((resolve, reject) => {
        nexusContract.once("JobResult", (
            consumer, 
            dsp, 
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

    const job = await nexusContract.jobs(jobId++);

    expect(job.consumer).to.equal(addr1.address);
    expect(job.callback).to.equal(false);
    expect(job.resultsCount.toString()).to.equal('1');
    expect(job.imageName).to.equal("rust-compiler");

    const job2 = await nexusContract.jobs(jobId++);

    expect(job2.consumer).to.equal(addr1.address);
    expect(job2.callback).to.equal(false);
    expect(job2.resultsCount.toString()).to.equal('0');
    expect(job2.imageName).to.equal("runner");
  });

  it("Queue job with callback", async function() {
    const dapps = ethers.utils.parseUnits("250000",4);
    await dappTokenContract.mint(addr2.address, dapps);
    await dappTokenContract.connect(addr2).approve(nexusContract.address, dapps);
    await nexusContract.connect(addr2).buyGasFor(dapps, consumerContract.address, dsp1.address);
    await nexusContract.connect(addr2).setDsps([dsp1.address]);

    await consumerContract.queueJob(addr2.address, loadfsRoot("pngWriterTest"));

    const job = await nexusContract.jobs(jobId++);

    expect(job.consumer).to.equal(consumerContract.address);
    expect(job.callback).to.equal(true);
    expect(job.resultsCount.toString()).to.equal('0');
    expect(job.imageName).to.equal("rust-compiler");
    
    const eventPromise = new Promise((resolve, reject) => {
        consumerContract.once("UpdatedHash", (
            newHash
          ) => {
            resolve(newHash);
          }
        );
    });

    await eventPromise.then(val => {
      expect(val).to.equal("QmPDKw5a5THGW4PDKcddQ6r2Tq3uNwfyKmzX62ovC6dKqx");
    });

    const lastHash = await consumerContract.lastHash();

    expect(lastHash).to.equal("QmPDKw5a5THGW4PDKcddQ6r2Tq3uNwfyKmzX62ovC6dKqx");
  });

  it("Queue service - try below min bytes", async function() {
    await nexusContract.approveImage("wasi-service","hash");
    await nexusContract.connect(dsp1).setDockerImage("wasi-service",100000,100000,100000,100000,1,1);

    let failed = false;
    try {
      await nexusContract.queueService({
        owner: addr1.address,
        imageName: "wasi-service",
        ioMegaBytes: 0,
        storageMegaBytes: 0,
        inputFS: "",
        args: ["target/wasm32-wasi/release/test"],
        months: 1
      });
    } catch(e) {
      failed = true;
    }

    expect(failed).to.equal(true);
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "rust-compiler",
      inputFS: loadfsRoot("serviceTest"),
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: []
    });

    jobId++;
    
    const JobPromise = new Promise((resolve, reject) => {
        nexusContract.once("JobResult", (
            consumer, 
            dsp, 
            outputFS, 
            outputHash,
            dapps,
            jobID
          ) => {
            resolve(outputFS);
          }
        );
    });

    await JobPromise.then(val => {
      outputFSRes = val;
    });

    await nexusContract.queueService({
      owner: addr1.address,
      imageName: "wasi-service",
      ioMegaBytes: 100,
      storageMegaBytes: 100,
      inputFS: outputFSRes,
      // inputFS: "QmPDKw5a5THGW4PDKcddQ6r2Tq3uNwfyKmzX62ovC6dKqx",
      args: ["target/wasm32-wasi/release/test"],
      months: 1
    });

    const service = await nexusContract.services(jobId);

    expect(service.consumer).to.equal(addr1.address);
    expect(service.imageName).to.equal("wasi-service");
    
    const servicePromise = new Promise((resolve, reject) => {
        nexusContract.once("ServiceRunning", (
            consumer, 
            dsp, 
            serviceId, 
            port
          ) => {
            resolve();
          }
        );
    });

    await servicePromise.then();
    
    let id = jobId++

    const port = await nexusContract.getPortForDSP(id,dsp1.address);

    expect(port).to.equal(9000);

    const endpoint = await nexusContract.getDSPEndpoint(dsp1.address);

    expect(endpoint).to.equal(`${endpoint}`);
    
    // console.log(`endpoint1: ${endpoint}-${id}:${port}`,id);
    
    await delay(20);

    const response = await fetch(`${endpoint}-${id}:${port}`, {method: 'GET'});
    const body = await response.text();

    expect(body).to.equal("foo");
  });

  it("Min job balance", async function() {
    const min = await nexusContract.getMinBalance(2,"job",dsp1.address);

    // console.log(min.toString());
    // 76,349.8769 * 0.00730 $/DAPP = $557.35
    
    expect(min).is.above(400000000);
  });

  it("Min job balance with callback", async function() {
    const min = await nexusContract.getMinBalance(3,"job",dsp1.address);

    // console.log(min.toString());
    // 76,349.8769 * 0.00730 $/DAPP = $557.35
    
    expect(min).is.above(400000000);
  });

  it("Min service balance", async function() {
    const min = await nexusContract.getMinBalance(5,"service",dsp1.address);

    // console.log(min.toString());
    // 9,315.0201 * 0.00730 $/DAPP = $68.00

    expect(min).is.above(50000000);
  });

  it("Set dsps", async function() {
    await nexusContract.connect(dsp2).regDSP("endpoint");

    const dapps = ethers.utils.parseUnits("800000",4);
    await dappTokenContract.mint(addr1.address, dapps);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.buyGasFor(dapps, addr1.address, dsp2.address);

    await nexusContract.setDsps([dsp1.address,dsp2.address]);

    const dsps = await nexusContract.getDspAddresses();

    expect(JSON.stringify(dsps)).to.equal(JSON.stringify([dsp1.address,dsp2.address]));
    
    await nexusContract.setDsps([dsp1.address]);
    await nexusContract.connect(dsp2).deprecateDSP();
  });

  it("Run is job complete", async function() {
    const isCocmplete1 = await nexusContract.jobServiceCompleted(1,dsp1.address,true);
    const isCocmplete2 = await nexusContract.jobServiceCompleted(2,dsp1.address,true);

    expect(isCocmplete1).to.equal(true);
    expect(isCocmplete2).to.equal(true);
  });

  it("Try double run service", async function() {let failed = false;
    try {
      await nexusContract.connect(dsp1).serviceCallback(5,9000);
    } catch(e) {
      failed = true;
    }

    expect(failed).to.equal(true);
  });
  
  it("Run job - error", async function() {
    const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "runner",
      inputFS: "", // no input error
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: ["target/wasm32-wasi/release/test"]
    });
    
    const id = await nexusContract.lastJobID();
    
    const completePromise = new Promise((resolve, reject) => {
        nexusContract.on("JobError", (
            consumer,
            stdErr, 
            outputFS, 
            jobID
          ) => {
            if(Number(id) == Number(jobID)) {
              console.log('hit job error')
              resolve();
            }
          }
        );
    });
    
    await completePromise.then();

    const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
    // ensure get base payment for job
    expect(postDspBal).is.above(preDspBal);
    
    const isCocmplete1 = await nexusContract.jobServiceCompleted(id,dsp1.address,true);

    expect(isCocmplete1).to.equal(true);
  });

  it("Run service - error", async function() {
    const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

    await nexusContract.queueService({
      owner: addr1.address,
      imageName: "wasi-service",
      ioMegaBytes: 100,
      storageMegaBytes: 100,
      inputFS: "",
      args: ["target/wasm32-wasi/release/test"],
      months: 1
    });
    
    const id = await nexusContract.lastJobID();
    
    const completePromise = new Promise((resolve, reject) => {
        nexusContract.on("ServiceError", (
            consumer,
            dsp,
            stdErr, 
            outputFS, 
            jobID
          ) => {
            if(Number(id) == Number(jobID)) {
              console.log('hit job error')
              expect(stdErr).to.equal("error dispatching");
              resolve();
            }
          }
        );
    });
    
    await completePromise.then();

    const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
    // ensure get base payment for job
    expect(postDspBal).is.above(preDspBal);
    
    const isCocmplete1 = await nexusContract.jobServiceCompleted(id,dsp1.address,false);

    expect(isCocmplete1).to.equal(true);
  });

  it("Extend service", async function() {
    const preDspEnDate = (await nexusContract.services(5)).endDate;
    const preDspIoLimit = (await nexusContract.getDSPDataLimits(5,dsp1.address)).ioMegaBytesLimit;
    const preDspStorageLimit = (await nexusContract.getDSPDataLimits(5,dsp1.address)).storageMegaBytesLimit;

    const dapps = ethers.utils.parseUnits("200000",4);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.extendService(
      5,
      "wasi-service",
      1,
      100,
      100
    );

    const postDspEnDate = (await nexusContract.services(5)).endDate;
    const postDspIoLimit = (await nexusContract.getDSPDataLimits(5,dsp1.address)).ioMegaBytesLimit;
    const postDspStorageLimit = (await nexusContract.getDSPDataLimits(5,dsp1.address)).storageMegaBytesLimit;
    
    expect(postDspEnDate).is.above(preDspEnDate);
    expect(postDspIoLimit).is.above(preDspIoLimit);
    expect(postDspStorageLimit).is.above(preDspStorageLimit);
  });

  it("Extend service same month", async function() {
    const preDspEnDate = (await nexusContract.services(5)).endDate;
    const preDspIoLimit = (await nexusContract.getDSPDataLimits(5,dsp1.address)).ioMegaBytesLimit;
    const preDspStorageLimit = (await nexusContract.getDSPDataLimits(5,dsp1.address)).storageMegaBytesLimit;

    const dapps = ethers.utils.parseUnits("200000",4);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.extendService(
      5,
      "wasi-service",
      0,
      1,
      1
    );

    const postDspEnDate = (await nexusContract.services(5)).endDate;
    const postDspIoLimit = (await nexusContract.getDSPDataLimits(5,dsp1.address)).ioMegaBytesLimit;
    const postDspStorageLimit = (await nexusContract.getDSPDataLimits(5,dsp1.address)).storageMegaBytesLimit;
    
    expect(postDspEnDate).to.equal(preDspEnDate);
    expect(postDspIoLimit).is.above(preDspIoLimit);
    expect(postDspStorageLimit).is.above(preDspStorageLimit);
  });

  it("Get get max payment for gas", async function() {
    const data = await nexusContract.getMaxPaymentForGas("1000000","runner",dsp1.address);
    
    expect(data).is.above(100000000);
  });

  it("Run service - io/storage limit", async function() {
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "rust-compiler",
      inputFS: loadfsRoot("serviceTest"),
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: []
    });
    
    const JobPromise = new Promise((resolve, reject) => {
        nexusContract.once("JobResult", (
            consumer, 
            dsp, 
            outputFS, 
            outputHash,
            dapps,
            jobID
          ) => {
            resolve(outputFS);
          }
        );
    });

    await JobPromise.then(val => {
      outputFSRes = val;
    });

    await nexusContract.queueService({
      owner: addr1.address,
      imageName: "wasi-service",
      ioMegaBytes: 1,
      storageMegaBytes: 1,
      inputFS: outputFSRes,
      args: ["target/wasm32-wasi/release/test"],
      months: 1
    });
    
    const id = await nexusContract.lastJobID();
    
    console.log('id', id);
    
    const servicePromise = new Promise((resolve, reject) => {
        nexusContract.once("ServiceRunning", (
            consumer, 
            dsp, 
            serviceId, 
            port
          ) => {
            if(Number(id) == Number(serviceId)) {
              resolve();
            }
          }
        );
    });
    
    await servicePromise.then();
    
    console.log('ServiceRunning id', id);
    
    console.log('service error...')
    
    const completePromise = new Promise((resolve, reject) => {
        nexusContract.on("ServiceError", (
            consumer,
            dsp, 
            stdErr,
            outputFS, 
            jobID
          ) => {
            console.log(`Service Error Ids:`,jobID,id,stdErr);
            if(Number(id) == Number(jobID)) {
              expect(stdErr).to.equal("io/storage resource limit reached");
              resolve();
            }
          }
        );
    });

    await completePromise.then();
    
    console.log('service error done')
    
    const isCocmplete = await nexusContract.jobServiceCompleted(id,dsp1.address,false);
    
    expect(isCocmplete).to.equal(true);
  });

  it("Run service - complete", async function() {
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "rust-compiler",
      inputFS: loadfsRoot("serviceTest"),
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: []
    });

    jobId++;
    
    const JobPromise = new Promise((resolve, reject) => {
        nexusContract.once("JobResult", (
            consumer, 
            dsp, 
            outputFS, 
            outputHash,
            dapps,
            jobID
          ) => {
            resolve(outputFS);
          }
        );
    });

    await JobPromise.then(val => {
      outputFSRes = val;
    });
    
    const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

    await nexusContract.queueService({
      owner: addr1.address,
      imageName: "wasi-service",
      ioMegaBytes: 100,
      storageMegaBytes: 100,
      inputFS: outputFSRes,
      args: ["target/wasm32-wasi/release/test"],
      months: 1
    });
    
    let id;
    
    const servicePromise = new Promise((resolve, reject) => {
        nexusContract.once("ServiceRunning", (
            consumer, 
            dsp, 
            serviceId, 
            port
          ) => {
            id = serviceId;
            resolve();
          }
        );
    });
    
    await servicePromise.then();

    let failed = false;
    try {
      await nexusContract.connect(dsp1).serviceComplete({
        jobID: id,
        outputFS: "",
        ioMegaBytesUsed: 100,
        storageMegaBytesUsed: 100
      });
    } catch(e) {
      failed = true;
    }

    expect(failed).to.equal(true);
    
    const timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
    await ethers.provider.send("evm_mine", [ timestamp + (30 * 1000 * 10 * 10 * 10) ]);
    
    const completePromise = new Promise((resolve, reject) => {
        nexusContract.on("ServiceComplete", (
            consumer,
            dsp, 
            outputFS, 
            jobID
          ) => {
            if(Number(id) == Number(jobID)) {
              id = jobID;
              resolve();
            }
          }
        );
    });

    await completePromise.then();

    const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
    expect(postDspBal).is.above(preDspBal);

    const port = await nexusContract.getPortForDSP(id,dsp1.address);

    const endpoint = await nexusContract.getDSPEndpoint(dsp1.address);

    failed = false;
    try {
      await fetch(`${endpoint}-${id}:${port}`, {method: 'GET'});
    } catch(e) {
      failed = true;
    }

    expect(failed).to.equal(true);
    
    const isCocmplete = await nexusContract.jobServiceCompleted(id,dsp1.address,false);
    
    expect(isCocmplete).to.equal(true);
  });

  // test relies on above increase time to assume the feed is stale
  it.skip("Get get max payment for gas with fallback time", async function() {
    const data = await nexusContract.getMaxPaymentForGas("1000000","runner",dsp1.address);
    
    expect(data).is.above(100000000);
  });

  it("Claim dsp dapp", async function() {
    const preDspBal = await dappTokenContract.balanceOf(dsp1.address);

    await nexusContract.connect(dsp1).claim();

    const postDspBal = await dappTokenContract.balanceOf(dsp1.address);
    
    expect(postDspBal).is.above(preDspBal);
  });

  it("Get image approved for dsp", async function() {
    const approved = await nexusContract.isImageApprovedForDSP(dsp1.address,"runner");
    
    expect(approved).to.equal(true);
  });

  it("Unapprove image for dsp", async function() {
    await nexusContract.connect(dsp1).unapproveDockerForDSP("runner");

    const approved = await nexusContract.isImageApprovedForDSP(dsp1.address,"runner");
    
    expect(approved).to.equal(false);
  });

  it("Get dsp port", async function() {
    const port = await nexusContract.getPortForDSP(5,dsp1.address);

    expect(port).to.equal(9000);
  });

  it("Get dsp endpoint", async function() {
    const endpoint = await nexusContract.getDSPEndpoint(dsp1.address);

    expect(endpoint).to.equal("http://wasi-service");
  });

  it("Get dsp list", async function() {
    const dsps = await nexusContract.getDspAddresses();

    const expectedResult = [ dsp1.address,dsp2.address ];

    expect(JSON.stringify(dsps)).to.equal(JSON.stringify(expectedResult));
  });

  it("Get dsp data", async function() {
    const dsps = await nexusContract.getDspAddresses();

    let dspData = [];
    for(let i=0; i<dsps.length; i++) {
      dspData.push(await nexusContract.registeredDSPs(dsps[i]));
    }

    expect(dspData[0].endpoint).to.equal('http://wasi-service');
  });
});
