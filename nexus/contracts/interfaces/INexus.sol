// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface INexus {
  struct queueJobArgs {
    address consumer;
    string imageName;
    string inputFS;
    bool callback;
    uint gasLimit;
    bool requireConsistent;
    string[] args;
  }
  function queueJob(queueJobArgs calldata args) external;
  function setConsumerPermissions(address owner) external;
  function setQuorum(address consumer, address[] calldata dsps) external;
}