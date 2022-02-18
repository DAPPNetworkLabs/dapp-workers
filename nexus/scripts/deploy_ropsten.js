// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const delay = s => new Promise(res => setTimeout(res, s*1000));

const bancorNetwork = "0x2F9EC37d6CcFFf1caB21733BdaDEdE11c823cCB0";
const fastGasFeed = "0x169e633a2d1e6c10dd91238ba11c4a708dfef37c";
const paymentPremiumPPB = 200000000;
const stalenessSeconds = 86400;
const fallbackGasPrice = 200000000000;
const gasCeilingMultiplier = 2;

const deploymentAddress = "0xEdF6BAE9895941F2f386483640EA30bd71751d0A";

async function main() {
  await hre.run('compile');

  // We get the contract to deploy

    // const dappTokenFactory = await hre.ethers.getContractFactory("DappToken", deploymentAddress);
    const nexusTokenFactory = await hre.ethers.getContractFactory("Nexus", deploymentAddress);
    
    // const dappTokenProxyContract = await dappTokenFactory.deploy();
    const nexusProxyContract = await upgrades.deployProxy(nexusTokenFactory, 
      [
        [
        //   dappTokenProxyContract.address,
          "0x99665804dae7354bedb5f6eb7cd076ba4e984a3a",
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
    
    const gnosisSafe = '';
    
    // await nexusProxyContract.transferOwnership(gnosisSafe);
    
    // await dappTokenProxyContract.transferOwnership(gnosisSafe);

    // console.log("Transferring ownership of ProxyAdmin...");
    // // The owner of the ProxyAdmin can upgrade our contracts
    // await upgrades.admin.transferProxyAdminOwnership(gnosisSafe);
    
    // console.log("Transferred ownership of ProxyAdmin to:", gnosisSafe);
    await delay(10);
    
    console.log("nexus proxy:", nexusProxyContract.address);
    console.log(`proxy admin contract: ${await upgrades.erc1967.getAdminAddress(nexusProxyContract.address)}`);
    
    const nexusContract = await upgrades.erc1967.getImplementationAddress(nexusProxyContract.address);
    // const nexusContract = await upgrades.beacon.getImplementationAddress(nexusProxyContract.address);
    
    console.log(`nexus contract: ${nexusContract}`);
    
    console.log("wait 60s for etherscan backend to catch up");
    await delay(60);
    
    console.log("verifying on etherscan...");
    await hre.run("verify:verify", {
        address: nexusContract,
        constructorArguments: []
    });
    await hre.run("verify:verify", {
        address: "0x99665804dae7354bedb5f6eb7cd076ba4e984a3a",
        constructorArguments: []
    });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });