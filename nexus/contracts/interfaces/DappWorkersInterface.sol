// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface DappWorkersInterface {
  function checkWork(bytes calldata checkData) external returns (bool workNeeded, bytes memory performData);
  function performWork(bytes calldata performData) external;
  function runJob() external;
  function setQuorum(address consumer, address[] calldata dsps) external;
}