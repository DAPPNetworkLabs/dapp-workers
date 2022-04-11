const Web3 = require("web3");
const { expect } = require("chai");
const { network, ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const fetch =require('node-fetch');

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

function loadfsRoot(fsrootName){
  if(process.env.PRIVATE_KEY) {
    return fs.readFileSync(path.resolve('/services/orchestrator', `fsroots/${fsrootName}.ipfs`)).toString().trim();
  } else {
    return fs.readFileSync(path.resolve('../services/orchestrator', `fsroots/${fsrootName}.ipfs`)).toString().trim();
  }
}

describe("Nexus", function(done) {
  this.timeout(1000000);
  let owner, addr1, addr2, addr3, worker1, worker2, addrs, consumer1, consumer2, consumer3;
  let dappTokenContract, nexusContract, consumerContract;

  before(async function() {
    [owner, addr1, addr2, addr3, worker1, worker2, ...addrs] = await ethers.getSigners();

    const dappTokenFactory = await ethers.getContractFactory("DappToken", addr1);
    console.log(addr1.address);
    console.log(addr2.address);
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
      worker1 = new ethers.Wallet("278c2ff8b0fa8bbe04c430a66c828f8b2386a0e9c075b8923d257c3be30c697d",worker1.provider);
      consumer1 = new ethers.Wallet("0xc327bdb598a257632f48e4368ebe7be66a40daff34569c2f2ba36ee96e893674",worker1.provider);
      consumer2 = new ethers.Wallet("0xa62d3d80840579bf62183c2c3ad2344aebeccec44b1ba719aa06f39ab47d7d5c",worker1.provider);
      consumer3 = new ethers.Wallet("0x2aab7d1aeca546199474f49fea602c644b96b87654a8aa834b2bf9b110bd8939",worker1.provider);
      // 0xa62d3d80840579bf62183c2c3ad2344aebeccec44b1ba719aa06f39ab47d7d5c
      // 0x2aab7d1aeca546199474f49fea602c644b96b87654a8aa834b2bf9b110bd8939
      // 10000 ETH
      let dapps = ethers.utils.parseUnits("80000000000",4);
      await dappTokenContract.mint("0x21dfA04241ca05320E9dCd529F15f6F55115bbC3", dapps);
      await dappTokenContract.connect(consumer1).approve(nexusContract.address, dapps);
      await dappTokenContract.mint("0x845a35dCC68A249243Cb08E16cE0889f9CbA4d67", dapps);
      await dappTokenContract.connect(consumer2).approve(nexusContract.address, dapps);
      await dappTokenContract.mint("0x6a313c74e27CB90F4D78C232f9690736b84C880c", dapps);
      await dappTokenContract.connect(consumer3).approve(nexusContract.address, dapps);

      // preload frontend
      if(process.env.RUN_LOCAL) {
        await nexusContract.approveImage("runner","90f68b2ae2d91b55528012e711f58333b2bf1040b190b6416f5e7f3c4f1ceb85");
        await nexusContract.approveImage("rust-compiler","a2abab32c09fbcf07daba4f0ed4798df0f3ffe6cece68a3a49152fa75a9832e3");
        await nexusContract.approveImage("wasi-service","8ada822a2c5d872c904d4def217387dc63400602a44862bb4102507a0e6c5498");
        await nexusContract.connect(worker1).regWORKER(process.env.WORKER_ENDPONIT || "http://localhost");
        await nexusContract.setWorkers([worker1.address]);
        dapps = ethers.utils.parseUnits("80000000",4);
        await dappTokenContract.mint(addr1.address, dapps);
        await dappTokenContract.approve(nexusContract.address, dapps);
        await nexusContract.buyGasFor(dapps, addr1.address, worker1.address);
        await nexusContract.connect(worker1).setDockerImage("runner",100000,100000,100000,100000,1,1);
        await nexusContract.connect(worker1).setDockerImage("rust-compiler",100000,100000,100000,100000,1,1);
        await nexusContract.connect(worker1).setDockerImage("wasi-service",100000,100000,100000,100000,1,1);
        await dappTokenContract.approve(nexusContract.address, ethers.utils.parseUnits("80000000",4));
      }
    }

    console.log(`nexus contract: ${nexusContract.address}`);
    console.log(`dapp contract: ${dappTokenContract.address}`);
    console.log(`consumer contract: ${consumerContract.address}`);

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

    const config = await nexusContract.connect(worker1).getConfig();

    expect(config.paymentPremiumPPB).to.equal(paymentPremiumPPB);
    expect(config.stalenessSeconds).to.equal(stalenessSeconds);
    expect(config.gasCeilingMultiplier).to.equal(gasCeilingMultiplier);
    expect(config.fallbackGasPrice.toString()).to.equal(fallbackGasPrice.toString());
  });

  it("Deprecate WORKER", async function() {
    await nexusContract.connect(worker1).deprecateWORKER();

    const registeredWORKERs = await nexusContract.registeredWORKERs(worker1.address);

    expect(registeredWORKERs.active).to.equal(false);
    expect(registeredWORKERs.endpoint).to.equal("deprecated");
  });

  it("Register WORKER", async function() {
    await nexusContract.connect(worker1).regWORKER("http://wasi-service");

    const registeredWORKERs = await nexusContract.registeredWORKERs(worker1.address);

    expect(registeredWORKERs.active).to.equal(true);
    expect(registeredWORKERs.endpoint).to.equal("http://wasi-service");
    expect(registeredWORKERs.claimableDapp.toString()).to.equal('0');
  });

  it("Buy dapp gas", async function() {
    const dapps = ethers.utils.parseUnits("800000",4);
    await dappTokenContract.mint(addr1.address, dapps);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.buyGasFor(dapps, addr1.address, worker1.address);

    const workerData = await nexusContract.workerData(addr1.address, worker1.address);

    expect(workerData.amount).to.equal(dapps);
  });

  it("Sell dapp gas", async function() {
    const dapps = ethers.utils.parseUnits("100000",4);
    const dappsLeft = ethers.utils.parseUnits("700000",4);

    await nexusContract.sellGas(dapps, worker1.address);

    const workerData = await nexusContract.workerData(addr1.address, worker1.address);

    expect(workerData.amount.toString()).to.equal(dappsLeft);
  });

  it("Approve image", async function() {
    await nexusContract.approveImage("runner","90f68b2ae2d91b55528012e711f58333b2bf1040b190b6416f5e7f3c4f1ceb85");

    const hash = await nexusContract.approvedImages("runner");

    expect(hash).to.equal("90f68b2ae2d91b55528012e711f58333b2bf1040b190b6416f5e7f3c4f1ceb85");
  });

  it("Register image", async function() {
    await nexusContract.connect(worker1).setDockerImage("runner",200000,200000,200000,200000,2,2);

    const dockerImage = await nexusContract.workerApprovedImages(worker1.address,"runner");

    expect(dockerImage.jobFee.toString()).to.equal('200000');
    expect(dockerImage.baseFee.toString()).to.equal('200000');
    expect(dockerImage.storageFee.toString()).to.equal('200000');
    expect(dockerImage.ioFee.toString()).to.equal('200000');
    expect(dockerImage.minStorageMegaBytes.toString()).to.equal('2');
    expect(dockerImage.minIoMegaBytes.toString()).to.equal('2');
  });

  it("Update image", async function() {
    await nexusContract.connect(worker1).updateDockerImage("runner",100000,100000,100000,100000,100,100);

    const dockerImage = await nexusContract.workerApprovedImages(worker1.address,"runner");

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

  it("Set workers", async function() {
    await nexusContract.setWorkers([worker1.address]);

    const consumerData = await nexusContract.providers(addr1.address,0);

    expect(consumerData).to.equal(worker1.address);
  });

  it("Queue job", async function() {
    const prevTotalDappGasPaid = await nexusContract.totalDappGasPaid();
    await nexusContract.approveImage("rust-compiler","a2abab32c09fbcf07daba4f0ed4798df0f3ffe6cece68a3a49152fa75a9832e3");
    await nexusContract.connect(worker1).setDockerImage("rust-compiler",100000,100000,100000,100000,100,100);
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "rust-compiler",
      inputFS: loadfsRoot("pngWriterTest"),
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: []
    });
    
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

  it.skip("Queue job hash mismatch", async function() {
    await nexusContract.unapproveImage("rust-compiler","a2abab32c09fbcf07daba4f0ed4798df0f3ffe6cece68a3a49152fa75a9832e3");
    await nexusContract.approveImage("rust-compiler","hash");
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "rust-compiler",
      inputFS: loadfsRoot("pngWriterTest"),
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: []
    });
    
    const id1 = await nexusContract.lastJobID();

    let error;
    
    const completePromise = new Promise((resolve, reject) => {
        nexusContract.on("JobError", (
            consumer,
            stdErr, 
            outputFS, 
            id
          ) => {
            if(Number(id) == Number(id1)) {
              error = stdErr
              resolve();
            }
          }
        );
    });
    
    await completePromise.then();

    await nexusContract.unapproveImage("rust-compiler","hash");
    await nexusContract.approveImage("rust-compiler","a2abab32c09fbcf07daba4f0ed4798df0f3ffe6cece68a3a49152fa75a9832e3");

    expect(error).to.equal("chain hash mismatch");
  });

  it("Queue job with callback", async function() {
    const dapps = ethers.utils.parseUnits("250000",4);
    await dappTokenContract.mint(addr2.address, dapps);
    await dappTokenContract.connect(addr2).approve(nexusContract.address, dapps);
    await nexusContract.connect(addr2).buyGasFor(dapps, consumerContract.address, worker1.address);
    await nexusContract.connect(addr2).setWorkers([worker1.address]);

    await consumerContract.queueJob(addr2.address, loadfsRoot("pngWriterTest"));

    const id1 = await nexusContract.lastJobID();
    const job = await nexusContract.jobs(id1);

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
    await nexusContract.approveImage("wasi-service","8ada822a2c5d872c904d4def217387dc63400602a44862bb4102507a0e6c5498");
    await nexusContract.connect(worker1).setDockerImage("wasi-service",100000,100000,100000,100000,1,1);

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
    
    const JobPromise = new Promise((resolve, reject) => {
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
    
    const id1 = await nexusContract.lastJobID();

    const service = await nexusContract.services(id1);

    expect(service.consumer).to.equal(addr1.address);
    expect(service.imageName).to.equal("wasi-service");
    
    const servicePromise = new Promise((resolve, reject) => {
        nexusContract.once("ServiceRunning", (
            consumer, 
            worker, 
            serviceId, 
            port
          ) => {
            resolve();
          }
        );
    });

    await servicePromise.then();
    
    const port = await nexusContract.getPortForWORKER(id1,worker1.address);

    expect(port).to.equal(9000);

    const endpoint = await nexusContract.getWORKEREndpoint(worker1.address);

    expect(endpoint).to.equal(`${endpoint}`);
    
    await delay(20);

    const response = await fetch(`${endpoint}-${id1}:${port}`, {method: 'GET'});
    const body = await response.text();

    expect(body).to.equal("foo");
  });

  it("Queue service with callback", async function() {
    const dapps = ethers.utils.parseUnits("250000",4);
    await dappTokenContract.mint(addr2.address, dapps);
    await dappTokenContract.connect(addr2).approve(nexusContract.address, dapps);
    await nexusContract.connect(addr2).buyGasFor(dapps, consumerContract.address, worker1.address);
    await nexusContract.connect(addr2).setWorkers([worker1.address]);

    await consumerContract.queueService(addr2.address, "QmQSv2U14iRKDqBvJgJo1eixJWq6cTqRgY9QgAnBUe9fdM");
    
    const servicePromise = new Promise((resolve, reject) => {
        nexusContract.once("ServiceRunning", (
            consumer, 
            worker, 
            serviceId, 
            port
          ) => {
            resolve();
          }
        );
    });

    await servicePromise.then();
    
    const id1 = await nexusContract.lastJobID();

    const port = await nexusContract.getPortForWORKER(id1,worker1.address);

    expect(port).to.equal(9001);

    const endpoint = await nexusContract.getWORKEREndpoint(worker1.address);

    expect(endpoint).to.equal(`${endpoint}`);
    
    console.log(`endpoint1: ${endpoint}-${id1}:${port}`,id1);
    
    await delay(20);

    const response = await fetch(`${endpoint}-${id1}:${port}`, {method: 'GET'});
    const body = await response.text();

    expect(body).to.equal("foo");
  });

  it("Min job balance", async function() {
    const min = await nexusContract.getMinBalance(2,"job",worker1.address);

    // console.log(min.toString());
    // 76,349.8769 * 0.00730 $/DAPP = $557.35
    
    expect(min).is.above(200000000);
  });

  it("Min job balance with callback", async function() {
    const min = await nexusContract.getMinBalance(3,"job",worker1.address);

    // console.log(min.toString());
    // 76,349.8769 * 0.00730 $/DAPP = $557.35
    
    expect(min).is.above(200000000);
  });

  it("Min service balance", async function() {
    const min = await nexusContract.getMinBalance(6,"service",worker1.address);

    // console.log(min.toString());
    // 9,315.0201 * 0.00730 $/DAPP = $68.00

    expect(min).is.above(50000000);
  });

  it("Set workers", async function() {
    await nexusContract.connect(worker2).regWORKER("endpoint");

    const dapps = ethers.utils.parseUnits("800000",4);
    await dappTokenContract.mint(addr1.address, dapps);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.buyGasFor(dapps, addr1.address, worker2.address);

    await nexusContract.setWorkers([worker1.address,worker2.address]);

    const workers = await nexusContract.getWorkerAddresses();

    expect(JSON.stringify(workers)).to.equal(JSON.stringify([worker1.address,worker2.address]));
    
    await nexusContract.setWorkers([worker1.address]);
    await nexusContract.connect(worker2).deprecateWORKER();
  });

  it("Run is job complete", async function() {
    const isCocmplete1 = await nexusContract.jobServiceCompleted(1,worker1.address,true);
    const isCocmplete2 = await nexusContract.jobServiceCompleted(2,worker1.address,true);

    expect(isCocmplete1).to.equal(true);
    expect(isCocmplete2).to.equal(true);
  });

  it("Try double run service", async function() {let failed = false;
    try {
      await nexusContract.connect(worker1).serviceCallback(5,9000);
    } catch(e) {
      failed = true;
    }

    expect(failed).to.equal(true);
  });
  
  it("Run job - error", async function() {
    const preWorkerBal = (await nexusContract.registeredWORKERs(worker1.address)).claimableDapp;

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

    const postWorkerBal = (await nexusContract.registeredWORKERs(worker1.address)).claimableDapp;
    
    // ensure get base payment for job
    expect(postWorkerBal).is.above(preWorkerBal);
    
    const isCocmplete1 = await nexusContract.jobServiceCompleted(id,worker1.address,true);

    expect(isCocmplete1).to.equal(true);
  });

  it("Run service - error", async function() {
    const preWorkerBal = (await nexusContract.registeredWORKERs(worker1.address)).claimableDapp;

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
            worker,
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

    const postWorkerBal = (await nexusContract.registeredWORKERs(worker1.address)).claimableDapp;
    
    // ensure get base payment for job
    expect(postWorkerBal).is.above(preWorkerBal);
    
    const isCocmplete1 = await nexusContract.jobServiceCompleted(id,worker1.address,false);

    expect(isCocmplete1).to.equal(true);
  });

  it("Extend service", async function() {
    const preWorkerEnDate = (await nexusContract.services(6)).endDate;
    const preWorkerIoLimit = (await nexusContract.getWORKERDataLimits(6,worker1.address)).ioMegaBytesLimit;
    const preWorkerStorageLimit = (await nexusContract.getWORKERDataLimits(6,worker1.address)).storageMegaBytesLimit;

    const dapps = ethers.utils.parseUnits("200000",4);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.extendService(
      6,
      "wasi-service",
      1,
      100,
      100
    );

    const postWorkerEnDate = (await nexusContract.services(6)).endDate;
    const postWorkerIoLimit = (await nexusContract.getWORKERDataLimits(6,worker1.address)).ioMegaBytesLimit;
    const postWorkerStorageLimit = (await nexusContract.getWORKERDataLimits(6,worker1.address)).storageMegaBytesLimit;
    
    expect(postWorkerEnDate).is.above(preWorkerEnDate);
    expect(postWorkerIoLimit).is.above(preWorkerIoLimit);
    expect(postWorkerStorageLimit).is.above(preWorkerStorageLimit);
  });

  it("Extend service same month", async function() {
    const preWorkerEnDate = (await nexusContract.services(6)).endDate;
    const preWorkerIoLimit = (await nexusContract.getWORKERDataLimits(6,worker1.address)).ioMegaBytesLimit;
    const preWorkerStorageLimit = (await nexusContract.getWORKERDataLimits(6,worker1.address)).storageMegaBytesLimit;

    const dapps = ethers.utils.parseUnits("200000",4);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.extendService(
      6,
      "wasi-service",
      0,
      1,
      1
    );

    const postWorkerEnDate = (await nexusContract.services(6)).endDate;
    const postWorkerIoLimit = (await nexusContract.getWORKERDataLimits(6,worker1.address)).ioMegaBytesLimit;
    const postWorkerStorageLimit = (await nexusContract.getWORKERDataLimits(6,worker1.address)).storageMegaBytesLimit;
    
    expect(postWorkerEnDate).to.equal(preWorkerEnDate);
    expect(postWorkerIoLimit).is.above(preWorkerIoLimit);
    expect(postWorkerStorageLimit).is.above(preWorkerStorageLimit);
  });

  it("Get get max payment for gas", async function() {
    const data = await nexusContract.getMaxPaymentForGas("1000000","runner",worker1.address);
    
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
            worker, 
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
            worker, 
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
    
    const isCocmplete = await nexusContract.jobServiceCompleted(id,worker1.address,false);
    
    expect(isCocmplete).to.equal(true);
  });

  it("Queue job git-cloner", async function() {
    await nexusContract.approveImage("git-cloner","a2abab32c09fbcf07daba4f0ed4798df0f3ffe6cece68a3a49152fa75a9832e3");
    await nexusContract.connect(worker1).setDockerImage("git-cloner",100000,100000,100000,100000,100,100);
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "git-cloner",
      inputFS: loadfsRoot("liquidityMining"),
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: []
    });

    const eventPromise = new Promise((resolve, reject) => {
        nexusContract.once("JobResult", (
            consumer, 
            worker, 
            outputFS, 
            outputHash,
            dapps,
            jobID
          ) => {
            console.log('jobID',jobID)
            resolve(outputFS);
          }
        );
    });

    await eventPromise.then(val => {
      outputFSRes = val;
    });

    const id = await nexusContract.lastJobID();
    const job = await nexusContract.jobs(id);

    expect(job.consumer).to.equal(addr1.address);
    expect(job.callback).to.equal(false);
    expect(job.resultsCount.toString()).to.equal('1');
    expect(job.imageName).to.equal("git-cloner");
    expect(outputFSRes).to.equal("QmPTULeqLCtTnwStXg1dyPpQTc27TZtr13oc9VjGiTxSXY");
  });

  it.skip("Queue job solidity-runner", async function() {
    await nexusContract.approveImage("solidity-runner","a2abab32c09fbcf07daba4f0ed4798df0f3ffe6cece68a3a49152fa75a9832e3");
    await nexusContract.connect(worker1).setDockerImage("solidity-runner",100000,100000,100000,100000,100,100);
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "solidity-runner",
      inputFS: "QmPTULeqLCtTnwStXg1dyPpQTc27TZtr13oc9VjGiTxSXY",
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: ["bancor-liquidity-mining"]
    });

    const eventPromise = new Promise((resolve, reject) => {
        nexusContract.once("JobResult", (
            consumer, 
            worker, 
            outputFS, 
            outputHash,
            dapps,
            jobID
          ) => {
            console.log('jobID',jobID)
            resolve(outputFS);
          }
        );
    });

    await eventPromise.then(val => {
      outputFSRes = val;
    });

    const id = await nexusContract.lastJobID();
    const job = await nexusContract.jobs(id);

    expect(job.consumer).to.equal(addr1.address);
    expect(job.callback).to.equal(false);
    expect(job.resultsCount.toString()).to.equal('1');
    expect(job.imageName).to.equal("solidity-runner");
    expect(outputFSRes).to.equal("QmPTULeqLCtTnwStXg1dyPpQTc27TZtr13oc9VjGiTxSXY");
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
    
    const JobPromise = new Promise((resolve, reject) => {
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

    await JobPromise.then(val => {
      outputFSRes = val;
    });
    
    const preWorkerBal = (await nexusContract.registeredWORKERs(worker1.address)).claimableDapp;

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
            worker, 
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
      await nexusContract.connect(worker1).serviceComplete({
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
            worker, 
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

    const postWorkerBal = (await nexusContract.registeredWORKERs(worker1.address)).claimableDapp;
    
    expect(postWorkerBal).is.above(preWorkerBal);

    const port = await nexusContract.getPortForWORKER(id,worker1.address);

    const endpoint = await nexusContract.getWORKEREndpoint(worker1.address);

    failed = false;
    try {
      await fetch(`${endpoint}-${id}:${port}`, {method: 'GET'});
    } catch(e) {
      failed = true;
    }

    expect(failed).to.equal(true);
    
    const isCocmplete = await nexusContract.jobServiceCompleted(id,worker1.address,false);
    
    expect(isCocmplete).to.equal(true);
  });

  // test relies on above increase time to assume the feed is stale
  it("Get get max payment for gas with fallback time", async function() {
    const data = await nexusContract.getMaxPaymentForGas("1000000","runner",worker1.address);
    
    expect(data).is.above(100000000);
  });

  it("Claim worker dapp", async function() {
    const preWorkerBal = await dappTokenContract.balanceOf(worker1.address);

    await nexusContract.connect(worker1).claim();

    const postWorkerBal = await dappTokenContract.balanceOf(worker1.address);
    
    expect(postWorkerBal).is.above(preWorkerBal);
  });

  it("Get worker amount", async function() {
    const amount = await nexusContract.getWORKERAmount(addr1.address,worker1.address);
    
    expect(amount).is.above(0);
  });

  it("Get image approved for worker", async function() {
    const approved = await nexusContract.isImageApprovedForWORKER(worker1.address,"runner");
    
    expect(approved).to.equal(true);
  });

  it("Unapprove image for worker", async function() {
    await nexusContract.connect(worker1).unapproveDockerForWORKER("runner");

    const approved = await nexusContract.isImageApprovedForWORKER(worker1.address,"runner");
    
    expect(approved).to.equal(false);
  });

  it("Get worker port", async function() {
    const port = await nexusContract.getPortForWORKER(6,worker1.address);

    expect(port).to.equal(9001);
  });

  it("Get worker endpoint", async function() {
    const endpoint = await nexusContract.getWORKEREndpoint(worker1.address);

    expect(endpoint).to.equal("http://wasi-service");
  });

  it("Get worker list", async function() {
    const workers = await nexusContract.getWorkerAddresses();

    const expectedResult = [ worker1.address,worker2.address ];

    expect(JSON.stringify(workers)).to.equal(JSON.stringify(expectedResult));
  });

  it("Get worker data", async function() {
    const workers = await nexusContract.getWorkerAddresses();

    let workerData = [];
    for(let i=0; i<workers.length; i++) {
      workerData.push(await nexusContract.registeredWORKERs(workers[i]));
    }

    expect(workerData[0].endpoint).to.equal('http://wasi-service');
  });
});
