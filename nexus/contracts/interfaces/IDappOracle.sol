// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.7.0 <0.9.0;

interface IDappOracle {
    function lastDappUsdPrice() external view returns (uint);
    function lastDappEthPrice() external view returns (uint);
}