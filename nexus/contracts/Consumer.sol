//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;

import "./interfaces/INexus.sol";

import "hardhat/console.sol";

contract Consumer {
    /**
    * Last state hash
    */
    string public lastHash;

    INexus public nexus;

    constructor(address _nexus) {
        nexus = INexus(_nexus);
    }

    function queueJob(address owner) external {
        string[] memory arr = new string[](1);
        arr[0] = "target/wasm32-wasi/release/test";
        nexus.queueJob(INexus.queueJobArgs(owner,"wasmrunner","",true,1000000,false,arr));
    }

    function _dspcallback(string calldata outputFS, string  calldata outputHash) external {
        // use outputFS for logic...
        lastHash = outputHash;
    }
}