//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

import "./interfaces/INexus.sol";

import "hardhat/console.sol";

contract Consumer {
    /**
    * Public counter variable
    */
    uint public counter;

    /**
    * Use an interval in seconds and a timestamp to slow execution of Upkeep
    */
    uint public immutable interval;
    uint public lastTimeStamp;
    INexus public nexus;

    constructor(uint updateInterval, address _nexus) {
      interval = updateInterval;
      lastTimeStamp = block.timestamp;

      nexus = INexus(_nexus);

      counter = 0;
    }

    function runJob(address[] calldata dsps) external {
        string[] memory arr = new string[](1);
        arr[0] = "target/wasm32-wasi/release/test";
        nexus.runJob(INexus.runJobArgs(address(this),"wasmrunner","",true,1000000,arr,dsps));
    }

    function _dspcallback(uint val, string calldata outputFS) external {
        counter = val;
    }
}