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

    event UpdatedHash (
        string newHash
    );

    constructor(address _nexus, string memory firstHash) {
        nexus = INexus(_nexus);
        lastHash = firstHash;
    }

    function queueJob(address owner, string calldata inputFS) external {
        string[] memory arr = new string[](0);
        nexus.queueJob(INexus.queueJobArgs(owner,"rust-compiler",inputFS,true,1000000,false,arr));
    }

    function _dspcallback(string calldata outputFS, string  calldata outputHash) external {
        lastHash = outputFS;

        emit UpdatedHash(lastHash);
    }
}