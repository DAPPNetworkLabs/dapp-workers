Compiling 33 files with 0.8.17
Solidity compilation finished successfully

Solidity 0.8.17 is not fully supported yet. You can still use Hardhat, but some features, like stack traces, might not work correctly.

Learn more at https://hardhat.org/reference/solidity-support

Warning: Unnamed return variable can remain unassigned. Add an explicit return with value to all non-reverting code paths or name the variable.
   --> contracts/Nexus.sol:429:102:
    |
429 |     function getMinBalance(uint256 id, string memory jobType, address worker) external view returns (uint) {
    |                                                                                                      ^^^^


Warning: Unnamed return variable can remain unassigned. Add an explicit return with value to all non-reverting code paths or name the variable.
   --> contracts/NexusBSC.sol:386:102:
    |
386 |     function getMinBalance(uint256 id, string memory jobType, address worker) external view returns (uint) {
    |                                                                                                      ^^^^


Warning: Unnamed return variable can remain unassigned. Add an explicit return with value to all non-reverting code paths or name the variable.
   --> contracts/NexusPrivate.sol:386:102:
    |
386 |     function getMinBalance(uint256 id, string memory jobType, address worker) external view returns (uint) {
    |                                                                                                      ^^^^


Warning: Unnamed return variable can remain unassigned. Add an explicit return with value to all non-reverting code paths or name the variable.
   --> contracts/NexusTestnet.sol:386:102:
    |
386 |     function getMinBalance(uint256 id, string memory jobType, address worker) external view returns (uint) {
    |                                                                                                      ^^^^


Warning: Unused function parameter. Remove or comment out the variable name to silence this warning.
  --> contracts/Consumer.sol:36:56:
   |
36 |     function _workercallback(string calldata outputFS, string  calldata outputHash) external {
   |                                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^




AggregatorV3Interface is re-used:
        - AggregatorV3Interface (node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol#4-32)
        - AggregatorV3Interface (contracts/interfaces/AggregatorV3Interface.sol#4-36)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#name-reused

Nexus.calcJobDapps(string,address) (contracts/Nexus.sol#963-965) performs a multiplication on the result of a division:
        - getDappUsd() * (workerApprovedImages[worker][imageName].jobFee / usdtPrecision) (contracts/Nexus.sol#964)
NexusBSC.calcJobDapps(string,address) (contracts/NexusBSC.sol#920-922) performs a multiplication on the result of a division:
        - getDappUsd() * (workerApprovedImages[worker][imageName].jobFee / usdtPrecision) (contracts/NexusBSC.sol#921)
NexusPrivate.calcJobDapps(string,address) (contracts/NexusPrivate.sol#922-924) performs a multiplication on the result of a division:
        - getDappUsd() * (workerApprovedImages[worker][imageName].jobFee / usdtPrecision) (contracts/NexusPrivate.sol#923)
NexusTestnet.calcJobDapps(string,address) (contracts/NexusTestnet.sol#920-922) performs a multiplication on the result of a division:
        - getDappUsd() * (workerApprovedImages[worker][imageName].jobFee / usdtPrecision) (contracts/NexusTestnet.sol#921)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#divide-before-multiply

NexusBSC.jobCallback(NexusBSC.jobCallbackArgs).gasUsed (contracts/NexusBSC.sol#496) is a local variable never initialized
NexusTestnet.jobCallback(NexusTestnet.jobCallbackArgs).gasUsed (contracts/NexusTestnet.sol#496) is a local variable never initialized
NexusPolygon.jobCallback(NexusPolygon.jobCallbackArgs).gasUsed (contracts/NexusPolygon.sol#554) is a local variable never initialized
Nexus.jobCallback(Nexus.jobCallbackArgs).gasUsed (contracts/Nexus.sol#539) is a local variable never initialized
NexusPrivate.jobCallback(NexusPrivate.jobCallbackArgs).gasUsed (contracts/NexusPrivate.sol#496) is a local variable never initialized
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#uninitialized-local-variables

Nexus.setDockerImage(string,uint256,uint256).owner (contracts/Nexus.sol#851) shadows:
        - OwnableUpgradeable.owner() (node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#40-42) (function)
NexusBSC.setDockerImage(string,uint256,uint256).owner (contracts/NexusBSC.sol#808) shadows:
        - OwnableUpgradeable.owner() (node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#40-42) (function)
NexusPolygon.setDockerImage(string,uint256,uint256).owner (contracts/NexusPolygon.sol#873) shadows:
        - OwnableUpgradeable.owner() (node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#40-42) (function)
NexusPrivate.setDockerImage(string,uint256,uint256).owner (contracts/NexusPrivate.sol#808) shadows:
        - OwnableUpgradeable.owner() (node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#40-42) (function)
NexusTestnet.setDockerImage(string,uint256,uint256).owner (contracts/NexusTestnet.sol#808) shadows:
        - OwnableUpgradeable.owner() (node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#40-42) (function)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#local-variable-shadowing

Nexus.getDappUsd() (contracts/Nexus.sol#1076-1086) has external calls inside a loop: bancorNetwork.rateByPath(table,1000000) (contracts/Nexus.sol#1085)
Nexus.getFeedData() (contracts/Nexus.sol#1094-1107) has external calls inside a loop: (None,feedValue,None,timestamp,None) = FAST_GAS_FEED.latestRoundData() (contracts/Nexus.sol#1100)
Nexus.getDappEth() (contracts/Nexus.sol#1061-1071) has external calls inside a loop: bancorNetwork.rateByPath(table,10000) (contracts/Nexus.sol#1070)
AddressUpgradeable.functionCallWithValue(address,bytes,uint256,string) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#128-139) has external calls inside a loop: (success,returndata) = target.call{value: value}(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#137)
NexusBSC.getDappUsd() (contracts/NexusBSC.sol#1025-1027) has external calls inside a loop: dappOracle.lastDappUsdPrice() (contracts/NexusBSC.sol#1026)
NexusBSC.getFeedData() (contracts/NexusBSC.sol#1032-1034) has external calls inside a loop: dappOracle.lastGasPriceWei() (contracts/NexusBSC.sol#1033)
NexusPolygon.getFeedData() (contracts/NexusPolygon.sol#983-996) has external calls inside a loop: (None,feedValue,None,timestamp,None) = FAST_GAS_FEED.latestRoundData() (contracts/NexusPolygon.sol#989)
NexusPolygon.getDappMatic() (contracts/NexusPolygon.sol#1100-1102) has external calls inside a loop: dappOracle.lastDappMaticPrice() (contracts/NexusPolygon.sol#1101)
NexusPolygon.getUsdDapp() (contracts/NexusPolygon.sol#1107-1109) has external calls inside a loop: dappOracle.lastUsdDappPrice() (contracts/NexusPolygon.sol#1108)
NexusPrivate.getDappUsd() (contracts/NexusPrivate.sol#1026-1028) has external calls inside a loop: dappOracle.lastDappUsdPrice() (contracts/NexusPrivate.sol#1027)
NexusPrivate.getDappEth() (contracts/NexusPrivate.sol#1019-1021) has external calls inside a loop: dappOracle.lastDappEthPrice() (contracts/NexusPrivate.sol#1020)
NexusTestnet.getDappUsd() (contracts/NexusTestnet.sol#1024-1026) has external calls inside a loop: dappOracle.lastDappUsdPrice() (contracts/NexusTestnet.sol#1025)
NexusTestnet.getFeedData() (contracts/NexusTestnet.sol#1031-1033) has external calls inside a loop: dappOracle.lastGasPriceWei() (contracts/NexusTestnet.sol#1032)
NexusTestnet.getDappEth() (contracts/NexusTestnet.sol#1017-1019) has external calls inside a loop: dappOracle.lastDappEthPrice() (contracts/NexusTestnet.sol#1018)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation/#calls-inside-a-loop

Reentrancy in Nexus.buyGasFor(uint256,address,address) (contracts/Nexus.sol#381-393):
        External calls:
        - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/Nexus.sol#388)
        State variables written after the call(s):
        - workerData[_consumer][_worker].amount += _amount (contracts/Nexus.sol#390)
Reentrancy in NexusBSC.buyGasFor(uint256,address,address) (contracts/NexusBSC.sol#338-350):
        External calls:
        - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/NexusBSC.sol#345)
        State variables written after the call(s):
        - workerData[_consumer][_worker].amount += _amount (contracts/NexusBSC.sol#347)
Reentrancy in NexusPolygon.buyGasFor(uint256,address,address) (contracts/NexusPolygon.sol#366-381):
        External calls:
        - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/NexusPolygon.sol#374)
        State variables written after the call(s):
        - workerData[_consumer][_worker].amount += _amount (contracts/NexusPolygon.sol#377)
Reentrancy in NexusPrivate.buyGasFor(uint256,address,address) (contracts/NexusPrivate.sol#338-350):
        External calls:
        - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/NexusPrivate.sol#345)
        State variables written after the call(s):
        - workerData[_consumer][_worker].amount += _amount (contracts/NexusPrivate.sol#347)
Reentrancy in NexusTestnet.buyGasFor(uint256,address,address) (contracts/NexusTestnet.sol#338-350):
        External calls:
        - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/NexusTestnet.sol#345)
        State variables written after the call(s):
        - workerData[_consumer][_worker].amount += _amount (contracts/NexusTestnet.sol#347)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#reentrancy-vulnerabilities-2

Reentrancy in Nexus.buyGasFor(uint256,address,address) (contracts/Nexus.sol#381-393):
        External calls:
        - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/Nexus.sol#388)
        Event emitted after the call(s):
        - BoughtGas(msg.sender,_consumer,_worker,_amount) (contracts/Nexus.sol#392)
Reentrancy in NexusBSC.buyGasFor(uint256,address,address) (contracts/NexusBSC.sol#338-350):
        External calls:
        - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/NexusBSC.sol#345)
        Event emitted after the call(s):
        - BoughtGas(msg.sender,_consumer,_worker,_amount) (contracts/NexusBSC.sol#349)
Reentrancy in NexusPolygon.buyGasFor(uint256,address,address) (contracts/NexusPolygon.sol#366-381):
        External calls:
        - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/NexusPolygon.sol#374)
        Event emitted after the call(s):
        - BoughtGas(msg.sender,_consumer,_worker,_amount) (contracts/NexusPolygon.sol#380)
Reentrancy in NexusPrivate.buyGasFor(uint256,address,address) (contracts/NexusPrivate.sol#338-350):
        External calls:
        - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/NexusPrivate.sol#345)
        Event emitted after the call(s):
        - BoughtGas(msg.sender,_consumer,_worker,_amount) (contracts/NexusPrivate.sol#349)
Reentrancy in NexusTestnet.buyGasFor(uint256,address,address) (contracts/NexusTestnet.sol#338-350):
        External calls:
        - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/NexusTestnet.sol#345)
        Event emitted after the call(s):
        - BoughtGas(msg.sender,_consumer,_worker,_amount) (contracts/NexusTestnet.sol#349)
Reentrancy in Nexus.claim() (contracts/Nexus.sol#416-424):
        External calls:
        - token.safeTransfer(msg.sender,claimableAmount) (contracts/Nexus.sol#421)
        Event emitted after the call(s):
        - ClaimedGas(msg.sender,claimableAmount) (contracts/Nexus.sol#423)
Reentrancy in NexusBSC.claim() (contracts/NexusBSC.sol#373-381):
        External calls:
        - token.safeTransfer(msg.sender,claimableAmount) (contracts/NexusBSC.sol#378)
        Event emitted after the call(s):
        - ClaimedGas(msg.sender,claimableAmount) (contracts/NexusBSC.sol#380)
Reentrancy in NexusPolygon.claim() (contracts/NexusPolygon.sol#422-434):
        External calls:
        - token.safeTransfer(msg.sender,claimableAmount) (contracts/NexusPolygon.sol#431)
        Event emitted after the call(s):
        - ClaimedGas(msg.sender,claimableAmount) (contracts/NexusPolygon.sol#433)
Reentrancy in NexusPrivate.claim() (contracts/NexusPrivate.sol#373-381):
        External calls:
        - token.safeTransfer(msg.sender,claimableAmount) (contracts/NexusPrivate.sol#378)
        Event emitted after the call(s):
        - ClaimedGas(msg.sender,claimableAmount) (contracts/NexusPrivate.sol#380)
Reentrancy in NexusTestnet.claim() (contracts/NexusTestnet.sol#373-381):
        External calls:
        - token.safeTransfer(msg.sender,claimableAmount) (contracts/NexusTestnet.sol#378)
        Event emitted after the call(s):
        - ClaimedGas(msg.sender,claimableAmount) (contracts/NexusTestnet.sol#380)
Reentrancy in Nexus.extendService(uint256,string,uint256) (contracts/Nexus.sol#736-778):
        External calls:
        - buyGasFor(dapps,msg.sender,workers[i]) (contracts/Nexus.sol#765-769)
                - returndata = address(token).functionCall(data,SafeERC20: low-level call failed) (contracts/SafeERC20Upgradeable.sol#93)
                - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/Nexus.sol#388)
                - (success,returndata) = target.call{value: value}(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#137)
        External calls sending eth:
        - buyGasFor(dapps,msg.sender,workers[i]) (contracts/Nexus.sol#765-769)
                - (success,returndata) = target.call{value: value}(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#137)
        Event emitted after the call(s):
        - ServiceExtended(msg.sender,workers[i],serviceId,sd.endDate) (contracts/Nexus.sol#771-776)
Reentrancy in NexusBSC.extendService(uint256,string,uint256) (contracts/NexusBSC.sol#693-735):
        External calls:
        - buyGasFor(dapps,msg.sender,workers[i]) (contracts/NexusBSC.sol#722-726)
                - returndata = address(token).functionCall(data,SafeERC20: low-level call failed) (contracts/SafeERC20Upgradeable.sol#93)
                - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/NexusBSC.sol#345)
                - (success,returndata) = target.call{value: value}(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#137)
        External calls sending eth:
        - buyGasFor(dapps,msg.sender,workers[i]) (contracts/NexusBSC.sol#722-726)
                - (success,returndata) = target.call{value: value}(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#137)
        Event emitted after the call(s):
        - ServiceExtended(msg.sender,workers[i],serviceId,sd.endDate) (contracts/NexusBSC.sol#728-733)
Reentrancy in NexusPolygon.extendService(uint256,string,uint256) (contracts/NexusPolygon.sol#755-793):
        External calls:
        - buyGasFor(dapps,msg.sender,workers[i]) (contracts/NexusPolygon.sol#780-784)
                - returndata = address(token).functionCall(data,SafeERC20: low-level call failed) (contracts/SafeERC20Upgradeable.sol#93)
                - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/NexusPolygon.sol#374)
                - (success,returndata) = target.call{value: value}(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#137)
        External calls sending eth:
        - buyGasFor(dapps,msg.sender,workers[i]) (contracts/NexusPolygon.sol#780-784)
                - (success,returndata) = target.call{value: value}(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#137)
        Event emitted after the call(s):
        - ServiceExtended(msg.sender,workers[i],serviceId,sd.endDate) (contracts/NexusPolygon.sol#786-791)
Reentrancy in NexusPrivate.extendService(uint256,string,uint256) (contracts/NexusPrivate.sol#693-735):
        External calls:
        - buyGasFor(dapps,msg.sender,workers[i]) (contracts/NexusPrivate.sol#722-726)
                - returndata = address(token).functionCall(data,SafeERC20: low-level call failed) (contracts/SafeERC20Upgradeable.sol#93)
                - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/NexusPrivate.sol#345)
                - (success,returndata) = target.call{value: value}(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#137)
        External calls sending eth:
        - buyGasFor(dapps,msg.sender,workers[i]) (contracts/NexusPrivate.sol#722-726)
                - (success,returndata) = target.call{value: value}(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#137)
        Event emitted after the call(s):
        - ServiceExtended(msg.sender,workers[i],serviceId,sd.endDate) (contracts/NexusPrivate.sol#728-733)
Reentrancy in NexusTestnet.extendService(uint256,string,uint256) (contracts/NexusTestnet.sol#693-735):
        External calls:
        - buyGasFor(dapps,msg.sender,workers[i]) (contracts/NexusTestnet.sol#722-726)
                - returndata = address(token).functionCall(data,SafeERC20: low-level call failed) (contracts/SafeERC20Upgradeable.sol#93)
                - token.safeTransferFrom(msg.sender,address(this),_amount) (contracts/NexusTestnet.sol#345)
                - (success,returndata) = target.call{value: value}(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#137)
        External calls sending eth:
        - buyGasFor(dapps,msg.sender,workers[i]) (contracts/NexusTestnet.sol#722-726)
                - (success,returndata) = target.call{value: value}(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#137)
        Event emitted after the call(s):
        - ServiceExtended(msg.sender,workers[i],serviceId,sd.endDate) (contracts/NexusTestnet.sol#728-733)
Reentrancy in Nexus.sellGas(uint256,address) (contracts/Nexus.sol#398-411):
        External calls:
        - token.safeTransfer(_consumer,_amountToSell) (contracts/Nexus.sol#408)
        Event emitted after the call(s):
        - SoldGas(_consumer,_worker,_amountToSell) (contracts/Nexus.sol#410)
Reentrancy in NexusBSC.sellGas(uint256,address) (contracts/NexusBSC.sol#355-368):
        External calls:
        - token.safeTransfer(_consumer,_amountToSell) (contracts/NexusBSC.sol#365)
        Event emitted after the call(s):
        - SoldGas(_consumer,_worker,_amountToSell) (contracts/NexusBSC.sol#367)
Reentrancy in NexusPolygon.sellGas(uint256,address) (contracts/NexusPolygon.sol#386-400):
        External calls:
        - token.safeTransfer(_consumer,_amountToSell) (contracts/NexusPolygon.sol#397)
        Event emitted after the call(s):
        - SoldGas(_consumer,_worker,_amountToSell) (contracts/NexusPolygon.sol#399)
Reentrancy in NexusPrivate.sellGas(uint256,address) (contracts/NexusPrivate.sol#355-368):
        External calls:
        - token.safeTransfer(_consumer,_amountToSell) (contracts/NexusPrivate.sol#365)
        Event emitted after the call(s):
        - SoldGas(_consumer,_worker,_amountToSell) (contracts/NexusPrivate.sol#367)
Reentrancy in NexusTestnet.sellGas(uint256,address) (contracts/NexusTestnet.sol#355-368):
        External calls:
        - token.safeTransfer(_consumer,_amountToSell) (contracts/NexusTestnet.sol#365)
        Event emitted after the call(s):
        - SoldGas(_consumer,_worker,_amountToSell) (contracts/NexusTestnet.sol#367)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#reentrancy-vulnerabilities-3

Nexus.serviceCallback(uint256) (contracts/Nexus.sol#586-618) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(sd.started == false,started) (contracts/Nexus.sol#594)
Nexus.isServiceDone(uint256) (contracts/Nexus.sol#690-693) uses timestamp for comparisons
        Dangerous comparisons:
        - sd.endDate < block.timestamp (contracts/Nexus.sol#692)
Nexus.serviceComplete(Nexus.serviceCompleteArgs) (contracts/Nexus.sol#698-731) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(sd.endDate < block.timestamp,time remaining) (contracts/Nexus.sol#702)
Nexus.extendService(uint256,string,uint256) (contracts/Nexus.sol#736-778) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(sd.endDate > block.timestamp,time remaining) (contracts/Nexus.sol#746)
Nexus.getFeedData() (contracts/Nexus.sol#1094-1107) uses timestamp for comparisons
        Dangerous comparisons:
        - (staleFallback && stalenessSeconds < block.timestamp - timestamp) || feedValue <= 0 (contracts/Nexus.sol#1102)
Nexus.useGas(address,uint256,address) (contracts/Nexus.sol#1162-1175) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(_amountToUse <= workerData[_consumer][_worker].amount,insuficient gas) (contracts/Nexus.sol#1167)
NexusBSC.serviceCallback(uint256) (contracts/NexusBSC.sol#543-575) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(sd.started == false,started) (contracts/NexusBSC.sol#551)
NexusBSC.isServiceDone(uint256) (contracts/NexusBSC.sol#647-650) uses timestamp for comparisons
        Dangerous comparisons:
        - sd.endDate < block.timestamp (contracts/NexusBSC.sol#649)
NexusBSC.serviceComplete(NexusBSC.serviceCompleteArgs) (contracts/NexusBSC.sol#655-688) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(sd.endDate < block.timestamp,time remaining) (contracts/NexusBSC.sol#659)
NexusBSC.extendService(uint256,string,uint256) (contracts/NexusBSC.sol#693-735) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(sd.endDate > block.timestamp,time remaining) (contracts/NexusBSC.sol#703)
NexusBSC.useGas(address,uint256,address) (contracts/NexusBSC.sol#1085-1098) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(_amountToUse <= workerData[_consumer][_worker].amount,insuficient gas) (contracts/NexusBSC.sol#1090)
NexusPolygon.useGas(address,uint256,address) (contracts/NexusPolygon.sol#405-417) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(_amountToUse <= workerData[_consumer][_worker].amount,insuficient gas) (contracts/NexusPolygon.sol#410)
        - require(bool,string)(_amountToUse > 0,zero gas) (contracts/NexusPolygon.sol#411)
NexusPolygon.isServiceDone(uint256) (contracts/NexusPolygon.sol#708-711) uses timestamp for comparisons
        Dangerous comparisons:
        - sd.endDate < block.timestamp (contracts/NexusPolygon.sol#710)
NexusPolygon.serviceComplete(NexusPolygon.serviceCompleteArgs) (contracts/NexusPolygon.sol#716-750) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(sd.endDate < block.timestamp,time remaining) (contracts/NexusPolygon.sol#720)
NexusPolygon.extendService(uint256,string,uint256) (contracts/NexusPolygon.sol#755-793) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(sd.endDate > block.timestamp,no time remaining) (contracts/NexusPolygon.sol#765)
NexusPolygon.getFeedData() (contracts/NexusPolygon.sol#983-996) uses timestamp for comparisons
        Dangerous comparisons:
        - (staleFallback && stalenessSeconds < block.timestamp - timestamp) || feedValue <= 0 (contracts/NexusPolygon.sol#991)
NexusPrivate.serviceCallback(uint256) (contracts/NexusPrivate.sol#543-575) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(sd.started == false,started) (contracts/NexusPrivate.sol#551)
NexusPrivate.isServiceDone(uint256) (contracts/NexusPrivate.sol#647-650) uses timestamp for comparisons
        Dangerous comparisons:
        - sd.endDate < block.timestamp (contracts/NexusPrivate.sol#649)
NexusPrivate.serviceComplete(NexusPrivate.serviceCompleteArgs) (contracts/NexusPrivate.sol#655-688) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(sd.endDate < block.timestamp,time remaining) (contracts/NexusPrivate.sol#659)
NexusPrivate.extendService(uint256,string,uint256) (contracts/NexusPrivate.sol#693-735) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(sd.endDate > block.timestamp,time remaining) (contracts/NexusPrivate.sol#703)
NexusPrivate.useGas(address,uint256,address) (contracts/NexusPrivate.sol#1089-1102) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(_amountToUse <= workerData[_consumer][_worker].amount,insuficient gas) (contracts/NexusPrivate.sol#1094)
NexusTestnet.serviceCallback(uint256) (contracts/NexusTestnet.sol#543-575) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(sd.started == false,started) (contracts/NexusTestnet.sol#551)
NexusTestnet.isServiceDone(uint256) (contracts/NexusTestnet.sol#647-650) uses timestamp for comparisons
        Dangerous comparisons:
        - sd.endDate < block.timestamp (contracts/NexusTestnet.sol#649)
NexusTestnet.serviceComplete(NexusTestnet.serviceCompleteArgs) (contracts/NexusTestnet.sol#655-688) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(sd.endDate < block.timestamp,time remaining) (contracts/NexusTestnet.sol#659)
NexusTestnet.extendService(uint256,string,uint256) (contracts/NexusTestnet.sol#693-735) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(sd.endDate > block.timestamp,time remaining) (contracts/NexusTestnet.sol#703)
NexusTestnet.useGas(address,uint256,address) (contracts/NexusTestnet.sol#1084-1097) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(_amountToUse <= workerData[_consumer][_worker].amount,insuficient gas) (contracts/NexusTestnet.sol#1089)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#block-timestamp

DappOraclePolygon.updatePrice(uint256,uint256) (contracts/DappOraclePolygon.sol#19-25) uses timestamp for comparisons
        Dangerous comparisons:
        - require(bool,string)(block.timestamp >= lastUpdateTime + 86400,last call <24 hours) (contracts/DappOraclePolygon.sol#20)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#block-timestamp

AddressUpgradeable.verifyCallResult(bool,bytes,string) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#174-194) uses assembly
        - INLINE ASM (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#186-189)
Nexus.callWithExactGas(uint256,address,bytes) (contracts/Nexus.sol#988-1013) uses assembly
        - INLINE ASM (contracts/Nexus.sol#993-1011)
NexusBSC.callWithExactGas(uint256,address,bytes) (contracts/NexusBSC.sol#944-969) uses assembly
        - INLINE ASM (contracts/NexusBSC.sol#949-967)
NexusPolygon.callWithExactGas(uint256,address,bytes) (contracts/NexusPolygon.sol#1025-1050) uses assembly
        - INLINE ASM (contracts/NexusPolygon.sol#1030-1048)
NexusPrivate.callWithExactGas(uint256,address,bytes) (contracts/NexusPrivate.sol#946-971) uses assembly
        - INLINE ASM (contracts/NexusPrivate.sol#951-969)
NexusTestnet.callWithExactGas(uint256,address,bytes) (contracts/NexusTestnet.sol#944-969) uses assembly
        - INLINE ASM (contracts/NexusTestnet.sol#949-967)
console._sendLogPayload(bytes) (node_modules/hardhat/console.sol#7-14) uses assembly
        - INLINE ASM (node_modules/hardhat/console.sol#10-13)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#assembly-usage

Nexus.serviceCallback(uint256) (contracts/Nexus.sol#586-618) compares to a boolean constant:
        -require(bool,string)(sd.started == false,started) (contracts/Nexus.sol#594)
Nexus.serviceComplete(Nexus.serviceCompleteArgs) (contracts/Nexus.sol#698-731) compares to a boolean constant:
        -require(bool,string)(sd.started == true,not started) (contracts/Nexus.sol#701)
NexusBSC.serviceCallback(uint256) (contracts/NexusBSC.sol#543-575) compares to a boolean constant:
        -require(bool,string)(sd.started == false,started) (contracts/NexusBSC.sol#551)
NexusBSC.serviceComplete(NexusBSC.serviceCompleteArgs) (contracts/NexusBSC.sol#655-688) compares to a boolean constant:
        -require(bool,string)(sd.started == true,not started) (contracts/NexusBSC.sol#658)
NexusPolygon.serviceCallback(uint256) (contracts/NexusPolygon.sol#603-635) compares to a boolean constant:
        -require(bool,string)(sd.started == false,started) (contracts/NexusPolygon.sol#611)
NexusPolygon.serviceComplete(NexusPolygon.serviceCompleteArgs) (contracts/NexusPolygon.sol#716-750) compares to a boolean constant:
        -require(bool,string)(sd.started == true,not started) (contracts/NexusPolygon.sol#719)
NexusPrivate.serviceCallback(uint256) (contracts/NexusPrivate.sol#543-575) compares to a boolean constant:
        -require(bool,string)(sd.started == false,started) (contracts/NexusPrivate.sol#551)
NexusPrivate.serviceComplete(NexusPrivate.serviceCompleteArgs) (contracts/NexusPrivate.sol#655-688) compares to a boolean constant:
        -require(bool,string)(sd.started == true,not started) (contracts/NexusPrivate.sol#658)
NexusTestnet.serviceCallback(uint256) (contracts/NexusTestnet.sol#543-575) compares to a boolean constant:
        -require(bool,string)(sd.started == false,started) (contracts/NexusTestnet.sol#551)
NexusTestnet.serviceComplete(NexusTestnet.serviceCompleteArgs) (contracts/NexusTestnet.sol#655-688) compares to a boolean constant:
        -require(bool,string)(sd.started == true,not started) (contracts/NexusTestnet.sol#658)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#boolean-equality

Different versions of Solidity are used:
        - Version used: ['>=0.4.22<0.9.0', '>=0.7.0<0.9.0', '>=0.8.0', '^0.8.0', '^0.8.1', '^0.8.10']
        - ^0.8.0 (node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol#2)
        - ^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#4)
        - ^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#4)
        - ^0.8.1 (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#4)
        - ^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#4)
        - ^0.8.0 (node_modules/@openzeppelin/contracts/utils/Strings.sol#4)
        - >=0.7.0<0.9.0 (contracts/Consumer.sol#2)
        - >=0.8.0 (contracts/Nexus.sol#2)
        - >=0.8.0 (contracts/NexusBSC.sol#2)
        - >=0.8.0 (contracts/NexusPolygon.sol#2)
        - >=0.8.0 (contracts/NexusPrivate.sol#2)
        - >=0.8.0 (contracts/NexusTestnet.sol#2)
        - ^0.8.0 (contracts/ReentrancyGuardUpgradeable.sol#4)
        - ^0.8.0 (contracts/SafeERC20Upgradeable.sol#4)
        - ^0.8.10 (contracts/interfaces/AggregatorV3Interface.sol#2)
        - >=0.7.0<0.9.0 (contracts/interfaces/IBancorNetwork.sol#2)
        - >=0.7.0<0.9.0 (contracts/interfaces/IDappOracle.sol#2)
        - >=0.7.0<0.9.0 (contracts/interfaces/IDappOracleDapp.sol#2)
        - >=0.7.0<0.9.0 (contracts/interfaces/IDappOraclePolygon.sol#2)
        - >=0.7.0<0.9.0 (contracts/interfaces/IDappOracleUsdGas.sol#2)
        - ^0.8.0 (contracts/interfaces/IERC20Upgradeable.sol#4)
        - >=0.7.0<0.9.0 (contracts/interfaces/INexus.sol#3)
        - >=0.4.22<0.9.0 (node_modules/hardhat/console.sol#2)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#different-pragma-directives-are-used

Different versions of Solidity are used:
        - Version used: ['>=0.7.0<0.9.0', '^0.8.0']
        - ^0.8.0 (node_modules/@openzeppelin/contracts/access/Ownable.sol#4)
        - ^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#4)
        - ^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#4)
        - ^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#4)
        - ^0.8.0 (node_modules/@openzeppelin/contracts/utils/Context.sol#4)
        - >=0.7.0<0.9.0 (contracts/DappOracle.sol#2)
        - >=0.7.0<0.9.0 (contracts/DappOracleDapp.sol#2)
        - >=0.7.0<0.9.0 (contracts/DappOraclePolygon.sol#2)
        - >=0.7.0<0.9.0 (contracts/DappOracleUsdGas.sol#2)
        - ^0.8.0 (contracts/DappToken.sol#2)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#different-pragma-directives-are-used

ReentrancyGuardUpgradeable.nonReentrant() (contracts/ReentrancyGuardUpgradeable.sol#56-68) has costly operations inside a loop:
        - _status = _ENTERED (contracts/ReentrancyGuardUpgradeable.sol#61)
ReentrancyGuardUpgradeable.nonReentrant() (contracts/ReentrancyGuardUpgradeable.sol#56-68) has costly operations inside a loop:
        - _status = _NOT_ENTERED (contracts/ReentrancyGuardUpgradeable.sol#67)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#costly-operations-inside-a-loop

Nexus.toString(address) (contracts/Nexus.sol#1187-1189) is never used and should be removed
Nexus.toString(bytes) (contracts/Nexus.sol#1208-1220) is never used and should be removed
Nexus.toString(bytes32) (contracts/Nexus.sol#1201-1203) is never used and should be removed
Nexus.toString(uint256) (contracts/Nexus.sol#1194-1196) is never used and should be removed
NexusBSC.toString(address) (contracts/NexusBSC.sol#1110-1112) is never used and should be removed
NexusBSC.toString(bytes) (contracts/NexusBSC.sol#1131-1143) is never used and should be removed
NexusBSC.toString(bytes32) (contracts/NexusBSC.sol#1124-1126) is never used and should be removed
NexusBSC.toString(uint256) (contracts/NexusBSC.sol#1117-1119) is never used and should be removed
NexusPolygon.toString(address) (contracts/NexusPolygon.sol#1148-1150) is never used and should be removed
NexusPolygon.toString(bytes) (contracts/NexusPolygon.sol#1169-1181) is never used and should be removed
NexusPolygon.toString(bytes32) (contracts/NexusPolygon.sol#1162-1164) is never used and should be removed
NexusPolygon.toString(uint256) (contracts/NexusPolygon.sol#1155-1157) is never used and should be removed
NexusPrivate.toString(address) (contracts/NexusPrivate.sol#1114-1116) is never used and should be removed
NexusPrivate.toString(bytes) (contracts/NexusPrivate.sol#1135-1147) is never used and should be removed
NexusPrivate.toString(bytes32) (contracts/NexusPrivate.sol#1128-1130) is never used and should be removed
NexusPrivate.toString(uint256) (contracts/NexusPrivate.sol#1121-1123) is never used and should be removed
NexusTestnet.toString(address) (contracts/NexusTestnet.sol#1109-1111) is never used and should be removed
NexusTestnet.toString(bytes) (contracts/NexusTestnet.sol#1130-1142) is never used and should be removed
NexusTestnet.toString(bytes32) (contracts/NexusTestnet.sol#1123-1125) is never used and should be removed
NexusTestnet.toString(uint256) (contracts/NexusTestnet.sol#1116-1118) is never used and should be removed
SafeERC20Upgradeable.safeApprove(IERC20Upgradeable,address,uint256) (contracts/SafeERC20Upgradeable.sol#45-58) is never used and should be removed
SafeERC20Upgradeable.safeDecreaseAllowance(IERC20Upgradeable,address,uint256) (contracts/SafeERC20Upgradeable.sol#69-80) is never used and should be removed
SafeERC20Upgradeable.safeIncreaseAllowance(IERC20Upgradeable,address,uint256) (contracts/SafeERC20Upgradeable.sol#60-67) is never used and should be removed
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#dead-code

Pragma version^0.8.0 (node_modules/@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol#2) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol#4) allows old versions
Pragma version^0.8.1 (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/utils/Strings.sol#4) allows old versions
Pragma version>=0.7.0<0.9.0 (contracts/Consumer.sol#2) is too complex
Pragma version>=0.8.0 (contracts/Nexus.sol#2) allows old versions
Pragma version>=0.8.0 (contracts/NexusBSC.sol#2) allows old versions
Pragma version>=0.8.0 (contracts/NexusPolygon.sol#2) allows old versions
Pragma version>=0.8.0 (contracts/NexusPrivate.sol#2) allows old versions
Pragma version>=0.8.0 (contracts/NexusTestnet.sol#2) allows old versions
Pragma version^0.8.0 (contracts/ReentrancyGuardUpgradeable.sol#4) allows old versions
Pragma version^0.8.0 (contracts/SafeERC20Upgradeable.sol#4) allows old versions
Pragma version^0.8.10 (contracts/interfaces/AggregatorV3Interface.sol#2) allows old versions
Pragma version>=0.7.0<0.9.0 (contracts/interfaces/IBancorNetwork.sol#2) is too complex
Pragma version>=0.7.0<0.9.0 (contracts/interfaces/IDappOracle.sol#2) is too complex
Pragma version>=0.7.0<0.9.0 (contracts/interfaces/IDappOracleDapp.sol#2) is too complex
Pragma version>=0.7.0<0.9.0 (contracts/interfaces/IDappOraclePolygon.sol#2) is too complex
Pragma version>=0.7.0<0.9.0 (contracts/interfaces/IDappOracleUsdGas.sol#2) is too complex
Pragma version^0.8.0 (contracts/interfaces/IERC20Upgradeable.sol#4) allows old versions
Pragma version>=0.7.0<0.9.0 (contracts/interfaces/INexus.sol#3) is too complex
Pragma version>=0.4.22<0.9.0 (node_modules/hardhat/console.sol#2) is too complex
solc-0.8.17 is not recommended for deployment
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#incorrect-versions-of-solidity

Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/access/Ownable.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#4) allows old versions
Pragma version^0.8.0 (node_modules/@openzeppelin/contracts/utils/Context.sol#4) allows old versions
Pragma version>=0.7.0<0.9.0 (contracts/DappOracle.sol#2) is too complex
Pragma version>=0.7.0<0.9.0 (contracts/DappOracleDapp.sol#2) is too complex
Pragma version>=0.7.0<0.9.0 (contracts/DappOraclePolygon.sol#2) is too complex
Pragma version>=0.7.0<0.9.0 (contracts/DappOracleUsdGas.sol#2) is too complex
Pragma version^0.8.0 (contracts/DappToken.sol#2) allows old versions
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#incorrect-versions-of-solidity

Low level call in AddressUpgradeable.sendValue(address,uint256) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#60-65):
        - (success) = recipient.call{value: amount}() (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#63)
Low level call in AddressUpgradeable.functionCallWithValue(address,bytes,uint256,string) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#128-139):
        - (success,returndata) = target.call{value: value}(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#137)
Low level call in AddressUpgradeable.functionStaticCall(address,bytes,string) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#157-166):
        - (success,returndata) = target.staticcall(data) (node_modules/@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol#164)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#low-level-calls

Function OwnableUpgradeable.__Ownable_init() (node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#29-31) is not in mixedCase
Function OwnableUpgradeable.__Ownable_init_unchained() (node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#33-35) is not in mixedCase
Variable OwnableUpgradeable.__gap (node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#87) is not in mixedCase
Function ContextUpgradeable.__Context_init() (node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#18-19) is not in mixedCase
Function ContextUpgradeable.__Context_init_unchained() (node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#21-22) is not in mixedCase
Variable ContextUpgradeable.__gap (node_modules/@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol#36) is not in mixedCase
Function Consumer._workercallback(string,string) (contracts/Consumer.sol#36-40) is not in mixedCase
Struct Nexus.queueJobArgs (contracts/Nexus.sol#199-207) is not in CapWords
Struct Nexus.queueServiceArgs (contracts/Nexus.sol#209-215) is not in CapWords
Struct Nexus.serviceErrorArgs (contracts/Nexus.sol#217-221) is not in CapWords
Struct Nexus.serviceCompleteArgs (contracts/Nexus.sol#223-226) is not in CapWords
Struct Nexus.jobCallbackArgs (contracts/Nexus.sol#234-238) is not in CapWords
Struct Nexus.initArgs (contracts/Nexus.sol#240-257) is not in CapWords
Parameter Nexus.setConsumerContract(address).authorized_contract (contracts/Nexus.sol#373) is not in mixedCase
Parameter Nexus.buyGasFor(uint256,address,address)._amount (contracts/Nexus.sol#382) is not in mixedCase
Parameter Nexus.buyGasFor(uint256,address,address)._consumer (contracts/Nexus.sol#383) is not in mixedCase
Parameter Nexus.buyGasFor(uint256,address,address)._worker (contracts/Nexus.sol#384) is not in mixedCase
Parameter Nexus.sellGas(uint256,address)._amountToSell (contracts/Nexus.sol#399) is not in mixedCase
Parameter Nexus.sellGas(uint256,address)._worker (contracts/Nexus.sol#400) is not in mixedCase
Parameter Nexus.calcServiceDapps(string,address,bool).include_base (contracts/Nexus.sol#973) is not in mixedCase
Parameter Nexus.useGas(address,uint256,address)._consumer (contracts/Nexus.sol#1163) is not in mixedCase
Parameter Nexus.useGas(address,uint256,address)._amountToUse (contracts/Nexus.sol#1164) is not in mixedCase
Parameter Nexus.useGas(address,uint256,address)._worker (contracts/Nexus.sol#1165) is not in mixedCase
Variable Nexus.FAST_GAS_FEED (contracts/Nexus.sol#17) is not in mixedCase
Variable Nexus.s_config (contracts/Nexus.sol#279) is not in mixedCase
Variable Nexus.s_fallbackGasPrice (contracts/Nexus.sol#280) is not in mixedCase
Struct NexusBSC.queueJobArgs (contracts/NexusBSC.sol#188-196) is not in CapWords
Struct NexusBSC.queueServiceArgs (contracts/NexusBSC.sol#198-204) is not in CapWords
Struct NexusBSC.serviceErrorArgs (contracts/NexusBSC.sol#206-210) is not in CapWords
Struct NexusBSC.serviceCompleteArgs (contracts/NexusBSC.sol#212-215) is not in CapWords
Struct NexusBSC.jobCallbackArgs (contracts/NexusBSC.sol#222-226) is not in CapWords
Struct NexusBSC.initArgs (contracts/NexusBSC.sol#228-234) is not in CapWords
Parameter NexusBSC.setConsumerContract(address).authorized_contract (contracts/NexusBSC.sol#330) is not in mixedCase
Parameter NexusBSC.buyGasFor(uint256,address,address)._amount (contracts/NexusBSC.sol#339) is not in mixedCase
Parameter NexusBSC.buyGasFor(uint256,address,address)._consumer (contracts/NexusBSC.sol#340) is not in mixedCase
Parameter NexusBSC.buyGasFor(uint256,address,address)._worker (contracts/NexusBSC.sol#341) is not in mixedCase
Parameter NexusBSC.sellGas(uint256,address)._amountToSell (contracts/NexusBSC.sol#356) is not in mixedCase
Parameter NexusBSC.sellGas(uint256,address)._worker (contracts/NexusBSC.sol#357) is not in mixedCase
Parameter NexusBSC.calcServiceDapps(string,address,bool).include_base (contracts/NexusBSC.sol#930) is not in mixedCase
Parameter NexusBSC.useGas(address,uint256,address)._consumer (contracts/NexusBSC.sol#1086) is not in mixedCase
Parameter NexusBSC.useGas(address,uint256,address)._amountToUse (contracts/NexusBSC.sol#1087) is not in mixedCase
Parameter NexusBSC.useGas(address,uint256,address)._worker (contracts/NexusBSC.sol#1088) is not in mixedCase
Variable NexusBSC.s_config (contracts/NexusBSC.sol#256) is not in mixedCase
Struct NexusPolygon.queueJobArgs (contracts/NexusPolygon.sol#185-193) is not in CapWords
Struct NexusPolygon.queueServiceArgs (contracts/NexusPolygon.sol#195-201) is not in CapWords
Struct NexusPolygon.serviceErrorArgs (contracts/NexusPolygon.sol#203-207) is not in CapWords
Struct NexusPolygon.serviceCompleteArgs (contracts/NexusPolygon.sol#209-212) is not in CapWords
Struct NexusPolygon.jobCallbackArgs (contracts/NexusPolygon.sol#219-223) is not in CapWords
Struct NexusPolygon.initArgs (contracts/NexusPolygon.sol#225-232) is not in CapWords
Parameter NexusPolygon.setConsumerContract(address).authorized_contract (contracts/NexusPolygon.sol#358) is not in mixedCase
Parameter NexusPolygon.buyGasFor(uint256,address,address)._amount (contracts/NexusPolygon.sol#367) is not in mixedCase
Parameter NexusPolygon.buyGasFor(uint256,address,address)._consumer (contracts/NexusPolygon.sol#368) is not in mixedCase
Parameter NexusPolygon.buyGasFor(uint256,address,address)._worker (contracts/NexusPolygon.sol#369) is not in mixedCase
Parameter NexusPolygon.sellGas(uint256,address)._amountToSell (contracts/NexusPolygon.sol#387) is not in mixedCase
Parameter NexusPolygon.sellGas(uint256,address)._worker (contracts/NexusPolygon.sol#388) is not in mixedCase
Parameter NexusPolygon.useGas(address,uint256,address)._consumer (contracts/NexusPolygon.sol#406) is not in mixedCase
Parameter NexusPolygon.useGas(address,uint256,address)._amountToUse (contracts/NexusPolygon.sol#407) is not in mixedCase
Parameter NexusPolygon.useGas(address,uint256,address)._worker (contracts/NexusPolygon.sol#408) is not in mixedCase
Variable NexusPolygon.s_config (contracts/NexusPolygon.sol#253) is not in mixedCase
Variable NexusPolygon.s_fallbackGasPrice (contracts/NexusPolygon.sol#254) is not in mixedCase
Struct NexusPrivate.queueJobArgs (contracts/NexusPrivate.sol#188-196) is not in CapWords
Struct NexusPrivate.queueServiceArgs (contracts/NexusPrivate.sol#198-204) is not in CapWords
Struct NexusPrivate.serviceErrorArgs (contracts/NexusPrivate.sol#206-210) is not in CapWords
Struct NexusPrivate.serviceCompleteArgs (contracts/NexusPrivate.sol#212-215) is not in CapWords
Struct NexusPrivate.jobCallbackArgs (contracts/NexusPrivate.sol#222-226) is not in CapWords
Struct NexusPrivate.initArgs (contracts/NexusPrivate.sol#228-234) is not in CapWords
Parameter NexusPrivate.setConsumerContract(address).authorized_contract (contracts/NexusPrivate.sol#330) is not in mixedCase
Parameter NexusPrivate.buyGasFor(uint256,address,address)._amount (contracts/NexusPrivate.sol#339) is not in mixedCase
Parameter NexusPrivate.buyGasFor(uint256,address,address)._consumer (contracts/NexusPrivate.sol#340) is not in mixedCase
Parameter NexusPrivate.buyGasFor(uint256,address,address)._worker (contracts/NexusPrivate.sol#341) is not in mixedCase
Parameter NexusPrivate.sellGas(uint256,address)._amountToSell (contracts/NexusPrivate.sol#356) is not in mixedCase
Parameter NexusPrivate.sellGas(uint256,address)._worker (contracts/NexusPrivate.sol#357) is not in mixedCase
Parameter NexusPrivate.calcServiceDapps(string,address,bool).include_base (contracts/NexusPrivate.sol#932) is not in mixedCase
Parameter NexusPrivate.useGas(address,uint256,address)._consumer (contracts/NexusPrivate.sol#1090) is not in mixedCase
Parameter NexusPrivate.useGas(address,uint256,address)._amountToUse (contracts/NexusPrivate.sol#1091) is not in mixedCase
Parameter NexusPrivate.useGas(address,uint256,address)._worker (contracts/NexusPrivate.sol#1092) is not in mixedCase
Variable NexusPrivate.s_config (contracts/NexusPrivate.sol#256) is not in mixedCase
Struct NexusTestnet.queueJobArgs (contracts/NexusTestnet.sol#188-196) is not in CapWords
Struct NexusTestnet.queueServiceArgs (contracts/NexusTestnet.sol#198-204) is not in CapWords
Struct NexusTestnet.serviceErrorArgs (contracts/NexusTestnet.sol#206-210) is not in CapWords
Struct NexusTestnet.serviceCompleteArgs (contracts/NexusTestnet.sol#212-215) is not in CapWords
Struct NexusTestnet.jobCallbackArgs (contracts/NexusTestnet.sol#222-226) is not in CapWords
Struct NexusTestnet.initArgs (contracts/NexusTestnet.sol#228-234) is not in CapWords
Parameter NexusTestnet.setConsumerContract(address).authorized_contract (contracts/NexusTestnet.sol#330) is not in mixedCase
Parameter NexusTestnet.buyGasFor(uint256,address,address)._amount (contracts/NexusTestnet.sol#339) is not in mixedCase
Parameter NexusTestnet.buyGasFor(uint256,address,address)._consumer (contracts/NexusTestnet.sol#340) is not in mixedCase
Parameter NexusTestnet.buyGasFor(uint256,address,address)._worker (contracts/NexusTestnet.sol#341) is not in mixedCase
Parameter NexusTestnet.sellGas(uint256,address)._amountToSell (contracts/NexusTestnet.sol#356) is not in mixedCase
Parameter NexusTestnet.sellGas(uint256,address)._worker (contracts/NexusTestnet.sol#357) is not in mixedCase
Parameter NexusTestnet.calcServiceDapps(string,address,bool).include_base (contracts/NexusTestnet.sol#930) is not in mixedCase
Parameter NexusTestnet.useGas(address,uint256,address)._consumer (contracts/NexusTestnet.sol#1085) is not in mixedCase
Parameter NexusTestnet.useGas(address,uint256,address)._amountToUse (contracts/NexusTestnet.sol#1086) is not in mixedCase
Parameter NexusTestnet.useGas(address,uint256,address)._worker (contracts/NexusTestnet.sol#1087) is not in mixedCase
Variable NexusTestnet.s_config (contracts/NexusTestnet.sol#256) is not in mixedCase
Function ReentrancyGuardUpgradeable.__ReentrancyGuard_init() (contracts/ReentrancyGuardUpgradeable.sol#41-43) is not in mixedCase
Function ReentrancyGuardUpgradeable.__ReentrancyGuard_init_unchained() (contracts/ReentrancyGuardUpgradeable.sol#45-47) is not in mixedCase
Variable ReentrancyGuardUpgradeable.__gap (contracts/ReentrancyGuardUpgradeable.sol#69) is not in mixedCase
Struct INexus.queueJobArgs (contracts/interfaces/INexus.sol#6-14) is not in CapWords
Struct INexus.queueServiceArgs (contracts/interfaces/INexus.sol#16-22) is not in CapWords
Parameter INexus.setConsumerContract(address).authorized_contract (contracts/interfaces/INexus.sol#24) is not in mixedCase
Contract console (node_modules/hardhat/console.sol#4-1532) is not in CapWords
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#conformance-to-solidity-naming-conventions

Parameter DappOracle.updatePrice(uint256,uint256,uint256)._lastDappUsdPrice (contracts/DappOracle.sol#17) is not in mixedCase
Parameter DappOracle.updatePrice(uint256,uint256,uint256)._lastDappEthPrice (contracts/DappOracle.sol#17) is not in mixedCase
Parameter DappOracle.updatePrice(uint256,uint256,uint256)._lastGasPriceWei (contracts/DappOracle.sol#17) is not in mixedCase
Parameter DappOracleDapp.updatePrice(uint256,uint256)._lastDappUsdPrice (contracts/DappOracleDapp.sol#15) is not in mixedCase
Parameter DappOracleDapp.updatePrice(uint256,uint256)._lastDappEthPrice (contracts/DappOracleDapp.sol#15) is not in mixedCase
Parameter DappOraclePolygon.updatePrice(uint256,uint256)._lastUsdDappPrice (contracts/DappOraclePolygon.sol#19) is not in mixedCase
Parameter DappOraclePolygon.updatePrice(uint256,uint256)._lastDappMaticPrice (contracts/DappOraclePolygon.sol#19) is not in mixedCase
Parameter DappOracleGasUsd.updatePrice(uint256,uint256)._lastDappUsdPrice (contracts/DappOracleUsdGas.sol#15) is not in mixedCase
Parameter DappOracleGasUsd.updatePrice(uint256,uint256)._lastGasPriceWei (contracts/DappOracleUsdGas.sol#15) is not in mixedCase
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#conformance-to-solidity-naming-conventions

Consumer.queueJob(address,string) (contracts/Consumer.sol#25-28) uses literals with too many digits:
        - nexus.queueJob(INexus.queueJobArgs(owner,natpdev/rust-compiler,inputFS,true,1000000,false,arr)) (contracts/Consumer.sol#27)
Nexus.getDappUsd() (contracts/Nexus.sol#1076-1086) uses literals with too many digits:
        - bancorNetwork.rateByPath(table,1000000) (contracts/Nexus.sol#1085)
NexusPrivate.getFeedData() (contracts/NexusPrivate.sol#1033-1038) uses literals with too many digits:
        - 37000000000 (contracts/NexusPrivate.sol#1036)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#too-many-digits

ReentrancyGuardUpgradeable.__gap (contracts/ReentrancyGuardUpgradeable.sol#69) is never used in Nexus (contracts/Nexus.sol#12-1222)
ReentrancyGuardUpgradeable.__gap (contracts/ReentrancyGuardUpgradeable.sol#69) is never used in NexusBSC (contracts/NexusBSC.sol#11-1145)
NexusBSC.usdtToken (contracts/NexusBSC.sol#19) is never used in NexusBSC (contracts/NexusBSC.sol#11-1145)
NexusBSC.usdtBntToken (contracts/NexusBSC.sol#20) is never used in NexusBSC (contracts/NexusBSC.sol#11-1145)
OwnableUpgradeable.__gap (node_modules/@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol#87) is never used in NexusPolygon (contracts/NexusPolygon.sol#13-1183)
ReentrancyGuardUpgradeable.__gap (contracts/ReentrancyGuardUpgradeable.sol#69) is never used in NexusPrivate (contracts/NexusPrivate.sol#11-1149)
NexusPrivate.usdtToken (contracts/NexusPrivate.sol#19) is never used in NexusPrivate (contracts/NexusPrivate.sol#11-1149)
NexusPrivate.usdtBntToken (contracts/NexusPrivate.sol#20) is never used in NexusPrivate (contracts/NexusPrivate.sol#11-1149)
ReentrancyGuardUpgradeable.__gap (contracts/ReentrancyGuardUpgradeable.sol#69) is never used in NexusTestnet (contracts/NexusTestnet.sol#11-1144)
NexusTestnet.usdtToken (contracts/NexusTestnet.sol#19) is never used in NexusTestnet (contracts/NexusTestnet.sol#11-1144)
NexusTestnet.usdtBntToken (contracts/NexusTestnet.sol#20) is never used in NexusTestnet (contracts/NexusTestnet.sol#11-1144)
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#unused-state-variable

NexusBSC.usdtBntToken (contracts/NexusBSC.sol#20) should be constant
NexusBSC.usdtToken (contracts/NexusBSC.sol#19) should be constant
NexusPrivate.usdtBntToken (contracts/NexusPrivate.sol#20) should be constant
NexusPrivate.usdtToken (contracts/NexusPrivate.sol#19) should be constant
NexusTestnet.usdtBntToken (contracts/NexusTestnet.sol#20) should be constant
NexusTestnet.usdtToken (contracts/NexusTestnet.sol#19) should be constant
Reference: https://github.com/crytic/slither/wiki/Detector-Documentation#state-variables-that-could-be-declared-constant
. analyzed (33 contracts with 81 detectors), 292 result(s) found