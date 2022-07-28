//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;
import "@openzeppelin/contracts/access/Ownable.sol";
// import "hardhat/console.sol";

contract DappOracleDapp is Ownable {
    uint public lastDappUsdPrice;
    uint public lastDappEthPrice;

    constructor(uint _lastDappUsdPrice, uint _lastDappEthPrice) {
        lastDappUsdPrice = _lastDappUsdPrice;
        lastDappEthPrice = _lastDappEthPrice;
    }

    function updatePrice(uint _lastDappUsdPrice, uint _lastDappEthPrice) external onlyOwner {
        lastDappUsdPrice = _lastDappUsdPrice;
        lastDappEthPrice = _lastDappEthPrice;
    }
}