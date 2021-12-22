// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface INexus {
  struct runArgs {
      address consumer;
      string imageName;
      string imageType;
      string inputFS;
      bool callback;
      string[] args;
  }
  function run(runArgs calldata args) external;
  function setConsumerPermissions(address owner) external;
  function setQuorum(address consumer, address[] calldata dsps) external;
}