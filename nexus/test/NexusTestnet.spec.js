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
  
const runEvent = async (event, nexusContract) => {
  const id = await nexusContract.lastJobID();
  let error,hash,output;

  const eventPromise = new Promise((resolve, reject) => {
    if(event === "JobResult") {
      nexusContract.on(event, (
        consumer, 
        worker, 
        outputFS, 
        outputHash,
        dapps,
        jobID
      ) => {
        if(Number(id) === Number(jobID)) {
          hash = outputHash
          output = outputFS
          resolve(outputFS);
        }
      });
    } else if(event === "JobError") {
      nexusContract.on(event, (
          consumer,
          stdErr, 
          outputFS, 
          jobID
        ) => {
          if(Number(id) === Number(jobID)) {
            error = stdErr
            output = outputFS
            resolve(outputFS);
          }
        });
    } else if(event === "ServiceRunning") {
      nexusContract.on(event, (
          consumer, 
          worker, 
          serviceId, 
          port
        ) => {
          if(Number(id) === Number(serviceId))
            resolve();
        });
    } else if(event === "ServiceComplete") {
        nexusContract.on(event, (
            consumer,
            worker, 
            outputFS, 
            serviceId
        ) => {
          if(Number(id) === Number(serviceId)) {
            output = outputFS
            resolve(outputFS);
          }
        });
    } else if(event === "ServiceError") {
        nexusContract.on(event, (
            consumer,
            worker, 
            stdErr,
            outputFS, 
            serviceId
        ) => {
          if(Number(id) === Number(serviceId)) {
            error = stdErr
            output = outputFS
            resolve(outputFS);
          }
        });
    }
  });

  await eventPromise.then(val => {
    outputFSRes = val;
  });
  
  await nexusContract.removeAllListeners(event);
  
  return {
    id,
    error,
    output,
    hash
  };
}

