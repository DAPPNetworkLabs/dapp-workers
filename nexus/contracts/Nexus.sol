//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IBancorNetwork.sol";
import "./interfaces/AggregatorV3Interface.sol";

import "hardhat/console.sol";

contract Nexus is Ownable {
    using SafeERC20 for IERC20;

    uint public gasPerTimeUnit = 100;
    uint public dollarPrecision = 2;
    
    IERC20 public token;
    IBancorNetwork public bancorNetwork;
    AggregatorV3Interface public immutable FAST_GAS_FEED;

    address dappToken = 0x939B462ee3311f8926c047D2B576C389092b1649;
    address dappBntToken = 0x33A23d447De16a8Ff802c9Fcc917465Df01A3977;
    address bntToken = 0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C;
    address ethBntToken = 0xb1CD6e4153B2a390Cf00A6556b0fC1458C4A5533;
    address ethToken = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    
    // address[] public dappEthPath = [
    //     "0x939B462ee3311f8926c047D2B576C389092b1649",
    //     "0x33A23d447De16a8Ff802c9Fcc917465Df01A3977",
    //     "0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C",
    //     "0xb1CD6e4153B2a390Cf00A6556b0fC1458C4A5533",
    //     "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    // ];
    // address[] public dappBntPath = ["0x939b462ee3311f8926c047d2b576c389092b1649","0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c"];
    // address[] public bntEthPath = ["0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c","0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"];

    uint256 private constant CUSHION = 5_000;
    uint256 private constant JOB_GAS_OVERHEAD = 80_000;
    uint256 private constant PPB_BASE = 1_000_000_000;
    uint256 private constant BASE_MULT = 200_000_000;
    uint256 private constant FLAT_FEE = 0;

    event BoughtGas(
        address indexed buyer,
        address indexed consumer,
        address indexed dsp,
        uint amount
    );

    event SoldGas(
        address indexed consumer,
        address indexed dsp,
        uint amount
    );

    event ClaimedGas(
        address indexed dsp,
        uint amount
    );

    event JobResult(
        address indexed consumer, 
        address indexed dsp,
        // string stdOut,  
        string outputFS,
        uint dapps,
        uint id
    );

    event JobDone(
        address indexed consumer, 
        // string stdOut,  
        string outputFS,
        bool inconsistent,
        uint id
    );

    event ServiceRunning(
        address indexed consumer,
        address indexed dsp,
        uint id,
        uint port
    );

    event UsedGas(
        address indexed consumer,
        address indexed dsp,
        uint amount
    );

    event Run(
        address indexed consumer,
        string imageName,
        string inputFS,
        bool callback,
        string[] args,
        uint id,
        string imageType
    );

    event Kill(
        address indexed consumer,
        uint id
    );

    event DSPStatusChanged(
        address indexed dsp,
        bool active,
        string endpoint,
        uint gasFeeMult
    );
    
    event DockerSet(
        address owner,
        string imageName,
        string image,
        string imageHash,
        string imageType
    );

    event DockerApprovalChanged(
        address indexed dsp,
        string image,
        bool approved
    );

    event JobError(
        address indexed consumer, 
        string stdErr,
        string outputFS,
        uint id
    );
    
    event ServiceError(
        address indexed consumer, 
        address indexed dsp, 
        string stdErr,
        string outputFS,
        uint id
    );

    struct PerConsumerDSPEntry {
        uint amount;
        uint claimable;
    }

    struct RegisteredDSP {
        bool active;
        mapping(string => bool) approvedImages;
        string endpoint;
        uint claimableDapp;
        uint gasFeeMult;
    }
    
    struct Consumer{
        address owner;
        address[] dsps;
        // Process[] runningProcesses;
    }

    // note, may add back dsps to conserve gas versus func call
    struct JobData {
        address owner;
        // address[] dsps;
        bool callback;
        uint resultsCount;
        string imageName;
        uint gasLimit;
        mapping(uint =>bool) done;
        mapping(uint =>bytes32) dataHash;
    }

    // note, may add back dsps to conserve gas versus func call
    struct ServiceData {
        address owner;
        // address[] dsps;
        string imageName;
        mapping(address =>uint) ports;
    }

    struct JobDockerImage {
        address owner;
        string image;
        string imageHash;
        uint jobFee;
    }

    struct ServiceDockerImage {
        address owner;
        string image;
        string imageHash;
        uint baseFee;
        uint storageFee;
        uint ioFee;
    }

    struct runArgs {
        address consumer;
        string imageName;
        string imageType;
        string inputFS;
        bool callback;
        string[] args;
    }

    mapping(address => RegisteredDSP) public registeredDSPs;
    mapping(address => mapping(address => PerConsumerDSPEntry)) public dspData;
    mapping(address => Consumer) public consumerData;
    mapping(uint => JobData) public jobs;
    mapping(uint => ServiceData) public services;
    mapping(string => JobDockerImage) public jobDockerImages;
    mapping(string => ServiceDockerImage) public serviceDockerImages;

    uint public lastJobID;

    constructor (
        // string memory manifest,
        address _tokenContract,
        address _bancorNetwork,
        address fastGasFeed
        ) {
        token = IERC20(_tokenContract);
        bancorNetwork = IBancorNetwork(_bancorNetwork);
        FAST_GAS_FEED = AggregatorV3Interface(fastGasFeed);
    }
    
    /**
     * @dev convert address type to string
     */
    function toString(address account) public pure returns(string memory) {
        return toString(abi.encodePacked(account));
    }
    
    /**
     * @dev converts uint to string
     */
    function toString(uint value) public pure returns(string memory) {
        return toString(abi.encodePacked(value));
    }
    
    /**
     * @dev converts bytes32 value to string
     */
    function toString(bytes32 value) public pure returns(string memory) {
        return toString(abi.encodePacked(value));
    }
    
    /**
     * @dev converts bytes value to string
     */
    function toString(bytes memory data) public pure returns(string memory) {
        bytes memory alphabet = "0123456789abcdef";

        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < data.length; i++) {
            str[2+i*2] = alphabet[uint(uint8(data[i] >> 4))];
            str[3+i*2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }

    /**
     * @dev sets quorum of dsp addresses, requires all dsps be active
     */
    function setQuorum(address consumer, address[] calldata dsps) public {
        if(consumerData[msg.sender].owner != address(0)){
            require(consumerData[msg.sender].owner == msg.sender, "not owner");
        }
        else {
            require(consumer == msg.sender,  toString(msg.sender));
        }
        
        for (uint i=0; i<dsps.length; i++) {
            require(registeredDSPs[dsps[i]].active, "dsp not active");
        }

        consumerData[consumer].dsps = dsps;
    }
    
    /**
     * @dev create consumer data entry
     */
    function setConsumerPermissions(address owner) public {
        consumerData[msg.sender].owner = owner;
    }
    
    /**
     * @dev return consumer dsps
     */
    function getConsumerDsps(address consumer) public view returns (address[] memory) {
        return consumerData[consumer].dsps;
    }
    
    /**
     * @dev transfer DAPP to contract to process jobs
     */
    // holds snapshots
    function buyGasFor(
        uint _amount,
        address _consumer,
        address _dsp
    ) public {
        require(registeredDSPs[_dsp].active,"dsp inactive");
        token.safeTransferFrom(msg.sender, address(this), _amount);
        dspData[_consumer][_dsp].amount += _amount;
        emit BoughtGas(msg.sender, _consumer, _dsp, _amount);
    }
    
    /**
     * @dev return DAPP
     */
    function sellGas(
        uint _amountToSell,
        address _dsp
    ) public {
        address _consumer = msg.sender;
        require(!(_amountToSell > dspData[_consumer][_dsp].amount),"overdrawn balance");
        dspData[_consumer][_dsp].amount -= _amountToSell;
        token.safeTransfer(_consumer, _amountToSell);
        emit SoldGas(_consumer, _dsp, _amountToSell);
    }
    
    /**
     * @dev use DAPP gas, vroom
     */
    function useGas(
        address _consumer,
        uint _amountToUse,
        address _dsp
    ) internal {
        require(_amountToUse <= dspData[_consumer][_dsp].amount, "not enough dapp gas");

        dspData[_consumer][_dsp].amount -= _amountToUse;
        registeredDSPs[_dsp].claimableDapp += _amountToUse;
        emit UsedGas(_consumer, _dsp, _amountToUse);
    }
    
    /**
     * @dev allows dsp to claim for consumer
     */
    function claim(
        address _dsp
    ) external {
        uint claimableAmount = registeredDSPs[_dsp].claimableDapp;
        require(claimableAmount != 0,"must have positive balance to claim");
        token.safeTransfer(_dsp, claimableAmount);
        emit ClaimedGas(_dsp, claimableAmount);
    }
    
    /**
     * @dev ensures returned data hash is universally accepted
     */
    function submitResEntry(uint jobID,bytes32 dataHash, address[] memory dsps) private returns (bool) {
        JobData storage jd = jobs[jobID];
        address _dsp = msg.sender;        
        int founds = -1;
        bool inconsistent = false;
        for (uint i=0; i<dsps.length; i++) {
            if(jd.done[i]){
                if(jd.dataHash[i] != dataHash){
                    inconsistent = true;
                }
            }
            if(dsps[i] == _dsp){
                founds = int(i);
                break;
            }
        }
        require(founds > -1, "dsp not found");

        require(!jd.done[uint(founds)], "already done");
        jd.done[uint(founds)]  = true;
        jd.resultsCount++;
        jd.dataHash[uint(founds)] = dataHash;
        return inconsistent;
    }
    
    /**
     * @dev validates dsp is authorized for job or service
     */
    function validateDsp(address[] memory dsps) private view {
        int founds = -1;
        for (uint i=0; i<dsps.length; i++) {
            if(dsps[i] == msg.sender){
                founds = int(i);
                break;
            }
        }
        require(founds > -1, "dsp not found");
    }
    
    /**
     * @dev determines data hash consistency and performs optional callback
     */
    function jobCallback(uint jobID, string calldata outputFS) public {
        
        bytes32 dataHash = keccak256(abi.encodePacked(outputFS));

        JobData storage jd = jobs[jobID];
        address[] memory dsps = getConsumerDsps(jd.owner);
        
        bool inconsistent = submitResEntry(jobID, dataHash, dsps);
        bool success;
        
        uint gasUsed;
        if(jd.callback){
            gasUsed = gasleft();
            success = callWithExactGas(jd.gasLimit, jd.owner, abi.encodeWithSignature(
                "_dspcallback(uint)",
                jobID
            ));
            gasUsed = gasUsed - gasleft();
        }

        // calc gas usage and deduct from quota as DAPPs (using Bancor) or as eth
        uint dapps = calculatePaymentAmount(gasUsed,jd.imageName);

        // todo: add callback gas compensation
        useGas(
            jd.owner,
            dapps,
            msg.sender
        );
        emit JobResult(jd.owner, msg.sender, outputFS, dapps, jobID);
        if(dsps.length != jd.resultsCount){
            return;
        }
        emit JobDone(jd.owner, outputFS,inconsistent, jobID);
    }
    
    /**
     * @dev calculate fee
     */
    function calculatePaymentAmount(
        uint gas,
        string memory imageName
    ) private view returns (uint payment) {
        uint jobDapps = calcDapps("job",imageName);
        uint gasWei = getFeedData(); // 99000000000 fast gas price of 1 gas in wei
        address[] memory table = new address[](5);
        table[0] = dappToken;
        table[1] = dappBntToken;
        table[2] = bntToken;
        table[3] = ethBntToken;
        table[4] = ethToken;
        uint dappEth = bancorNetwork.rateByPath(table,10000); // how much 18,ETH for 1 4,DAPP
        // 99000000000 * 80000 = 7.92E15 ((7.92E15/1e18)*$3,980) = $31.52 for gas for base * 20% fee
        // 5,051.2821 DAPP for $39.40
        gas += JOB_GAS_OVERHEAD;
        uint weiForGas = gasWei * gas; 
        // 7.92E15 * 1e9 = 7.92E24
        // 7.92E24 * 1,200,000,000 = 9.504E33
        // 9.504E33 / 1989696218183 = 4.776608566E21
        // add 0
        // 4.776608566E21 + 0 = 4.776608566E21
        uint total = weiForGas * 1e9 * (PPB_BASE + BASE_MULT) / dappEth;
        // uint total = weiForGas.mul(1e9).mul(PPB_BASE.add(BASE_MULT)).div(dappEth).add(FLAT_FEE.mul(1e12));
        total /= 1e14;
        total += jobDapps;
        // require(total <= LINK_TOTAL_SUPPLY, "payment greater than all LINK");
        return total;
    }

    /**
    * @dev retrieves feed data for fast gas/eth and link/eth prices. if the feed
    * data is stale it uses the configured fallback price. Once a price is picked
    * for gas it takes the min of gas price in the transaction or the fast gas
    * price in order to reduce costs for the upkeep clients.
    */
    function getFeedData() private view returns (uint256 gasWei) {
        uint32 stalenessSeconds = 86400; // can make configurable
        bool staleFallback = stalenessSeconds > 0;
        uint256 timestamp;
        int256 feedValue; // = 99000000000 / 1e9 = 99 gwei
        (, feedValue, , timestamp, ) = FAST_GAS_FEED.latestRoundData();
        if ((staleFallback && stalenessSeconds < block.timestamp - timestamp) || feedValue <= 0) {
            gasWei = 200; // can make configurable
        } else {
            gasWei = uint256(feedValue);
        }
        return gasWei;
    }

    function calcDapps(string memory jobType, string memory imageName) private view returns (uint) {
        if(compareStrings(jobType, "job")) {
            return jobDockerImages[imageName].jobFee;
        } else if(compareStrings(jobType, "service")) {
            uint baseFee = serviceDockerImages[imageName].baseFee;
            // base fee per hour * 24 hours * 30 days for monthly rate
            return baseFee * 24 * 30;
        }
    }

    function feeToDapps(uint dapps) private view returns (uint) {
        // take $ cost and convert to dapps at current rate
        return 1;
    }

    /**
    * @dev calls target address with exactly gasAmount gas and data as calldata
    * or reverts if at least gasAmount gas is not available
    */
    function callWithExactGas(
        uint256 gasAmount,
        address target,
        bytes memory data
    ) private returns (bool success) {
        assembly {
        let g := gas()
        // Compute g -= CUSHION and check for underflow
        if lt(g, CUSHION) {
            revert(0, 0)
        }
        g := sub(g, CUSHION)
        // if g - g//64 <= gasAmount, revert
        // (we subtract g//64 because of EIP-150)
        if iszero(gt(sub(g, div(g, 64)), gasAmount)) {
            revert(0, 0)
        }
        // solidity calls check that a contract actually exists at the destination, so we do the same
        if iszero(extcodesize(target)) {
            revert(0, 0)
        }
        // call and return whether we succeeded. ignore return data
        success := call(gasAmount, target, 0, add(data, 0x20), mload(data), 0, 0)
        }
        return success;
    }
    
    /**
     * @dev run service
     */
    // add check for not conflicting with DSP frontend default ports
    function serviceCallback(uint jobID, uint port) public {
        require(port != 8888,"dsp portal port overlap");

        ServiceData storage sd = services[jobID];

        validateDsp(getConsumerDsps(sd.owner));
        
        address _consumer = sd.owner;
        sd.ports[msg.sender] = port;

        // add dapps for 1mo of base
        uint dapps = calcDapps("service",sd.imageName);

        useGas(
            _consumer,
            dapps,
            msg.sender
        );

        emit ServiceRunning(_consumer, msg.sender, jobID, port);
    }
    
    /**
     * @dev handle job error
     */
    function jobError(uint jobID, string calldata  stdErr, string calldata outputFS) public {
        JobData storage jd = jobs[lastJobID];
        address _dsp = msg.sender;
        address[] memory dsps = getConsumerDsps(jd.owner);
        int founds = -1;
        for (uint i=0; i<dsps.length; i++) {
            if(dsps[i] == _dsp){
                founds = int(i);
                break;
            }
        }
        require(founds > -1, "dsp not found");
        require(!jd.done[uint(founds)], "already done");
        jd.done[uint(founds)]  = true;
        emit JobError(jd.owner, stdErr, outputFS, jobID);
    }
    
    /**
     * @dev handle service error
     */
    function serviceError(uint jobID, string calldata  stdErr, string calldata outputFS) public {
        ServiceData storage sd = services[lastJobID];
        validateDsp(getConsumerDsps(sd.owner));
        emit ServiceError(sd.owner, msg.sender, stdErr, outputFS, jobID);
    }
    
    /**
     * @dev compare strings by hash
     */
    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }
    
    /**
     * @dev run job or service
     */
    function run(runArgs calldata args) public {
        if(consumerData[args.consumer].owner != address(0)){
            require(consumerData[args.consumer].owner == msg.sender);
        } else {
            require(args.consumer == msg.sender);
        }
        lastJobID = lastJobID + 1;
        if(compareStrings(args.imageType, "job")){
            JobData storage jd = jobs[lastJobID];
            jd.callback = args.callback;
            jd.owner = args.consumer;
            jd.imageName = args.imageName;
            jd.gasLimit = 1000000;
        } else if(compareStrings(args.imageType, "service")){
            ServiceData storage sd = services[lastJobID];
            sd.owner = args.consumer;
            sd.imageName = args.imageName;
        } else {
            revert("invalid image type");
        }

        emit Run(
            args.consumer,
            args.imageName,
            args.inputFS,
            args.callback,
            args.args,
            lastJobID,
            args.imageType
        );
    }
    
    /**
     * @dev active and set endpoint and gas fee mult for dsp
     */
    function regDSP(string calldata endpoint, uint gasFeeMult) public {
        address _dsp = msg.sender;
        registeredDSPs[_dsp].active = true;
        registeredDSPs[_dsp].endpoint = endpoint;
        registeredDSPs[_dsp].gasFeeMult = gasFeeMult;
        
        emit DSPStatusChanged(_dsp, true, endpoint, gasFeeMult);
    }
    
    /**
     * @dev deprecate dsp
     */
    function deprecateDSP() public {
        address _dsp = msg.sender;
        registeredDSPs[_dsp].active = false;
        registeredDSPs[_dsp].endpoint = "";
        emit DSPStatusChanged(_dsp, false,"", 0);
    }
    
    /**
     * @dev set docker image
     */
    function setJobDockerImage(
        string calldata imageName,
        string calldata imageAddress,
        string calldata imageHash,
        uint jobFee
    ) public {
        address owner = msg.sender;        
        jobDockerImages[imageName].image = imageAddress;
        jobDockerImages[imageName].owner = owner;
        jobDockerImages[imageName].imageHash = imageHash;
        jobDockerImages[imageName].jobFee = jobFee;
        
        emit DockerSet(owner,imageName,imageAddress,imageHash,"job");
    }
    
    /**
     * @dev set docker image
     */
    function setServiceDockerImage(
        string calldata imageName,
        string calldata imageAddress,
        string calldata imageHash,
        uint baseFee,
        uint storageFee,
        uint ioFee
    ) public {
        address owner = msg.sender;
        serviceDockerImages[imageName].image = imageAddress;
        serviceDockerImages[imageName].owner = owner;
        serviceDockerImages[imageName].imageHash = imageHash;
        serviceDockerImages[imageName].baseFee = baseFee;
        serviceDockerImages[imageName].storageFee = storageFee;
        serviceDockerImages[imageName].ioFee = ioFee;
        
        emit DockerSet(owner,imageName,imageAddress,imageHash,"service");
    }
    
    /**
     * @dev returns approval status of image for dsp
     */
    function isImageApprovedForDSP(address _dsp, string calldata imageName) public view returns (bool) {
        return registeredDSPs[_dsp].approvedImages[imageName];
    }
    
    /**
     * @dev approve docker image for dsp
     */
    function approveDockerForDSP(string calldata imageName) public {
        address _dsp = msg.sender;
        registeredDSPs[_dsp].approvedImages[imageName] = true;        
        emit DockerApprovalChanged(_dsp,imageName,true);
    }
    
    /**
     * @dev unapprove docker image for dsp
     */
    function unapproveDockerForDSP(string calldata imageName) public  {
        address _dsp = msg.sender;
        registeredDSPs[_dsp].approvedImages[imageName] = false;
        emit DockerApprovalChanged(_dsp,imageName,false);
    }
    
    /**
     * @dev returns port for dsp and job id
     */
    function getPortForDSP(uint jobID, address dsp) public view returns (uint) {        
        ServiceData storage sd = services[jobID];
        return sd.ports[dsp];
    }
    
    /**
     * @dev returns dsp endpoint
     */
    function getDSPEndpoint(address dsp) public view returns (string memory) {
        return registeredDSPs[dsp].endpoint;
    }
}