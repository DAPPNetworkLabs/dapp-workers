//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Nexus is Ownable {
    using SafeERC20 for IERC20;    
    uint public gasPerTimeUnit = 100;
    // uint8 costs more when in non-struct form
    // https://ethereum.stackexchange.com/questions/3067/why-does-uint8-cost-more-gas-than-uint
    uint public dollarPrecision = 2;
    IERC20 public token;

    event BoughtGas(
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

    struct JobData {
        address owner;
        address[] dsps;
        bool callback;
        uint resultsCount;
        string imageName;
        mapping(uint =>bool) done;
        mapping(uint =>bytes32) dataHash;
    }
    
    struct ServiceData {
        address owner;
        address[] dsps;
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
    mapping(string => JobDockerImage) internal jobDockerImages;
    mapping(string => ServiceDockerImage) internal serviceDockerImages;

    uint public lastJobID;

    constructor (
        // string memory manifest,
        address _tokenContract
        ) {
        token = IERC20(_tokenContract);
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
        emit BoughtGas(_consumer, _dsp, _amount);
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
        token.safeTransferFrom(address(this),_consumer, _amountToSell);
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
        require(_amountToUse <= dspData[_consumer][_dsp].amount, "not enough gas");

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
        token.safeTransferFrom(address(this), _dsp, claimableAmount);
        emit ClaimedGas(_dsp, claimableAmount);
    }
    
    /**
     * @dev ensures returned data hash is universally accepted
     */
    function submitResEntry(uint jobID,bytes32 dataHash) private returns (bool) {
        JobData storage jd = jobs[jobID];
        // address _consumer = jd.owner;
        address _dsp = msg.sender;        
        int founds = -1;
        bool inconsistent = false;
        for (uint i=0; i<jd.dsps.length; i++) {
            if(jd.done[i]){
                if(jd.dataHash[i] != dataHash){
                    inconsistent = true;
                }
            }
            if(jd.dsps[i] == _dsp){
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
    function validateDsp(address[] storage dsps) private view {
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
        address _consumer = jd.owner;
        
        bool inconsistent = submitResEntry(jobID, dataHash);
        address _dsp = msg.sender;
        
        uint gasUsed;
        if(jd.callback){
            gasUsed = gasleft();
            (bool success, bytes memory data) = address(_consumer).call(abi.encodeWithSignature(
                "_dspcallback(uint)",
                jobID
            ));
            gasUsed = gasUsed - gasleft();
        }

        // calc gas usage and deduct from quota as DAPPs (using Bancor) or as eth
        uint dapps = calcGas(gasUsed,"job",jd.imageName);

        // todo: add callback gas compensation
        // useGas(
        //     _consumer,
        //     dapps,
        //     _dsp
        // );
        emit JobResult(_consumer, _dsp, outputFS, dapps, jobID);
        if(jd.dsps.length != jd.resultsCount){
            return;          
        }
        emit JobDone(_consumer, outputFS,inconsistent, jobID);
    }
    
    /**
     * @dev run service
     */
    function calcGas(uint gas, string memory jobType, string memory imageName) private returns (uint) {
        uint jobDapps = calcDapps(jobType,imageName);
        return 1+jobDapps;
    }

    function calcDapps(string memory jobType, string memory imageName) private returns (uint) {
        if(compareStrings(jobType, "job")) {
            return jobDockerImages[imageName].jobFee;
        } else if(compareStrings(jobType, "service")) {
            uint baseFee = serviceDockerImages[imageName].baseFee;
            // base fee per hour * 24 hours * 30 days for monthly rate
            return baseFee * 24 * 30;
        }
    }
    
    /**
     * @dev run service
     */
    // event listen to from client
    function serviceCallback(uint jobID, uint port) public {
        ServiceData storage sd = services[jobID];

        validateDsp(sd.dsps);
        
        address _consumer = sd.owner;
        sd.ports[msg.sender] = port;

        // add dapps for 1mo of base
        uint dapps = calcDapps("service",sd.imageName);

        // useGas(
        //     _consumer,
        //     dapps,
        //     msg.sender
        // );

        emit ServiceRunning(_consumer, msg.sender, jobID, port);
    }
    
    /**
     * @dev handle job error
     */
    function jobError(uint jobID, string calldata  stdErr, string calldata outputFS) public {
        JobData storage jd = jobs[lastJobID];
        address _dsp = msg.sender;
        int founds = -1;
        bool inconsistent = false;
        for (uint i=0; i<jd.dsps.length; i++) {
            if(jd.dsps[i] == _dsp){
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
        validateDsp(sd.dsps);
        emit ServiceError(sd.owner, msg.sender, stdErr, outputFS, jobID);
    }
    
    /**
     * @dev compare strings by hash
     */
    function compareStrings(string memory a, string memory b) internal view returns (bool) {
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
            jd.dsps = consumerData[args.consumer].dsps;
            jd.callback = args.callback;
            jd.owner = args.consumer;
            jd.imageName = args.imageName;
        } else if(compareStrings(args.imageType, "service")){
            ServiceData storage sd = services[lastJobID];
            sd.dsps = consumerData[args.consumer].dsps;
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
    ) public onlyOwner {
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
    ) public onlyOwner {
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
     * @dev returns docker image
     */
    function getDockerImage(string calldata imageName, string calldata imageType) public view returns (string memory) {
        if(compareStrings(imageType, "job")){
            return jobDockerImages[imageName].image;
        } else if(compareStrings(imageType, "service")) {
            return serviceDockerImages[imageName].image;
        } else {
            revert("invalid image type");
        }
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