describe("NexusTestnet", function(done) {
  this.timeout(200000);
  let owner, addr1, addr2, addr3, worker1, worker2, addrs, consumer1, consumer2, consumer3;
  let dappTokenContract, nexusContract, consumerContract;

  before(async function() {
    [owner, addr1, addr2, addr3, worker1, worker2, ...addrs] = await ethers.getSigners();

    const dappTokenFactory = await ethers.getContractFactory("DappToken", addr1);
    console.log("addr1",addr1.address);
    // console.log("addr2",addr2.address);
    const nexusTokenFactory = await ethers.getContractFactory("NexusTestnet", addr1);
    const consumerTokenFactory = await ethers.getContractFactory("Consumer", addr2);

    await delay(1);
    dappTokenContract = await dappTokenFactory.deploy();
    await delay(1);
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
    await delay(1);
    
    // console.log(`proxy address: ${nexusContract.address}\n nexus address: ${await upgrades.erc1967.getImplementationAddress(nexusContract.address)}`);
    
    consumerContract = await consumerTokenFactory.deploy(nexusContract.address, "hash");

    if(process.env.PRIVATE_KEY) {
      console.log('hit private key');
      worker1 = new ethers.Wallet("278c2ff8b0fa8bbe04c430a66c828f8b2386a0e9c075b8923d257c3be30c697d",worker1.provider);
      consumer1 = new ethers.Wallet("0xc327bdb598a257632f48e4368ebe7be66a40daff34569c2f2ba36ee96e893674",worker1.provider);
      consumer2 = new ethers.Wallet("0xa62d3d80840579bf62183c2c3ad2344aebeccec44b1ba719aa06f39ab47d7d5c",worker1.provider);
      consumer3 = new ethers.Wallet("0x2aab7d1aeca546199474f49fea602c644b96b87654a8aa834b2bf9b110bd8939",worker1.provider);
      console.log("worker1",worker1.address);
      console.log("consumer1",consumer1.address);
      console.log("consumer2",consumer2.address);
      console.log("consumer3",consumer3.address);
      
      let dapps = ethers.utils.parseUnits("80000000000",4);
      await dappTokenContract.mint("0x21dfA04241ca05320E9dCd529F15f6F55115bbC3", dapps);
      await delay(1);
      await dappTokenContract.connect(consumer1).approve(nexusContract.address, dapps);
      await delay(1);
      await dappTokenContract.mint("0x845a35dCC68A249243Cb08E16cE0889f9CbA4d67", dapps);
      await delay(1);
      await dappTokenContract.connect(consumer2).approve(nexusContract.address, dapps);
      await delay(1);
      await dappTokenContract.mint("0x6a313c74e27CB90F4D78C232f9690736b84C880c", dapps);
      await delay(1);
      await dappTokenContract.connect(consumer3).approve(nexusContract.address, dapps);
      await delay(1);

      // preload frontend
      if(process.env.RUN_LOCAL) {
        await nexusContract.approveImage("natpdev/runner","4c7c21ed985e63408f6af7beabbc940ca379c6b020080d24b91ae8e318f61cd6");
        await nexusContract.approveImage("natpdev/rust-compiler","febdd389458f9ea76d1b1b1324bcf86f8eaab1f5c97ac64fbacbc4bacbc06303");
        await nexusContract.approveImage("natpdev/wasi-service","89ed49bed157948ac1192fc5d7ae4922689cfab00271be5998bdfb50a1fdbd42");
        await nexusContract.approveImage("natpdev/git-cloner","eb92996be3dc34050f1d2c2c2ebb52d6993ab9e079a6e68435ef3a117b523a09");
        await nexusContract.approveImage("natpdev/sol-runner","ae8133b1ed18ab8549a27f5211a096747221cf23ff279f67b539502f2dbccce5");
        await nexusContract.approveImage("natpdev/monte-carlo","d4bf9a42ed0a0a875d4583dc2c64a0e5f4d523fe01ba5c1b3686b6aa5865074a");
        await nexusContract.approveImage("natpdev/poa-evm","19d02f7c0973314e871a403910382f82f531d32e6d606facb560edcdfe4b9924");
        await nexusContract.approveImage("natpdev/nvidia-docker","535fe08b1f0b6b8be4b2b3fac19a9fa77b4d9808b09654ac3bf679a80736bbc4");
        await nexusContract.connect(worker1).regWORKER(process.env.WORKER_ENDPOINT || "https://dapp-workers-api.liquidapps.io");
        await nexusContract.setWorkers([worker1.address]);
        // await nexusContract.connect(consumer1).setWorkers([worker1.address]);
        // await nexusContract.connect(consumer2).setWorkers([worker1.address]);
        // await nexusContract.connect(consumer3).setWorkers([worker1.address]);
        dapps = ethers.utils.parseUnits("80000000",4);
        await dappTokenContract.mint(addr1.address, dapps);
        await dappTokenContract.approve(nexusContract.address, dapps);
        await nexusContract.buyGasFor(dapps, addr1.address, worker1.address);
        // await nexusContract.connect(consumer1).buyGasFor(dapps, consumer1.address, worker1.address);
        // await nexusContract.connect(consumer2).buyGasFor(dapps, consumer2.address, worker1.address);
        // await nexusContract.connect(consumer3).buyGasFor(dapps, consumer3.address, worker1.address);
        await nexusContract.connect(worker1).setDockerImage("natpdev/runner",100000,100000);
        await nexusContract.connect(worker1).setDockerImage("natpdev/rust-compiler",100000,100000);
        await nexusContract.connect(worker1).setDockerImage("natpdev/wasi-service",100000,100000);
        await nexusContract.connect(worker1).setDockerImage("natpdev/git-cloner",100000,100000);
        await nexusContract.connect(worker1).setDockerImage("natpdev/sol-runner",100000,100000);
        await nexusContract.connect(worker1).setDockerImage("natpdev/monte-carlo",100000,100000);
        await dappTokenContract.approve(nexusContract.address, ethers.utils.parseUnits("80000000",4));
	      console.log('ran local');
      }
    }

    // console.log(`nexus contract: ${nexusContract.address}`);
    // console.log(`dapp contract: ${dappTokenContract.address}`);
    // console.log(`consumer contract: ${consumerContract.address}`);

    if(process.env.ONLY_CONTRACTS) {
      console.log('hit done');
      done()
    }
  });

  /*

    Todo tests
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
    expect(config.fallbackGasPrice).to.equal(config.fallbackGasPrice);
  });

  it("Deprecate WORKER", async function() {
    await nexusContract.connect(worker1).deprecateWORKER();

    const registeredWORKERs = await nexusContract.registeredWORKERs(worker1.address);

    expect(registeredWORKERs.active).to.equal(false);
    expect(registeredWORKERs.endpoint).to.equal("deprecated");
  });

  it("Register WORKER", async function() {
    await nexusContract.connect(worker1).regWORKER("http://api:80/dapp-workers");

    const registeredWORKERs = await nexusContract.registeredWORKERs(worker1.address);

    expect(registeredWORKERs.active).to.equal(true);
    expect(registeredWORKERs.endpoint).to.equal("http://api:80/dapp-workers");
    expect(registeredWORKERs.claimableDapp.toString()).to.equal('0');
  });

  it("Buy dapp gas", async function() {
    const dapps = ethers.utils.parseUnits("8000000",4);
    await dappTokenContract.mint(addr1.address, dapps);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.buyGasFor(dapps, addr1.address, worker1.address);

    const workerData = await nexusContract.workerData(addr1.address, worker1.address);

    expect(workerData.amount).to.equal(dapps);
  });

  it("Sell dapp gas", async function() {
    const dapps = ethers.utils.parseUnits("1000000",4);
    const dappsLeft = ethers.utils.parseUnits("7000000",4);

    await nexusContract.sellGas(dapps, worker1.address);

    const workerData = await nexusContract.workerData(addr1.address, worker1.address);

    expect(workerData.amount.toString()).to.equal(dappsLeft);
  });

  it("Approve image", async function() {
    await nexusContract.approveImage("natpdev/runner","4c7c21ed985e63408f6af7beabbc940ca379c6b020080d24b91ae8e318f61cd6");

    const hash = await nexusContract.approvedImages("natpdev/runner");

    expect(hash).to.equal("4c7c21ed985e63408f6af7beabbc940ca379c6b020080d24b91ae8e318f61cd6");
  });

  it("Register image", async function() {
    await nexusContract.connect(worker1).setDockerImage("natpdev/runner",200000,200000);

    const dockerImage = await nexusContract.workerApprovedImages(worker1.address,"natpdev/runner");

    expect(dockerImage.jobFee.toString()).to.equal('200000');
    expect(dockerImage.baseFee.toString()).to.equal('200000');
  });

  it("Update image", async function() {
    await nexusContract.connect(worker1).updateDockerImage("natpdev/runner",100000,100000);

    const dockerImage = await nexusContract.workerApprovedImages(worker1.address,"natpdev/runner");

    expect(dockerImage.jobFee.toString()).to.equal('100000');
    expect(dockerImage.baseFee.toString()).to.equal('100000');
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
    await nexusContract.approveImage("natpdev/rust-compiler","febdd389458f9ea76d1b1b1324bcf86f8eaab1f5c97ac64fbacbc4bacbc06303");
    await nexusContract.connect(worker1).setDockerImage("natpdev/rust-compiler",100000,100000);
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "natpdev/rust-compiler",
      inputFS: loadfsRoot("pngWriterTest"),
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: []
    });
    
    const {id} = await runEvent("JobResult",nexusContract);

    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "natpdev/runner",
      inputFS: outputFSRes,
      // inputFS: "QmPDKw5a5THGW4PDKcddQ6r2Tq3uNwfyKmzX62ovC6dKqx",
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: ["target/wasm32-wasi/release/test"]
    });
    
    const id2 = await nexusContract.lastJobID();

    const job = await nexusContract.jobs(id);

    expect(job.consumer).to.equal(addr1.address);
    expect(job.callback).to.equal(false);
    expect(job.resultsCount.toString()).to.equal('1');
    expect(job.imageName).to.equal("natpdev/rust-compiler");

    const job2 = await nexusContract.jobs(id2);

    expect(job2.consumer).to.equal(addr1.address);
    expect(job2.callback).to.equal(false);
    expect(job2.resultsCount.toString()).to.equal('0');
    expect(job2.imageName).to.equal("natpdev/runner");

    const postTotalDappGasPaid = await nexusContract.totalDappGasPaid();
    expect(postTotalDappGasPaid).is.above(prevTotalDappGasPaid);
  });

  it.skip("Queue job - nvidia-docker", async function() {
    const prevTotalDappGasPaid = await nexusContract.totalDappGasPaid();
    await nexusContract.approveImage("natpdev/nvidia-docker","535fe08b1f0b6b8be4b2b3fac19a9fa77b4d9808b09654ac3bf679a80736bbc4");
    await nexusContract.connect(worker1).setDockerImage("natpdev/nvidia-docker",100000,100000);
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "natpdev/nvidia-docker",
      inputFS: "",
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: ["nvidia-smi"]
    });
    
    await runEvent("JobResult",nexusContract);
  });

  it("Queue job hash mismatch", async function() {
    await nexusContract.unapproveImage("natpdev/rust-compiler","febdd389458f9ea76d1b1b1324bcf86f8eaab1f5c97ac64fbacbc4bacbc06303");
    await nexusContract.approveImage("natpdev/rust-compiler","hash");
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "natpdev/rust-compiler",
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
          console.log('firing error',stdErr,Number(id) === Number(id1));
          if(Number(id) == Number(id1)) {
            error = stdErr
            resolve();
          }
        }
      );
    });
    
    await completePromise.then();
  
    await nexusContract.removeAllListeners("JobError");

    await nexusContract.unapproveImage("natpdev/rust-compiler","hash");
    await nexusContract.approveImage("natpdev/rust-compiler","febdd389458f9ea76d1b1b1324bcf86f8eaab1f5c97ac64fbacbc4bacbc06303");

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
    expect(job.imageName).to.equal("natpdev/rust-compiler");
    
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
  
    await consumerContract.removeAllListeners("UpdatedHash");

    const lastHash = await consumerContract.lastHash();

    expect(lastHash).to.equal("QmPDKw5a5THGW4PDKcddQ6r2Tq3uNwfyKmzX62ovC6dKqx");
  });
  
  it("Queue service", async function() {
    await nexusContract.approveImage("natpdev/rust-compiler","febdd389458f9ea76d1b1b1324bcf86f8eaab1f5c97ac64fbacbc4bacbc06303");
    await nexusContract.connect(worker1).setDockerImage("natpdev/rust-compiler",100000,100000);
    await nexusContract.approveImage("natpdev/wasi-service","89ed49bed157948ac1192fc5d7ae4922689cfab00271be5998bdfb50a1fdbd42");
    await nexusContract.connect(worker1).setDockerImage("natpdev/wasi-service",100000,100000);
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "natpdev/rust-compiler",
      inputFS: loadfsRoot("serviceTest"),
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: []
    });
    
    await runEvent("JobResult",nexusContract);

    await nexusContract.queueService({
      owner: addr1.address,
      imageName: "natpdev/wasi-service",
      inputFS: outputFSRes,
      // inputFS: "QmPDKw5a5THGW4PDKcddQ6r2Tq3uNwfyKmzX62ovC6dKqx",
      args: ["target/wasm32-wasi/release/test"],
      months: 1
    });
    
    const id1 = await nexusContract.lastJobID();

    const service = await nexusContract.services(id1);

    expect(service.consumer).to.equal(addr1.address);
    expect(service.imageName).to.equal("natpdev/wasi-service");
    
    await runEvent("ServiceRunning",nexusContract);

    const endpoint = await nexusContract.getWORKEREndpoint(worker1.address);

    expect(endpoint).to.equal(`${endpoint}`);
    
    await delay(20);
    
    // console.log('endpoint',`${endpoint}?id=${id1}&image=wasi-service&text=true`);

    const response = await fetch(
      `${endpoint}?id=${id1}&image=wasi-service&text=true`, 
      { method: 'GET' }
    );
    const body = await response.text();

    expect(body).to.equal('foo');
  });

  it("Queue service - poa-evm", async function() {
    // await nexusContract.connect(worker1).regWORKER("http://api:80/dapp-workers");
    await nexusContract.approveImage("natpdev/poa-evm","19d02f7c0973314e871a403910382f82f531d32e6d606facb560edcdfe4b9924");
    await nexusContract.connect(worker1).setDockerImage("natpdev/poa-evm",100000,100000);
    
    await nexusContract.queueService({
      owner: addr1.address,
      imageName: "natpdev/poa-evm",
      inputFS: "",
      args: ["a6a0d343688a862cf30ccb478f77986a5e1789b2"],
      months: 1
    });
    
    const id1 = await nexusContract.lastJobID();

    const service = await nexusContract.services(id1);

    expect(service.consumer).to.equal(addr1.address);
    expect(service.imageName).to.equal("natpdev/poa-evm");
    
    const servicePromise = new Promise((resolve, reject) => {
        nexusContract.on("ServiceRunning", (
            consumer, 
            worker, 
            serviceId, 
            port
          ) => {
            if(Number(id1) === Number(serviceId))
              resolve();
          }
        );
    });

    await servicePromise.then();
  
    await nexusContract.removeAllListeners("ServiceRunning");

    const endpoint = await nexusContract.getWORKEREndpoint(worker1.address);
    
    // console.log('endpoint',`${endpoint}?id=${id1}&image=poa-evm`);

    expect(endpoint).to.equal(`${endpoint}`);
    
    await delay(20);

    // using 8545 because inside docker compose use internal ports
    const response = await fetch(`${endpoint}?id=${id1}&image=poa-evm`, {
      method: 'POST', 
      body:'{"id":0,"jsonrpc":"2.0","method": "eth_blockNumber", "params": []}',
      headers: { "Content-Type": "application/json" }
    });
    
    const body = await response.json();

    expect(body.jsonrpc).to.equal("2.0");
  });

  it("Queue service with callback", async function() {
    const dapps = ethers.utils.parseUnits("250000",4);
    await dappTokenContract.mint(addr2.address, dapps);
    await dappTokenContract.connect(addr2).approve(nexusContract.address, dapps);
    await nexusContract.connect(addr2).buyGasFor(dapps, consumerContract.address, worker1.address);
    await nexusContract.connect(addr2).setWorkers([worker1.address]);

    await consumerContract.queueService(addr2.address, "QmQSv2U14iRKDqBvJgJo1eixJWq6cTqRgY9QgAnBUe9fdM");
    
    const id1 = await nexusContract.lastJobID();
    
    await runEvent("ServiceRunning",nexusContract);

    const endpoint = await nexusContract.getWORKEREndpoint(worker1.address);

    expect(endpoint).to.equal(`${endpoint}`);
    
    console.log('endpoint',`${endpoint}?id=${id1}&image=wasi-service&text=true`);
    
    await delay(20);

    const response = await fetch(`${endpoint}?id=${id1}&image=wasi-service&text=true`, {method: 'GET'});
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
      await nexusContract.connect(worker1).serviceCallback(5);
    } catch(e) {
      failed = true;
    }

    expect(failed).to.equal(true);
  });
  
  it("Run job - error", async function() {
    const preWorkerBal = (await nexusContract.registeredWORKERs(worker1.address)).claimableDapp;

    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "natpdev/runner",
      inputFS: "", // no input error
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: ["target/wasm32-wasi/release/test"]
    });
    
    const id = await nexusContract.lastJobID();
    
    await runEvent("JobError",nexusContract);

    const postWorkerBal = (await nexusContract.registeredWORKERs(worker1.address)).claimableDapp;
    
    // ensure get base payment for job
    expect(postWorkerBal).is.above(preWorkerBal);
    
    const isCocmplete1 = await nexusContract.jobServiceCompleted(id,worker1.address,true);

    expect(isCocmplete1).to.equal(true);
  });

  it.skip("Run service - error", async function() {
    const preWorkerBal = (await nexusContract.registeredWORKERs(worker1.address)).claimableDapp;

    await nexusContract.queueService({
      owner: addr1.address,
      imageName: "natpdev/wasi-service",
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
              expect(stdErr).to.equal("error dispatching");
              resolve();
            }
          }
        );
    });
    
    await completePromise.then();
  
    await nexusContract.removeAllListeners("ServiceError");

    const postWorkerBal = (await nexusContract.registeredWORKERs(worker1.address)).claimableDapp;
    
    // ensure get base payment for job
    expect(postWorkerBal).is.above(preWorkerBal);
    
    const isCocmplete1 = await nexusContract.jobServiceCompleted(id,worker1.address,false);

    expect(isCocmplete1).to.equal(true);
  });

  it("Extend service", async function() {
    const preWorkerEnDate = (await nexusContract.services(6)).endDate;

    const dapps = ethers.utils.parseUnits("200000",4);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.extendService(
      6,
      "natpdev/wasi-service",
      1
    );

    const postWorkerEnDate = (await nexusContract.services(6)).endDate;
    
    expect(postWorkerEnDate).is.above(preWorkerEnDate);
  });

  it("Extend service same month", async function() {
    const preWorkerEnDate = (await nexusContract.services(6)).endDate;

    const dapps = ethers.utils.parseUnits("200000",4);
    await dappTokenContract.approve(nexusContract.address, dapps);
    await nexusContract.extendService(
      6,
      "natpdev/wasi-service",
      0
    );

    const postWorkerEnDate = (await nexusContract.services(6)).endDate;
    
    expect(postWorkerEnDate).to.equal(preWorkerEnDate);
  });

  it("Get get max payment for gas", async function() {
    const data = await nexusContract.getMaxPaymentForGas("1000000","natpdev/runner",worker1.address);
    
    expect(data).is.above(100000000);
  });

  it.skip("Queue job git-cloner", async function() {
    await nexusContract.approveImage("natpdev/git-cloner","eb92996be3dc34050f1d2c2c2ebb52d6993ab9e079a6e68435ef3a117b523a09");
    await nexusContract.connect(worker1).setDockerImage("natpdev/git-cloner",100000,100000);
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "natpdev/git-cloner",
      inputFS: loadfsRoot("solidityRunner"),
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: []
    });
    
    const { id } = await runEvent("JobResult",nexusContract);

    const job = await nexusContract.jobs(id);

    expect(job.consumer).to.equal(addr1.address);
    expect(job.callback).to.equal(false);
    expect(job.resultsCount.toString()).to.equal('1');
    expect(job.imageName).to.equal("natpdev/git-cloner");
    expect(outputFSRes).to.equal("QmcREDmdnLtn41V4JGADUA81eQEPeJ86raGETT43ShJqNU");
  });

  it.skip("Queue job sol-runner", async function() {
    await nexusContract.approveImage("natpdev/sol-runner","ae8133b1ed18ab8549a27f5211a096747221cf23ff279f67b539502f2dbccce5");
    await nexusContract.connect(worker1).setDockerImage("natpdev/sol-runner",100000,100000);
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "natpdev/sol-runner",
      inputFS: "QmezhC5XeojouKMuBNEbyP36J8K6HW6mLdUJF5aBeUexKB",
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: ["example-solidity-runner"]
    });
    
    const { id } = await runEvent("JobResult",nexusContract);
    const job = await nexusContract.jobs(id);

    expect(job.consumer).to.equal(addr1.address);
    expect(job.callback).to.equal(false);
    expect(job.resultsCount.toString()).to.equal('1');
    expect(job.imageName).to.equal("natpdev/sol-runner");
    expect(Number(outputFSRes)).to.equal(18);
  });

  it.skip("Queue job monte-carlo", async function() {
    await nexusContract.approveImage("natpdev/git-cloner","eb92996be3dc34050f1d2c2c2ebb52d6993ab9e079a6e68435ef3a117b523a09");
    await nexusContract.connect(worker1).setDockerImage("natpdev/git-cloner",100000,100000);
    
    await nexusContract.approveImage("natpdev/monte-carlo","d4bf9a42ed0a0a875d4583dc2c64a0e5f4d523fe01ba5c1b3686b6aa5865074a");
    await nexusContract.connect(worker1).setDockerImage("natpdev/monte-carlo",100000,100000);
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "natpdev/git-cloner",
      inputFS: loadfsRoot("monteCarlo"),
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: []
    });
    
    await runEvent("JobResult",nexusContract);
    
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "natpdev/monte-carlo",
      inputFS: outputFSRes,
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: ["example-monte-carlo"]
    });
    
    const { id } = await runEvent("JobResult",nexusContract);
    const job = await nexusContract.jobs(id);

    expect(job.consumer).to.equal(addr1.address);
    expect(job.callback).to.equal(false);
    expect(job.resultsCount.toString()).to.equal('1');
    expect(job.imageName).to.equal("natpdev/monte-carlo");
    expect(Number(outputFSRes)).is.above(3);
  });

  it("Run service - complete", async function() {
    await nexusContract.queueJob({
      owner: addr1.address,
      imageName: "natpdev/rust-compiler",
      inputFS: loadfsRoot("serviceTest"),
      callback: false,
      gasLimit: 1000000,
      requiresConsistent: false,
      args: []
    });
    
    await runEvent("JobResult",nexusContract);
    
    const preWorkerBal = (await nexusContract.registeredWORKERs(worker1.address)).claimableDapp;

    await nexusContract.queueService({
      owner: addr1.address,
      imageName: "natpdev/wasi-service",
      inputFS: outputFSRes,
      args: ["target/wasm32-wasi/release/test"],
      months: 1
    });
    
    const { id } = await runEvent("ServiceRunning",nexusContract);

    let failed = false;
    try {
      await nexusContract.connect(worker1).serviceComplete({
        jobID: id,
        outputFS: ""
      });
    } catch(e) {
      failed = true;
    }

    expect(failed).to.equal(true);
    
    const timestamp = (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp;
    await ethers.provider.send("evm_mine", [ timestamp + (30 * 1000 * 10 * 10 * 10) ]);
    
    const id2 = await nexusContract.lastJobID();
    
    await runEvent("ServiceComplete",nexusContract);

    const postWorkerBal = (await nexusContract.registeredWORKERs(worker1.address)).claimableDapp;
    
    expect(postWorkerBal).is.above(preWorkerBal);

    const endpoint = await nexusContract.getWORKEREndpoint(worker1.address);

    const res = await fetch(`${endpoint}?id=${id2}&image=wasi-service&text=true`, {method: 'GET'});

    expect(res.status.toString()).to.equal('500');
    
    const isCocmplete = await nexusContract.jobServiceCompleted(id2,worker1.address,false);
    
    expect(isCocmplete).to.equal(true);
  });

  // test relies on above increase time to assume the feed is stale
  it("Get get max payment for gas with fallback time", async function() {
    const data = await nexusContract.getMaxPaymentForGas("1000000","natpdev/runner",worker1.address);
    
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
    const approved = await nexusContract.isImageApprovedForWORKER(worker1.address,"natpdev/runner");
    
    expect(approved).to.equal(true);
  });

  it("Unapprove image for worker", async function() {
    await nexusContract.connect(worker1).unapproveDockerForWORKER("natpdev/runner");

    const approved = await nexusContract.isImageApprovedForWORKER(worker1.address,"natpdev/runner");
    
    expect(approved).to.equal(false);
  });

  it("Get worker endpoint", async function() {
    const endpoint = await nexusContract.getWORKEREndpoint(worker1.address);

    expect(endpoint).to.equal("http://api:80/dapp-workers");
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

    expect(workerData[0].endpoint).to.equal('http://api:80/dapp-workers');
  });
});
