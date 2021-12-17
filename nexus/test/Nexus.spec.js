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
    await nexusContract.connect(dsp1).setJobDockerImage("wasmrunner","","",20);

    const dockerImage = await nexusContract.jobDockerImages("wasmrunner");

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

  it.skip("Set quorum", async function() {
    await nexusContract.setQuorum(addr1.address, [dsp1.address]);

    const consumerData = await nexusContract.consumerData(addr1.address);

    console.log(consumerData);

    expect(consumerData.dsps).to.equal([dsp1.address]);
  });

  it.skip("Set consumer", async function() {
    await nexusContract.setConsumerPermissions(addr1.address);

    const consumerData = await nexusContract.consumerData(addr1.address);

    console.log(consumerData);

    expect(consumerData.owner).to.equal(addr1.address);
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
  });

  it.skip("Run job", async function() {
    await nexusContract.connect(dsp1).jobCallback(0,"");
  });

  it.skip("Run service", async function() {
    await nexusContract.connect(dsp1).serviceCallback(0,8888);
  });

  it.skip("Run job - error", async function() {
    await nexusContract.connect(dsp1).jobError(0,"big error","");
  });

  it.skip("Run service - error", async function() {
    await nexusContract.connect(dsp1).serviceError(0,"big error","");
  });

  it.skip("Claim dsp dapp", async function() {
    await nexusContract.connect(dsp1).claim(dsp1.address);
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

  it.skip("Get dsp port", async function() {
    const port = await nexusContract.getPortForDSP(1,dsp1.address);

    console.log(port);
    
    expect(port).to.equal(8888);
  });

  it("Get dsp endpoint", async function() {
    const endpoint = await nexusContract.getDSPEndpoint(dsp1.address);

    console.log(endpoint);
    
    expect(endpoint).to.equal("https://dsp.address");
  });
});
