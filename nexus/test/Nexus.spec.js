const Web3 = require("web3");
const { expect } = require("chai");
const { network, ethers } = require("hardhat");
const { BigNumber } = require("ethers");

const bancorNetwork = "0x2F9EC37d6CcFFf1caB21733BdaDEdE11c823cCB0";
const fastGasFeed = "0x169e633a2d1e6c10dd91238ba11c4a708dfef37c";

describe("Nexus", function() {
  this.timeout(100000);
  const web3 = new Web3();
  let owner, addr1, addr2, addr3, dsp1, dsp2, addrs;
  let dappTokenContract, nexusContract;

  before(async function() {
    [owner, addr1, addr2, addr3, dsp1, dsp2, ...addrs] = await ethers.getSigners();

    const dappTokenFactory = await ethers.getContractFactory("DappToken", addr1);
    const nexusTokenFactory = await ethers.getContractFactory("Nexus", addr1);

    dappTokenContract = await dappTokenFactory.deploy();
    nexusContract = await nexusTokenFactory.deploy(dappTokenContract.address,bancorNetwork,fastGasFeed);

    // start docker compose unit tests
  });

  it("Deprecate DSP", async function() {
    await nexusContract.connect(dsp1).deprecateDSP();

    const registeredDSPs = await nexusContract.registeredDSPs(dsp1.address);

    expect(registeredDSPs.active).to.equal(false);
    expect(registeredDSPs.endpoint).to.equal("");
  });

  it("Register DSP", async function() {
    await nexusContract.connect(dsp1).regDSP("https://dsp.address", 20);

    const registeredDSPs = await nexusContract.registeredDSPs(dsp1.address);

    expect(registeredDSPs.active).to.equal(true);
    expect(registeredDSPs.endpoint).to.equal("https://dsp.address");
    expect(registeredDSPs.claimableDapp.toString()).to.equal('0');
    expect(registeredDSPs.gasFeeMult.toString()).to.equal('20');
  });

  it("Buy dapp gas", async function() {
    const dapps = ethers.utils.parseUnits("200000",4);
    await dappTokenContract.mint(addr1.address, dapps);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.buyGasFor(dapps, addr1.address, dsp1.address);

    const dspData = await nexusContract.dspData(addr1.address, dsp1.address);

    expect(dspData.amount).to.equal(dapps);
  });

  it("Sell dapp gas", async function() {
    const dapps = ethers.utils.parseUnits("100000",4);

    await nexusContract.sellGas(dapps, dsp1.address);

    const dspData = await nexusContract.dspData(addr1.address, dsp1.address);

    expect(dspData.amount.toString()).to.equal(dapps);
  });

  it("Register job image", async function() {
    await nexusContract.connect(dsp1).setJobDockerImage("wasmrunner","","",200000);

    const dockerImage = await nexusContract.jobDockerImages("wasmrunner");

    expect(dockerImage.image).to.equal("");
    expect(dockerImage.owner).to.equal(dsp1.address);
    expect(dockerImage.imageHash).to.equal("");
    expect(dockerImage.jobFee.toString()).to.equal('200000');
  });

  it("Register service image", async function() {
    await nexusContract.connect(dsp1).setServiceDockerImage("wasi-service","","",100000,100000,100000);

    const dockerImage = await nexusContract.serviceDockerImages("wasi-service");

    expect(dockerImage.image).to.equal("");
    expect(dockerImage.owner).to.equal(dsp1.address);
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

  it("Set dsp quorum", async function() {
    await nexusContract.setQuorum(addr1.address, [dsp1.address]);

    const consumerDataDsps = await nexusContract.getConsumerDsps(addr1.address);

    expect(JSON.stringify(consumerDataDsps)).to.equal(JSON.stringify([dsp1.address]));
  });

  it("Queue job", async function() {
    await nexusContract.run({
      consumer: addr1.address,
      imageName: "wasmrunner",
      imageType: "job",
      inputFS: "",
      callback: false,
      args: ["target/wasm32-wasi/release/test"]
    });

    const job = await nexusContract.jobs(1);

    expect(job.owner).to.equal(addr1.address);
    expect(job.callback).to.equal(false);
    expect(job.resultsCount.toString()).to.equal('0');
    expect(job.imageName).to.equal("wasmrunner");
  });

  it("Queue service", async function() {
    await nexusContract.run({
      consumer: addr1.address,
      imageName: "wasi-service",
      imageType: "service",
      inputFS: "",
      callback: false,
      args: ["target/wasm32-wasi/release/test"]
    });

    const service = await nexusContract.services(2);

    expect(service.owner).to.equal(addr1.address);
    expect(service.imageName).to.equal("wasi-service");
  });

  it("Min job balance", async function() {
    const min = await nexusContract.getMinBalance(1,"job");
    
    expect(min).is.above(400000000);
  });

  it("Min service balance", async function() {
    const min = await nexusContract.getMinBalance(2,"service");

    expect(min).is.above(50000000);
  });

  it("Run job", async function() {
    const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

    await nexusContract.connect(dsp1).jobCallback(1,"");

    const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
    expect(postDspBal).is.above(preDspBal);

    // ensure job ran
  });

  it("Run service", async function() {
    const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

    await nexusContract.connect(dsp1).serviceCallback(2,8001);

    const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
    expect(postDspBal).is.above(preDspBal);

    // ensure service running
  });

  it("Run job - error", async function() {
    const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

    await nexusContract.run({
      consumer: addr1.address,
      imageName: "wasmrunner",
      imageType: "job",
      inputFS: "",
      callback: false,
      args: ["target/wasm32-wasi/release/test"]
    });
    await nexusContract.connect(dsp1).jobError(3,"big error","");

    const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
    expect(postDspBal).to.equal(preDspBal);

    // ensure job not completed
  });

  it("Run service - error", async function() {
    const preDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;

    await nexusContract.run({
      consumer: addr1.address,
      imageName: "wasi-service",
      imageType: "service",
      inputFS: "",
      callback: false,
      args: ["target/wasm32-wasi/release/test"]
    });
    await nexusContract.connect(dsp1).serviceError(4,"big error","");

    const postDspBal = (await nexusContract.registeredDSPs(dsp1.address)).claimableDapp;
    
    expect(postDspBal).to.equal(preDspBal);

    // ensure service not running
  });

  it("Claim dsp dapp", async function() {
    const preDspBal = await dappTokenContract.balanceOf(dsp1.address);

    await nexusContract.connect(dsp1).claim(dsp1.address);

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
    const port = await nexusContract.getPortForDSP(2,dsp1.address);

    expect(port).to.equal(8001);
  });

  it("Get dsp endpoint", async function() {
    const endpoint = await nexusContract.getDSPEndpoint(dsp1.address);

    expect(endpoint).to.equal("https://dsp.address");
  });
});
