//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;
// import "hardhat/console.sol";

contract DappOraclePolygon {
    uint public lastUsdDappPrice;
    uint lastUpdateTime;
    public address owner;

    constructor(uint _lastUsdDappPrice) {
        // USD/DAPP means how much DAPP for 1 USD
        lastUsdDappPrice = _lastUsdDappPrice;
        lastUpdateTime = block.timestamp;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function updateOwner(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    function updatePrice(uint _lastUsdDappPrice) external onlyOwner {
        require(block.timestamp >= lastUpdateTime + 1 days, "last call <24 hours");
        require(_lastUsdDappPrice > 0, "> 0");
        lastUsdDappPrice = (lastUsdDappPrice * 13 + _lastUsdDappPrice) / 14; // TWAP
        lastUpdateTime = block.timestamp;
    }
}