//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.7.0 <0.9.0;
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Nexus is Ownable {
    using SafeERC20 for IERC20;    
    uint256 public gasPerTimeUnit = 100;
    IERC20 public token;

    event BoughtGas(
        address indexed consumer,
        address indexed dsp,
        uint256 amount
    );

    event SoldGas(
        address indexed consumer,
        address indexed dsp,
        uint256 amount
    );
    event ClaimedGas(
        address indexed consumer,
        address indexed dsp,
        uint256 amount
    );
    event JobResult(
        address indexed consumer, 
        // string stdOut,  
        string outputFS,
        uint256 dapps
    );

    event JobDone(
        address indexed consumer, 
        // string stdOut,  
        string outputFS,
        bool inconsistent,
        uint256 id
    );
    event UsedGas(
        address indexed consumer,
        address indexed dsp,
        uint256 amount
    );
    event Job(
        address indexed consumer,
        string jobType,
        string inputFS,
        string[] args,
        uint256 id
    );


    event DSPStatusChanged(
        address indexed dsp,
        bool active
    );



    struct PerConsumerDSPEntry {
        uint256 amount;
        uint256 claimable;
    }

    struct RegisteredDSP {
        bool active;
        mapping(string => bool) approvedImages;
    }
    
    struct Consumer {
        address owner;
        address[] dsps;
        // Process[] runningProcesses;

    }

    struct JobData {
        address owner;
        address[] dsps;
        uint256 resultsCount;
        mapping(uint256 =>bool) done;
        // block (for cleanup)
        mapping(uint256 =>bytes32) dataHash;
    }

    struct DockerImage {
        address owner;
        string image;
        string imageHash;
    }

    
    event DockerSet(
        address owner,
        string imageName,
        string image,
        string imageHash
    );

    event DockerApprovalChanged(
        address indexed dsp,
        string image,
        bool approved
    );

    mapping(address => RegisteredDSP) public registeredDSPs;
    mapping(address => mapping(address => PerConsumerDSPEntry)) public dspData;
    mapping(address => Consumer) public consumerData;
    mapping(uint256 => JobData) public jobs;    
    uint256 public lastJobID;
    


    constructor (
        // string memory manifest,
        // address _tokenContract
        ) {
        // token = IERC20(_tokenContract);
    }
    function toString(address account) public pure returns(string memory) {
        return toString(abi.encodePacked(account));
    }

    function toString(uint256 value) public pure returns(string memory) {
        return toString(abi.encodePacked(value));
    }

    function toString(bytes32 value) public pure returns(string memory) {
        return toString(abi.encodePacked(value));
    }

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
    function setQuorum(address consumer, address[] calldata dsps) public {        
        if(consumerData[msg.sender].owner != address(0)){
            require(consumerData[msg.sender].owner == msg.sender, "not owner");
        }
        else
            require(consumer == msg.sender,  toString(msg.sender));
        
        for (uint i=0; i<dsps.length; i++) {   
            require(registeredDSPs[dsps[i]].active, "dsp not active");
        }       
        consumerData[consumer].dsps = dsps;     
    }

    function setConsumerPermissions(address owner) public {
        
        consumerData[msg.sender].owner = owner;
    }

    // holds snapshots
    function buyGasFor(
        uint256 _amount,
        address _consumer,
        address _dsp
    ) public {
        if(!registeredDSPs[_dsp].active){
            // block new buys
        }
        
        token.safeTransferFrom(msg.sender, address(this), _amount);
        // increase reserve for user->dsp
        
        dspData[_consumer][_dsp].amount += _amount;
        emit BoughtGas(_consumer, _dsp, _amount);
    }
    function sellGas(
        uint256 _amountToSell,
        address _dsp
    ) public {
        address _consumer = msg.sender;                 
        // decrease reserve for user->dsp
        if(_amountToSell > dspData[_consumer][_dsp].amount){
            // throw
        }
        dspData[_consumer][_dsp].amount -= _amountToSell;
        token.safeTransferFrom(address(this),_consumer, _amountToSell);
        emit SoldGas(_consumer, _dsp, _amountToSell);
    }

    function claimFor(
        address _consumer,
        address _dsp
    ) public {                
        uint256 claimableAmount = dspData[_consumer][_dsp].claimable;
        if(claimableAmount == 0){
            // throw
        }
        token.safeTransferFrom(address(this), _dsp, claimableAmount);
        emit ClaimedGas(_consumer, _dsp, claimableAmount);
    }


    // function usage(address _dsp, uint256 used) public {
    //     // check if in quorom
    //     emit UsedGas(_consumer, _dsp, used);
    // }   
    function submitResEntry(uint256 jobID,bytes32 dataHash) private returns (bool) {
        JobData storage jd = jobs[jobID];
        // address _consumer = jd.owner;
        address _dsp = msg.sender;        
        int founds = -1;
        bool inconsistent = false;
        for (uint256 i=0; i<jd.dsps.length; i++) {
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
        require(founds > -1, "not found");

        require(!jd.done[uint256(founds)], "already done");
        jd.done[uint256(founds)]  = true;
        // fill in results hash
        jd.resultsCount++;
        jd.dataHash[uint256(founds)] = dataHash;
        return inconsistent;
    }
    function jobCallback(uint256 jobID, string memory outputFS, uint256 dapps) public {
        
        bytes32 dataHash = keccak256(abi.encodePacked(outputFS));

        JobData storage jd = jobs[jobID];
        address _consumer = jd.owner;
        // apply usage in dapps
        // 
        
        bool inconsistent = submitResEntry(jobID, dataHash);
        emit JobResult(_consumer, outputFS, dapps);        
        // calc gas usage and deduct from quota as DAPPs (using Bancor) or as eth
        // todo: compensate for gas
        // token.safeTransferFrom(address(this), _dsp, claimableAmount);
        if(jd.dsps.length != jd.resultsCount){
            return;          
        }
        emit JobDone(_consumer, outputFS,inconsistent, jobID);



    }
    
    function jobError(uint256 jobID, string calldata  stdErr, string calldata outputFS) public {
    }

    function runJob(address consumer, string calldata jobType, string calldata inputFS, string[] calldata args) public {
        // address _consumer = msg.sender;    
        if(consumerData[consumer].owner != address(0)){
            require(consumerData[consumer].owner == msg.sender);
        }
        else{
            require(consumer == msg.sender);
        }
        
        lastJobID = lastJobID + 1;
        JobData storage jd = jobs[lastJobID];
        jd.dsps = consumerData[consumer].dsps;     
        jd.owner = consumer;
        // todo: set callback function

        emit Job(consumer, jobType,inputFS,args, lastJobID);
    }

    // function getResult(uint256 jobID) public view {
        
    // }
    
    function regDSP() public {
        address _dsp = msg.sender;
        registeredDSPs[_dsp].active = true;
        emit DSPStatusChanged(_dsp, true);
    }
    
    function deprecateDSP() public {
        address _dsp = msg.sender;
        registeredDSPs[_dsp].active = false;
        emit DSPStatusChanged(_dsp, false);
    }
    
    mapping(string => DockerImage) internal dockerImages;

    function setDockerImage(string memory imageName, string memory imageAddress, string memory imageHash) public onlyOwner {
        address owner = msg.sender;        
        dockerImages[imageName].image = imageAddress;
        dockerImages[imageName].owner = owner;
        dockerImages[imageName].imageHash = imageHash;
        
        // todo: event
        emit DockerSet(owner,imageName,imageAddress,imageHash);
    }
    function getDockerImage(string memory imageName) public view returns (string memory) {
        return dockerImages[imageName].image;
    }
    function isImageApprovedForDSP(string memory imageName) public view returns (bool) {
        address _dsp = msg.sender;
        return registeredDSPs[_dsp].approvedImages[imageName];        
    }
 
    function approveDockerForDSP(string memory imageName) public {
        address _dsp = msg.sender;
        registeredDSPs[_dsp].approvedImages[imageName] = true;        
        emit DockerApprovalChanged(_dsp,imageName,true);
    }
    function unapproveDockerForDSP(string memory imageName) public  {
        address _dsp = msg.sender;
        registeredDSPs[_dsp].approvedImages[imageName] = false;
        emit DockerApprovalChanged(_dsp,imageName,false);
    }
}