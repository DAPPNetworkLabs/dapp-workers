// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface INexus {
  struct runJobArgs {
      address consumer;
      string imageName;
      string inputFS;
      bool callback;
      uint gasLimit;
      bool requireConsistent;
      string[] args;
      address[] dsps;
  }
  struct runServiceArgs {
      address consumer;
      string imageName;
      uint ioMegaBytes;
      uint storageMegaBytes;
      string inputFS;
      string[] args;
      uint months;
      address[] dsps;
  }
  function runJob(runJobArgs calldata args) external;
  function setConsumerPermissions(address owner) external;
  function setQuorum(address consumer, address[] calldata dsps) external;
}