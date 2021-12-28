const Web3 = require("web3");
const { expect } = require("chai");
const { network, ethers } = require("hardhat");
const { BigNumber } = require("ethers");

const bancorNetwork = "0x2F9EC37d6CcFFf1caB21733BdaDEdE11c823cCB0";
const fastGasFeed = "0x169e633a2d1e6c10dd91238ba11c4a708dfef37c";
const paymentPremiumPPB = 200000000;
const stalenessSeconds = 86400;
const fallbackGasPrice = 200;
const gasCeilingMultiplier = 2;

describe("Nexus", function() {
  this.timeout(100000);
  const web3 = new Web3();
  let owner, addr1, addr2, addr3, dsp1, dsp2, addrs;
  let dappTokenContract, nexusContract, consumerContract;

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
      fallbackGasPrice,
      gasCeilingMultiplier
    );
    consumerContract = await consumerTokenFactory.deploy(1,nexusContract.address);

    // start docker compose unit tests
  });

  it("Get config", async function() {
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
    expect(registeredDSPs.endpoint).to.equal("");
  });

  it("Register DSP", async function() {
    await nexusContract.connect(dsp1).regDSP("https://dsp.address");

    const registeredDSPs = await nexusContract.registeredDSPs(dsp1.address);

    expect(registeredDSPs.active).to.equal(true);
    expect(registeredDSPs.registered).to.equal(true);
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

  it("Register job image", async function() {
    await nexusContract.connect(dsp1).setJobDockerImage("wasmrunner","","",100000);

    const dockerImage = await nexusContract.jobDockerImages(dsp1.address,"wasmrunner");

    expect(dockerImage.image).to.equal("");
    expect(dockerImage.imageHash).to.equal("");
    expect(dockerImage.jobFee.toString()).to.equal('100000');
  });

  it("Register service image", async function() {
    await nexusContract.connect(dsp1).setServiceDockerImage("wasi-service","","",100000,100000,100000,1,1);

    const dockerImage = await nexusContract.serviceDockerImages(dsp1.address,"wasi-service");

    expect(dockerImage.image).to.equal("");
    expect(dockerImage.imageHash).to.equal("");
    expect(dockerImage.baseFee.toString()).to.equal('100000');
    expect(dockerImage.storageFee.toString()).to.equal('100000');
    expect(dockerImage.ioFee.toString()).to.equal('100000');
  });

  it("Set consumer", async function() {
    await nexusContract.setConsumerPermissions(addr1.address);

    const consumerData = await nexusContract.consumerData(addr1.address);

    expect(consumerData).to.equal(addr1.address);
  });

  // it("Set dsp quorum", async function() {
  //   await nexusContract.setQuorum(addr1.address, [dsp1.address]);

  //   const consumerDataDsps = await nexusContract.getConsumerDsps(addr1.address);

  //   expect(JSON.stringify(consumerDataDsps)).to.equal(JSON.stringify([dsp1.address]));
  // });

  it("Queue job", async function() {
    await nexusContract.runJob({
      consumer: addr1.address,
      imageName: "wasmrunner",
      inputFS: "",
      callback: false,
      gasLimit: 1000000,
      args: ["target/wasm32-wasi/release/test"],
      dsps: [dsp1.address]
    });

    const job = await nexusContract.jobs(1);

    expect(job.owner).to.equal(addr1.address);
    expect(job.callback).to.equal(false);
    expect(job.resultsCount.toString()).to.equal('0');
    expect(job.imageName).to.equal("wasmrunner");
  });

  it("Queue job with callback", async function() {
    const dapps = ethers.utils.parseUnits("250000",4);
    await dappTokenContract.mint(addr2.address, dapps);
    await dappTokenContract.connect(addr2).approve(nexusContract.address, dapps);
    await nexusContract.connect(addr2).buyGasFor(dapps, consumerContract.address, dsp1.address);

    // await consumerContract.connect(addr2).setQuorum(consumerContract.address, [dsp1.address]);

    await consumerContract.runJob([dsp1.address]);

    const job = await nexusContract.jobs(2);

    expect(job.owner).to.equal(consumerContract.address);
    expect(job.callback).to.equal(true);
    expect(job.resultsCount.toString()).to.equal('0');
    expect(job.imageName).to.equal("wasmrunner");
  });

  it("Queue service - try below min bytes", async function() {
    let failed = false;
    try {
      await nexusContract.runService({
        consumer: addr1.address,
        imageName: "wasi-service",
        ioMegaBytes: 0,
        storageMegaBytes: 0,
        inputFS: "",
        args: ["target/wasm32-wasi/release/test"],
        months: 1,
        dsps: [dsp1.address]
      });
    } catch(e) {
      failed = true;
    }

    expect(failed).to.equal(true);

    await nexusContract.runService({
      consumer: addr1.address,
      imageName: "wasi-service",
      ioMegaBytes: 1,
      storageMegaBytes: 1,
      inputFS: "",
      args: ["target/wasm32-wasi/release/test"],
      months: 1,
      dsps: [dsp1.address]
    });

    const service = await nexusContract.services(3);

    expect(service.owner).to.equal(addr1.address);
    expect(service.imageName).to.equal("wasi-service");
  });

  it("Min job balance", async function() {
    const min = await nexusContract.getMinBalance(1,"job",dsp1.address);
    
    expect(min).is.above(400000000);
  });

  it("Min job balance with callback", async function() {
    const min = await nexusContract.getMinBalance(2,"job",dsp1.address);
    
    expect(min).is.above(400000000);
  });

  it("Min service balance", async function() {
    const min = await nexusContract.getMinBalance(3,"service",dsp1.address);

    expect(min).is.above(50000000);
  });

  it("Run job", async function() {
    const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

    await nexusContract.connect(dsp1).jobCallback(1,"");

    const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
    expect(postDspBal).is.above(preDspBal);

    // ensure job ran
  });

  it("Run job with callback", async function() {
    const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

    await nexusContract.connect(dsp1).jobCallback(2,"");

    const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

    const job = await consumerContract.counter();
    
    expect(postDspBal).is.above(preDspBal);
    expect(job.toString()).to.equal('2');
  });

  it("Run service", async function() {
    const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

    await nexusContract.connect(dsp1).serviceCallback(3,8001);

    const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
    expect(postDspBal).is.above(preDspBal);

    let failed = false;
    try {
      await nexusContract.connect(dsp1).serviceCallback(3,8001);
    } catch(e) {
      failed = true;
    }

    expect(failed).to.equal(true);

    // ensure service running
  });

  it("Run job - error", async function() {
    const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

    await nexusContract.runJob({
      consumer: addr1.address,
      imageName: "wasmrunner",
      inputFS: "",
      callback: false,
      gasLimit: 1000000,
      args: ["target/wasm32-wasi/release/test"],
      dsps: [dsp1.address]
    });
    await nexusContract.connect(dsp1).jobError(4,"big error","");

    const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
    expect(postDspBal).to.equal(preDspBal);

    // ensure job not completed
  });

  it("Run job with callback - error", async function() {
    
  });

  it("Run service - error", async function() {
    const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

    await nexusContract.runService({
      consumer: addr1.address,
      imageName: "wasi-service",
      ioMegaBytes: 1,
      storageMegaBytes: 1,
      inputFS: "",
      callback: false,
      args: ["target/wasm32-wasi/release/test"],
      months: 1,
      dsps: [dsp1.address]
    });
    await nexusContract.connect(dsp1).serviceError(5,"big error","");

    const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
    expect(postDspBal).to.equal(preDspBal);

    // ensure service not running
  });

  it("Extend service", async function() {
    const preDspEnDate = (await nexusContract.services(3)).endDate;
    const preDspIoLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).ioMegaBytesLimit;
    const preDspStorageLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).storageMegaBytesLimit;

    const dapps = ethers.utils.parseUnits("200000",4);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.extendService(
      3,
      "wasi-service",
      1,
      1,
      1,
      [dsp1.address]
    );

    const postDspEnDate = (await nexusContract.services(3)).endDate;
    const postDspIoLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).ioMegaBytesLimit;
    const postDspStorageLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).storageMegaBytesLimit;
    
    expect(postDspEnDate).is.above(preDspEnDate);
    expect(postDspIoLimit).is.above(preDspIoLimit);
    expect(postDspStorageLimit).is.above(preDspStorageLimit);
  });

  it("Extend service same month", async function() {
    const preDspEnDate = (await nexusContract.services(3)).endDate;
    const preDspIoLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).ioMegaBytesLimit;
    const preDspStorageLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).storageMegaBytesLimit;

    const dapps = ethers.utils.parseUnits("200000",4);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.extendService(
      3,
      "wasi-service",
      0,
      1,
      1,
      [dsp1.address]
    );

    const postDspEnDate = (await nexusContract.services(3)).endDate;
    const postDspIoLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).ioMegaBytesLimit;
    const postDspStorageLimit = (await nexusContract.getDSPDataLimits(3,dsp1.address)).storageMegaBytesLimit;
    
    expect(postDspEnDate).to.equal(preDspEnDate);
    expect(postDspIoLimit).is.above(preDspIoLimit);
    expect(postDspStorageLimit).is.above(preDspStorageLimit);
  });

  it("Claim dsp dapp", async function() {
    const preDspBal = await dappTokenContract.balanceOf(dsp1.address);

    await nexusContract.connect(dsp1).claim();

    const postDspBal = await dappTokenContract.balanceOf(dsp1.address);
    
    expect(postDspBal).is.above(preDspBal);
  });

  it("Get image approved for dsp", async function() {
    const approved = await nexusContract.isImageApprovedForDSP(dsp1.address,"wasmrunner");
    
    expect(approved).to.equal(false);
  });

  it("Approve image for dsp", async function() {
    await nexusContract.connect(dsp1).approveDockerForDSP("wasmrunner");

    const approved = await nexusContract.isImageApprovedForDSP(dsp1.address,"wasmrunner");
    
    expect(approved).to.equal(true);
  });

  it("Unapprove image for dsp", async function() {
    await nexusContract.connect(dsp1).unapproveDockerForDSP("wasmrunner");

    const approved = await nexusContract.isImageApprovedForDSP(dsp1.address,"wasmrunner");
    
    expect(approved).to.equal(false);
  });

  it("Get dsp port", async function() {
    const port = await nexusContract.getPortForDSP(3,dsp1.address);

    expect(port).to.equal(8001);
  });

  it("Get dsp endpoint", async function() {
    const endpoint = await nexusContract.getDSPEndpoint(dsp1.address);

    expect(endpoint).to.equal("https://dsp.address");
  });

  it("Get dsp list", async function() {
    const dsps = await nexusContract.getDspAddresses();

    const expectedResult = [ '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' ];

    expect(JSON.stringify(dsps)).to.equal(JSON.stringify(expectedResult));
  });

  it("Get dsp data", async function() {
    const dsps = await nexusContract.getDspAddresses();

    let dspData = [];
    for(let i=0; i<dsps.length; i++) {
      dspData.push(await nexusContract.registeredDSPs(dsps[i]));
    }

    expect(dspData[0].endpoint).to.equal('https://dsp.address');
  });
});
