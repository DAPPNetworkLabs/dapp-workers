const Web3 = require("web3");
const { expect } = require("chai");
const { network, ethers } = require("hardhat");
const { BigNumber } = require("ethers");

let nexusAbi = require('../abi/contracts/Nexus.sol/Nexus.json')

const fs = require('fs');
const path = require('path');

const bancorNetwork = "0x2F9EC37d6CcFFf1caB21733BdaDEdE11c823cCB0";
const fastGasFeed = "0x169e633a2d1e6c10dd91238ba11c4a708dfef37c";
const paymentPremiumPPB = 200000000;
const stalenessSeconds = 86400;
const fallbackGasPrice = 200000000000;
const gasCeilingMultiplier = 2;

const delay = ms => new Promise(res => setTimeout(res, ms));

let provider;

function loadfsRoot(fsrootName){
  if(process.env.PRIVATE_KEY) {
    return fs.readFileSync(path.resolve('/services/orchestrator', `fsroots/${fsrootName}.ipfs`)).toString().trim();
  } else {
    return fs.readFileSync(path.resolve('../services/orchestrator', `fsroots/${fsrootName}.ipfs`)).toString().trim();
  }
}

describe("Nexus", function() {
  this.timeout(1000000);
  // const web3 = new Web3();
  let owner, addr1, addr2, addr3, dsp1, dsp2, addrs;
  let dappTokenContract, nexusContract, consumerContract;
  // let web3Contract;

  before(async function() {
    [owner, addr1, addr2, addr3, dsp1, dsp2, ...addrs] = await ethers.getSigners();

    const dappTokenFactory = await ethers.getContractFactory("DappToken", addr1);
    const nexusTokenFactory = await ethers.getContractFactory("Nexus", addr1);
    const consumerTokenFactory = await ethers.getContractFactory("Consumer", addr2);

    dappTokenContract = await dappTokenFactory.deploy();
    nexusContract = await nexusTokenFactory.deploy(
      dappTokenContract.address,
      bancorNetwork,
      fastGasFeed,
      paymentPremiumPPB,
      stalenessSeconds,
      100,
      gasCeilingMultiplier
    );
    consumerContract = await consumerTokenFactory.deploy(nexusContract.address);

    if(process.env.PRIVATE_KEY) {
      // const provider = new Web3.providers.WebsocketProvider(process.env.ETH_ADDR)
      // const web3 = new Web3(provider);
      // nexusAbi = require('/app/nexus/abi/contracts/Nexus.sol/Nexus.json');
      // web3.setProvider(provider);
      // web3Contract = new web3.eth.Contract(
      //     nexusAbi,
      //     nexusContract.address,
      //     {}
      // );
      // provider = new ethers.providers.Web3Provider(new Web3.providers.WebsocketProvider(process.env.ETH_ADDR));
      dsp1 = new ethers.Wallet(process.env.PRIVATE_KEY,dsp1.provider);
      // 10000 ETH
      await network.provider.send("hardhat_setBalance", [
        dsp1.address,
        "0x10000000000000000000000",
      ]);
      // provider.on('error', e => console.log('WS Error', e));
      // provider.on('connect', function () {
      //     console.log('WSS Reconnected');
      // });
      // web3Contract = new ethers.Contract(nexusContract.address, JSON.stringify(nexusAbi), provider);
    }

    // console.log(Object.keys(nexusContract.interface));
    // console.log(nexusTokenFactory);
    // console.log(nexusContract.interface);

    console.log(`nexus contract: ${nexusContract.address}`);
  });

  /*

    Todo tests
    - jobServiceCompleted

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
    await nexusContract.connect(dsp1).regDSP("https://dsp.address");

    const registeredDSPs = await nexusContract.registeredDSPs(dsp1.address);

    expect(registeredDSPs.active).to.equal(true);
    expect(registeredDSPs.endpoint).to.equal("https://dsp.address");
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
    await nexusContract.connect(dsp1).updateDockerImage("runner",100000,100000,100000,100000,1,1);

    const dockerImage = await nexusContract.dspApprovedImages(dsp1.address,"runner");

    expect(dockerImage.jobFee.toString()).to.equal('100000');
    expect(dockerImage.baseFee.toString()).to.equal('100000');
    expect(dockerImage.storageFee.toString()).to.equal('100000');
    expect(dockerImage.ioFee.toString()).to.equal('100000');
    expect(dockerImage.minStorageMegaBytes.toString()).to.equal('1');
    expect(dockerImage.minIoMegaBytes.toString()).to.equal('1');
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
    // nexusContract.provider.on("pending", (tx) => {
    //   console.log(`new pending trx`);
    //   console.log(tx);
    //   // Emitted when any new pending transaction is noticed
    // });
    await nexusContract.approveImage("rust-compiler","hash");
    await nexusContract.connect(dsp1).setDockerImage("rust-compiler",100000,100000,100000,100000,1,1);

    
    let outputFSRes;

    // web3Contract.events["Test"]({
    //   fromBlock: 0
    // }, async function (error, result) {
    //   console.log("Test");
    //   console.log(error);
    //   console.log(result);
    // });
    // web3Contract.events["JobResult"]({
    //     fromBlock: 0
    // }, async function (error, result) {
    //   console.log("JobResult");
    //   console.log(error);
    //   console.log(result);
    //   // outputFSRes = result.outputFS;
    // });
    // web3Contract.events["QueueJob"]({
    //     fromBlock: 0
    // }, async function (error, result) {
    //   console.log("QueueJob web3");
    //   console.log(error);
    //   console.log(result);
    //   // outputFSRes = result.outputFS;
    // });
    
    nexusContract.on("QueueJob", (
        consumer, 
        owner, 
        imageName, 
        id,
        inputFS,
        args
      ) => {
        console.log("QueueJob nexus contract");
        console.log(`consumer: ${consumer}`);
        console.log(`owner: ${owner}`);
        console.log(`imageName: ${imageName}`);
        console.log(`id: ${id}`);
        console.log(`inputFS: ${inputFS}`);
        console.log(`args: ${args}`);
      }
    );
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "rust-compiler",
      inputFS: loadfsRoot("pngWriterTest"),
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: []
    });
    
    await nexusContract.once("JobResult", (
        consumer, 
        dsp, 
        outputFS, 
        outputHash,
        dapps,
        jobID
      ) => {
        console.log("JobResult nexus contract");
        console.log(`outputFS: ${outputFS}`);
        outputFSRes = outputFS;
      }
    );

    console.log(`waiting: ${outputFSRes}`);

    await delay(60 * 1000 * 3);

    console.log(`done waiting: ${outputFSRes}`);

    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "runner",
      // inputFS: "QmPDKw5a5THGW4PDKcddQ6r2Tq3uNwfyKmzX62ovC6dKqx",
      inputFS: outputFSRes,
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: ["target/wasm32-wasi/release/test"]
    });

    const job = await nexusContract.jobs(1);

    expect(job.consumer).to.equal(addr1.address);
    expect(job.callback).to.equal(false);
    expect(job.resultsCount.toString()).to.equal('1');
    expect(job.imageName).to.equal("rust-compiler");

    const job2 = await nexusContract.jobs(2);

    expect(job2.consumer).to.equal(addr1.address);
    expect(job2.callback).to.equal(false);
    expect(job2.resultsCount.toString()).to.equal('0');
    expect(job2.imageName).to.equal("runner");
  });

  // it("Queue job with callback", async function() {
  //   const dapps = ethers.utils.parseUnits("250000",4);
  //   await dappTokenContract.mint(addr2.address, dapps);
  //   await dappTokenContract.connect(addr2).approve(nexusContract.address, dapps);
  //   await nexusContract.connect(addr2).buyGasFor(dapps, consumerContract.address, dsp1.address);
  //   await nexusContract.connect(addr2).setDsps([dsp1.address]);

  //   await consumerContract.queueJob(addr2.address);

  //   const job = await nexusContract.jobs(2);

  //   expect(job.consumer).to.equal(consumerContract.address);
  //   expect(job.callback).to.equal(true);
  //   expect(job.resultsCount.toString()).to.equal('0');
  //   expect(job.imageName).to.equal("runner");
  // });

  // it("Queue service - try below min bytes", async function() {
  //   await nexusContract.approveImage("wasi-service","hash");
  //   await nexusContract.connect(dsp1).setDockerImage("wasi-service",100000,100000,100000,100000,1,1);

  //   let failed = false;
  //   try {
  //     await nexusContract.queueService({
  //       owner: addr1.address,
  //       imageName: "wasi-service",
  //       ioMegaBytes: 0,
  //       storageMegaBytes: 0,
  //       inputFS: "",
  //       args: ["target/wasm32-wasi/release/test"],
  //       months: 1
  //     });
  //   } catch(e) {
  //     failed = true;
  //   }

  //   expect(failed).to.equal(true);

  //   await nexusContract.queueService({
  //     owner: addr1.address,
  //     imageName: "wasi-service",
  //     ioMegaBytes: 1,
  //     storageMegaBytes: 1,
  //     inputFS: "",
  //     args: ["target/wasm32-wasi/release/test"],
  //     months: 1
  //   });

  //   const service = await nexusContract.services(3);

  //   expect(service.consumer).to.equal(addr1.address);
  //   expect(service.imageName).to.equal("wasi-service");
  // });

  // it("Min job balance", async function() {
  //   const min = await nexusContract.getMinBalance(1,"job",dsp1.address);

  //   // console.log(min.toString());
  //   // 76,349.8769 * 0.00730 $/DAPP = $557.35
    
  //   expect(min).is.above(400000000);
  // });

  // it("Min job balance with callback", async function() {
  //   const min = await nexusContract.getMinBalance(2,"job",dsp1.address);

  //   // console.log(min.toString());
  //   // 76,349.8769 * 0.00730 $/DAPP = $557.35
    
  //   expect(min).is.above(400000000);
  // });

  // it("Min service balance", async function() {
  //   const min = await nexusContract.getMinBalance(3,"service",dsp1.address);

  //   // console.log(min.toString());
  //   // 9,315.0201 * 0.00730 $/DAPP = $68.00

  //   expect(min).is.above(50000000);
  // });

  // it("Set dsps", async function() {
  //   await nexusContract.connect(dsp2).regDSP("endpoint");

  //   const dapps = ethers.utils.parseUnits("800000",4);
  //   await dappTokenContract.mint(addr1.address, dapps);
  //   await dappTokenContract.approve(nexusContract.address, dapps);
  //   await nexusContract.buyGasFor(dapps, addr1.address, dsp2.address);

  //   await nexusContract.setDsps([dsp1.address,dsp2.address]);

  //   const dsps = await nexusContract.getDspAddresses();

  //   expect(JSON.stringify(dsps)).to.equal(JSON.stringify([dsp1.address,dsp2.address]));
    
  //   await nexusContract.setDsps([dsp1.address]);
  //   await nexusContract.connect(dsp2).deprecateDSP();
  // });

  // it("Run job", async function() {
  //   const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

  //   await nexusContract.connect(dsp1).jobCallback({
  //     jobID: 1,
  //     outputFS: "",
  //     outputHash: "hash"
  //   });

  //   const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
  //   expect(postDspBal).is.above(preDspBal);

  //   // ensure job ran
  // });

  // it("Run is job complete", async function() {
  //   const isCocmplete = await nexusContract.jobServiceCompleted(1,dsp1.address,true);

  //   expect(isCocmplete).to.equal(true);
  // });

  // it("Run job with callback", async function() {
  //   const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

  //   await nexusContract.connect(dsp1).jobCallback({
  //     jobID: 2,
  //     outputFS: "",
  //     outputHash: "hash"
  //   });

  //   const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

  //   const lastHash = await consumerContract.lastHash();
    
  //   expect(postDspBal).is.above(preDspBal);
  //   expect(lastHash.toString()).to.equal('hash');
  // });

  // it("Run service", async function() {
  //   const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

  //   await nexusContract.connect(dsp1).serviceCallback(3,8001);

  //   const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
  //   expect(postDspBal).is.above(preDspBal);

  //   let failed = false;
  //   try {
  //     await nexusContract.connect(dsp1).serviceCallback(3,8001);
  //   } catch(e) {
  //     failed = true;
  //   }

  //   expect(failed).to.equal(true);

  //   // ensure service running
  // });

  // it("Run job - error", async function() {
  //   const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

  //   await nexusContract.queueJob({
  //     owner: addr1.address,
  //     imageName: "runner",
  //     inputFS: "",
  //     callback: false,
  //     gasLimit: 1000000,
  //     requiresConsistent: false,
  //     args: ["target/wasm32-wasi/release/test"]
  //   });

  //   await nexusContract.connect(dsp1).jobError(4,"big error","newhash");

  //   const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
  //   // ensure get base payment for job
  //   expect(postDspBal).is.above(preDspBal);

  //   // ensure job not completed
  // });

  // it("Run job with callback - error", async function() {
    
  // });

  // it("Run service - error", async function() {
  //   const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

  //   await nexusContract.queueService({
  //     owner: addr1.address,
  //     imageName: "wasi-service",
  //     ioMegaBytes: 1,
  //     storageMegaBytes: 1,
  //     inputFS: "",
  //     args: ["target/wasm32-wasi/release/test"],
  //     months: 1
  //   });

  //   await nexusContract.connect(dsp1).serviceError({
  //     jobID: 5,
  //     stdErr: "big error",
  //     outputFS: "",
  //     ioMegaBytesUsed: 1,
  //     storageMegaBytesUsed: 1
  //   });

  //   const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
  //   expect(postDspBal).is.above(preDspBal);

  //   // ensure service not running
  // });

  // it("Extend service", async function() {
  //   const preDspEnDate = (await nexusContract.services(3)).endDate;
  //   const preDspIoLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).ioMegaBytesLimit;
  //   const preDspStorageLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).storageMegaBytesLimit;

  //   const dapps = ethers.utils.parseUnits("200000",4);
  //   await dappTokenContract.approve(nexusContract.address, dapps);
  //   await nexusContract.extendService(
  //     3,
  //     "wasi-service",
  //     1,
  //     1,
  //     1
  //   );

  //   const postDspEnDate = (await nexusContract.services(3)).endDate;
  //   const postDspIoLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).ioMegaBytesLimit;
  //   const postDspStorageLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).storageMegaBytesLimit;
    
  //   expect(postDspEnDate).is.above(preDspEnDate);
  //   expect(postDspIoLimit).is.above(preDspIoLimit);
  //   expect(postDspStorageLimit).is.above(preDspStorageLimit);
  // });

  // it("Extend service same month", async function() {
  //   const preDspEnDate = (await nexusContract.services(3)).endDate;
  //   const preDspIoLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).ioMegaBytesLimit;
  //   const preDspStorageLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).storageMegaBytesLimit;

  //   const dapps = ethers.utils.parseUnits("200000",4);
  //   await dappTokenContract.approve(nexusContract.address, dapps);
  //   await nexusContract.extendService(
  //     3,
  //     "wasi-service",
  //     0,
  //     1,
  //     1
  //   );

  //   const postDspEnDate = (await nexusContract.services(3)).endDate;
  //   const postDspIoLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).ioMegaBytesLimit;
  //   const postDspStorageLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).storageMegaBytesLimit;
    
  //   expect(postDspEnDate).to.equal(preDspEnDate);
  //   expect(postDspIoLimit).is.above(preDspIoLimit);
  //   expect(postDspStorageLimit).is.above(preDspStorageLimit);
  // });

  // it("Get get max payment for gas", async function() {
  //   const data = await nexusContract.getMaxPaymentForGas("1000000","runner",dsp1.address);
    
  //   expect(data).is.above(1000000000);
  // });

  // it("Run service - complete", async function() {
  //   const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

  //   await nexusContract.queueService({
  //     owner: addr1.address,
  //     imageName: "wasi-service",
  //     ioMegaBytes: 1,
  //     storageMegaBytes: 1,
  //     inputFS: "",
  //     args: ["target/wasm32-wasi/release/test"],
  //     months: 1
  //   });
  //   await nexusContract.connect(dsp1).serviceCallback(6,8001);

  //   let failed = false;
  //   try {
  //     await nexusContract.connect(dsp1).serviceComplete({
  //       jobID: 6,
  //       outputFS: "",
  //       ioMegaBytesUsed: 1,
  //       storageMegaBytesUsed: 1
  //     });
  //   } catch(e) {
  //     failed = true;
  //   }

  //   expect(failed).to.equal(true);

  //   await ethers.provider.send("evm_increaseTime", [86400 * 30 * 2]); // 2 months in seconds

  //   await nexusContract.connect(dsp1).serviceComplete({
  //     jobID: 6,
  //     outputFS: "",
  //     ioMegaBytesUsed: 1,
  //     storageMegaBytesUsed: 1
  //   });

  //   const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
  //   expect(postDspBal).is.above(preDspBal);

  //   // ensure service not running
  // });

  // // test relies on above increase time to assume the feed is stale
  // it("Get get max payment for gas with fallback time", async function() {
  //   const data = await nexusContract.getMaxPaymentForGas("1000000","runner",dsp1.address);
    
  //   expect(data).is.above(1000000000);
  // });

  // it("Claim dsp dapp", async function() {
  //   const preDspBal = await dappTokenContract.balanceOf(dsp1.address);

  //   await nexusContract.connect(dsp1).claim();

  //   const postDspBal = await dappTokenContract.balanceOf(dsp1.address);
    
  //   expect(postDspBal).is.above(preDspBal);
  // });

  // it("Get image approved for dsp", async function() {
  //   const approved = await nexusContract.isImageApprovedForDSP(dsp1.address,"runner");
    
  //   expect(approved).to.equal(true);
  // });

  // it("Unapprove image for dsp", async function() {
  //   await nexusContract.connect(dsp1).unapproveDockerForDSP("runner");

  //   const approved = await nexusContract.isImageApprovedForDSP(dsp1.address,"runner");
    
  //   expect(approved).to.equal(false);
  // });

  // it("Get dsp port", async function() {
  //   const port = await nexusContract.getPortForDSP(3,dsp1.address);

  //   expect(port).to.equal(8001);
  // });

  // it("Get dsp endpoint", async function() {
  //   const endpoint = await nexusContract.getDSPEndpoint(dsp1.address);

  //   expect(endpoint).to.equal("https://dsp.address");
  // });

  // it("Get dsp list", async function() {
  //   const dsps = await nexusContract.getDspAddresses();

  //   const expectedResult = [ dsp1.address,dsp2.address ];

  //   expect(JSON.stringify(dsps)).to.equal(JSON.stringify(expectedResult));
  // });

  // it("Get dsp data", async function() {
  //   const dsps = await nexusContract.getDspAddresses();

  //   let dspData = [];
  //   for(let i=0; i<dsps.length; i++) {
  //     dspData.push(await nexusContract.registeredDSPs(dsps[i]));
  //   }

  //   expect(dspData[0].endpoint).to.equal('https://dsp.address');
  // });
});
