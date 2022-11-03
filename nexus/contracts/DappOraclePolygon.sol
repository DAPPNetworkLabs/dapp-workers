//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;
import "@openzeppelin/contracts/access/Ownable.sol";
// import "hardhat/console.sol";

contract DappOraclePolygon is Ownable {
    uint public lastUsdDappPrice;
    uint public lastDappMaticPrice;
    uint lastUpdateTime;

    constructor(uint _lastUsdDappPrice, uint _lastDappMaticPrice) {
        // USD/DAPP means how much DAPP for 1 USD
        lastUsdDappPrice = _lastUsdDappPrice;
        // DAPP/MATIC means how much MATIC for 1 DAPP
        lastDappMaticPrice = _lastDappMaticPrice;
        lastUpdateTime = block.timestamp;
    }

    function updatePrice(uint _lastUsdDappPrice, uint _lastDappMaticPrice) external onlyOwner {
        require(block.timestamp >= lastUpdateTime + 1 days, "last call <24 hours");
        require(_lastUsdDappPrice > 0 && _lastDappMaticPrice > 0, "> 0");
        lastUsdDappPrice = (lastUsdDappPrice * 13 + _lastUsdDappPrice) / 14; // TWAP
        lastDappMaticPrice = (lastDappMaticPrice * 13 + _lastDappMaticPrice) / 14; // TWAP
        lastUpdateTime = block.timestamp;
    }
}