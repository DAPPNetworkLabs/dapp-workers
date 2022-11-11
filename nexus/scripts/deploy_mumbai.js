const hre = require("hardhat");
const delay = s => new Promise(res => setTimeout(res, s*1000));

const workerGasPremium = 700000000;
const fallbackGasPrice = 1000000000000;
const stalenessSeconds = 86400;
const lastUsdDappPrice = 9009009;
const lastDappMaticPrice = 1186277653093940;
const ipfsHash = "QmPdhPDtAruFXZCzBZBhMeYfyMPGd4WPKRazbmKVcF3QWW";

const deploymentAddress = "0x39396235081A7F3372C3D74b52C41fab90444E48";

async function main() {
    await hre.run('compile');

    const nexusTokenFactory = await hre.ethers.getContractFactory("NexusPolygon", deploymentAddress);
    const dappTokenFactory = await hre.ethers.getContractFactory("DappToken", deploymentAddress);
    const oracleFactory = await hre.ethers.getContractFactory("DappOraclePolygon", deploymentAddress);

    const dappTokenContract = await dappTokenFactory.deploy(deploymentAddress);
    const dappOracleContract = await oracleFactory.deploy(
      lastUsdDappPrice, // 1 / $0.00111
      lastDappMaticPrice // (0.00111 / 0.9357) * 1e18 -> (1186277653093940 / 1e18) * .92 = 0.00109137544085
    );

    const nexusProxyContract = await upgrades.deployProxy(nexusTokenFactory, 
      [
        [
          dappTokenContract.address,
          dappOracleContract.address,
          workerGasPremium,
          1e6,
          fallbackGasPrice,
          stalenessSeconds,
          ipfsHash
        ]
      ]
    );
    
    await delay(10);
    
    console.log("nexus proxy:", nexusProxyContract.address);
    console.log(`nexus proxy admin contract: ${await upgrades.erc1967.getAdminAddress(nexusProxyContract.address)}`);
    
    await delay(10);
    
    const nexusContract = await upgrades.erc1967.getImplementationAddress(nexusProxyContract.address);
    
    console.log(`nexus contract: ${nexusContract}`);
    console.log(`dapp contract: ${dappTokenContract.address}`);
    console.log(`oracle contract: ${dappOracleContract.address}`);
    
    console.log("wait 60s for etherscan backend to catch up");
    await delay(120);
    
    console.log("verifying on etherscan...");
    try {
      await hre.run("verify:verify", {
        address: nexusContract,
        constructorArguments: []
      });
    } catch(e) {
      console.log(`issue with nexus`)
      console.log(e)
    }
    await delay(2);
    try {
      await hre.run("verify:verify", {
          address: dappTokenContract.address,
          constructorArguments: [
            deploymentAddress
          ]
      });
    } catch(e) {
      console.log(`issue with token`)
      console.log(e)
    }
    await delay(2);
    try {
      await hre.run("verify:verify", {
          address: dappOracleContract.address,
          constructorArguments: [
            lastUsdDappPrice,
            lastDappMaticPrice
          ]
      });
    } catch(e) {
      console.log(`issue with oracle`)
      console.log(e)
    }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });