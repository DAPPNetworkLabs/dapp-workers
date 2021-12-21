// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity >=0.7.0 <0.9.0;

interface IBancorNetwork {
    function rateByPath(
        address[] memory _path, 
        uint256 _amount
    ) external view returns (uint256);
}