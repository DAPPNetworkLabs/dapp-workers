const Web3 = require("web3");
const { expect } = require("chai");
const { network, ethers } = require("hardhat");
const { BigNumber } = require("ethers");

describe("Nexus", function() {
  this.timeout(100000);
  const web3 = new Web3();
  let owner, addr1, addr2, addr3, addr4, addr5, addrs;

  before(async function() {
    [owner, addr1, addr2, addr3, addr4, addr5, ...addrs] = await ethers.getSigners();

  });

  it("Register job", async function() {
    
  });

  it("Register service", async function() {
    
  });

  it("Buy dapp gas", async function() {
    
  });

  it("Sell dapp gas", async function() {
    
  });

  it("Set consumer permission", async function() {
    
  });

  it("Set quorum", async function() {
    
  });

  it("Claim dsp dapp", async function() {
    
  });

  it("Create job", async function() {
    
  });

  it("Create service", async function() {
    
  });

  it("Run job", async function() {
    
  });

  it("Run service", async function() {
    
  });

  it("Run job - error", async function() {
    
  });

  it("Run service - error", async function() {
    
  });

  it("Register DSP", async function() {
    
  });

  it("Deprecate DSP", async function() {
    
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
});
