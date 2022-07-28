//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;
import "@openzeppelin/contracts/access/Ownable.sol";
// import "hardhat/console.sol";

contract DappOracleGasUsd is Ownable {
    uint public lastDappUsdPrice;
    uint public lastGasPriceWei;

    constructor(uint _lastDappUsdPrice, uint _lastGasPriceWei) {
        lastDappUsdPrice = _lastDappUsdPrice;
        lastGasPriceWei = _lastGasPriceWei;
    }

    function updatePrice(uint _lastDappUsdPrice, uint _lastGasPriceWei) external onlyOwner {
        lastDappUsdPrice = _lastDappUsdPrice;
        lastGasPriceWei = _lastGasPriceWei;
    }
}