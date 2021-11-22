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

  it("Example unit test", async function() {
    // you will create one of these for each unit test required
  });
});
