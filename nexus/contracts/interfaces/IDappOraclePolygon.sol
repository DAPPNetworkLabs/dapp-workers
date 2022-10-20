// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.7.0 <0.9.0;

interface IDappOraclePolygon {
    function lastDappUsdPrice() external view returns (uint);
}