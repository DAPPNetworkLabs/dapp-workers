const Web3 = require("web3");
const { expect } = require("chai");
const { network, ethers } = require("hardhat");
const { BigNumber } = require("ethers");

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
    nexusContract = await nexusTokenFactory.deploy(dappTokenContract.address);
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
    const dapps = ethers.utils.parseUnits("10000",4);
    await dappTokenContract.mint(addr1.address, dapps);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.buyGasFor(dapps, addr1.address, dsp1.address);

    const dspData = await nexusContract.dspData(addr1.address, dsp1.address);

    expect(dspData.amount).to.equal(dapps);
  });

  it("Sell dapp gas", async function() {
    const dapps = ethers.utils.parseUnits("10000",4);

    await nexusContract.sellGas(dapps, dsp1.address);

    const dspData = await nexusContract.dspData(addr1.address, dsp1.address);

    expect(dspData.amount.toString()).to.equal('0');
  });

  it("Register job image", async function() {
    await nexusContract.connect(dsp1).setJobDockerImage("wasm-runner","","",20);

    const dockerImage = await nexusContract.jobDockerImages("wasm-runner");

    expect(dockerImage.image).to.equal("");
    expect(dockerImage.owner).to.equal(dsp1.address);
    expect(dockerImage.imageHash).to.equal("");
    expect(dockerImage.jobFee.toString()).to.equal('20');
  });

  it("Register service image", async function() {
    await nexusContract.connect(dsp1).setServiceDockerImage("wasi-service","","",10,10,10);

    const dockerImage = await nexusContract.serviceDockerImages("wasi-service");

    expect(dockerImage.image).to.equal("");
    expect(dockerImage.owner).to.equal(dsp1.address);
    expect(dockerImage.imageHash).to.equal("");
    expect(dockerImage.baseFee.toString()).to.equal('10');
    expect(dockerImage.storageFee.toString()).to.equal('10');
    expect(dockerImage.ioFee.toString()).to.equal('10');
  });

  it("Run job", async function() {
    
  });

  it("Run service", async function() {
    
  });

  it("Run job - error", async function() {
    
  });

  it("Run service - error", async function() {
    
  });

  it("Set consumer permission", async function() {
    
  });

  it("Set quorum", async function() {
    
  });

  it("Claim dsp dapp", async function() {
    
  });

  it("Set job docker image", async function() {
    
  });

  it("Set service docker image", async function() {
    
  });

  it("Get job docker image", async function() {
    
  });

  it("Get service docker image", async function() {
    
  });

  it("Get image approved for dsp", async function() {
    
  });

  it("Approve image for dsp", async function() {
    
  });

  it("Unapprove image for dsp", async function() {
    
  });

  it("Get dsp port", async function() {
    
  });

  it("Get dsp endpoint", async function() {
    
  });

  // it("Create job", async function() {
    
  // });

  // it("Create service", async function() {
    
  // });
});
