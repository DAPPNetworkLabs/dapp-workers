//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;
import "@openzeppelin/contracts/access/Ownable.sol";
// import "hardhat/console.sol";

contract DappOraclePolygon is Ownable {
    uint public lastDappUsdPrice;
    uint lastUpdateTime;

    constructor(uint _lastDappUsdPrice) {
        lastDappUsdPrice = _lastDappUsdPrice;
        lastUpdateTime = block.timestamp;
    }

    function updatePrice(uint _lastDappUsdPrice) external onlyOwner {
        require(block.timestamp >= lastUpdateTime + 1 days, "last call <24 hours");
        lastDappUsdPrice = (lastDappUsdPrice * 13 + _lastDappUsdPrice) / 14; // TWAP
        lastUpdateTime = block.timestamp;
    }
}