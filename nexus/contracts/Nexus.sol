//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./SafeERC20Upgradeable.sol";
import "./ReentrancyGuardUpgradeable.sol";

import "./interfaces/IBancorNetwork.sol";
import "./interfaces/AggregatorV3Interface.sol";

// import "hardhat/console.sol";

contract Nexus is OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    
    IERC20Upgradeable public token;
    IBancorNetwork public bancorNetwork;
    AggregatorV3Interface public FAST_GAS_FEED;

    address private dappToken;
    address private dappBntToken;
    address private bntToken;
    address private ethBntToken;
    address private ethToken;

    uint public gasPerTimeUnit;
    uint public usdtPrecision;

    address private usdtToken;
    address private usdtBntToken;

    uint256 private constant CUSHION = 5_000;
    uint256 private constant JOB_GAS_OVERHEAD = 80_000;
    uint256 private constant PPB_BASE = 1_000_000_000;

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
        string outputFS,
        string outputHash,
        uint dapps,
        uint id
    );

    event JobDone(
        address indexed consumer, 
        string outputFS,
        string outputHash,
        bool inconsistent,
        uint id
    );

    event ServiceRunning(
        address indexed consumer,
        address indexed dsp,
        uint id,
        uint port
    );

    event ServiceExtended(
        address indexed consumer,
        address indexed dsp,
        uint id,
        uint ioMegaBytes, 
        uint storageMegaBytes,
        uint endDate
    );

    event UsedGas(
        address indexed consumer,
        address indexed dsp,
        uint amount
    );

    event QueueJob(
        address indexed consumer,
        address indexed owner,
        string imageName,
        uint id,
        string inputFS,
        string[] args
    );

    event QueueService(
        address indexed consumer,
        address indexed owner,
        string imageName,
        uint ioMegaBytes,
        uint storageMegaBytes,
        uint id,
        string inputFS,
        string[] args
    );

    event Kill(
        address indexed consumer,
        uint id
    );

    event DSPStatusChanged(
        address indexed dsp,
        bool active,
        string endpoint
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
    
    event ServiceComplete(
        address indexed consumer, 
        address indexed dsp, 
        string outputFS,
        uint id
    );
    
    event ConfigSet(
        uint32 paymentPremiumPPB,
        uint16 gasCeilingMultiplier,
        uint fallbackGasPrice,
        uint24 stalenessSeconds
    );
    
    event UpdateDsps(
        address consumer,
        address[] dsps
    );

    struct PerConsumerDSPEntry {
        uint amount;
        uint claimable;
    }

    struct RegisteredDSP {
        bool active;
        string endpoint;
        uint claimableDapp;
    }

    struct JobData {
        address consumer;
        address owner;
        address[] dsps;
        bool callback;
        uint resultsCount;
        string imageName;
        uint gasLimit;
        bool requireConsistent;
        mapping(uint => bool) done;
        mapping(uint => bytes32) dataHash;
    }

    struct DspServiceData {
        uint port;
        uint ioMegaBytesLimit;
        uint storageMegaBytesLimit;
    }

    struct ServiceData {
        address consumer;
        address owner;
        address[] dsps;
        string imageName;
        bool started;
        uint endDate;
        uint months;
        uint ioMegaBytes;
        uint storageMegaBytes;
        mapping(address => DspServiceData) dspServiceData;
        mapping(address => bytes32) dataHash;
        mapping(uint => bool) done;
    }

    struct DspDockerImage {
        uint jobFee;
        uint baseFee;
        uint storageFee;
        uint ioFee;
        uint minStorageMegaBytes;
        uint minIoMegaBytes;
    }

    struct queueJobArgs {
        address owner;
        string imageName;
        string inputFS;
        bool callback;
        uint gasLimit;
        bool requireConsistent;
        string[] args;
    }

    struct queueServiceArgs {
        address owner;
        string imageName;
        uint ioMegaBytes;
        uint storageMegaBytes;
        string inputFS;
        string[] args;
        uint months;
    }

    struct serviceErrorArgs {
        uint jobID;
        string stdErr;
        string outputFS;
        uint ioMegaBytesUsed;
        uint storageMegaBytesUsed;
    }

    struct serviceCompleteArgs {
        uint jobID;
        string outputFS;
        uint ioMegaBytesUsed;
        uint storageMegaBytesUsed;
    }

    struct DspLimits {
        uint ioMegaBytesLimit;
        uint storageMegaBytesLimit;
    }

    struct Config {
        uint32 paymentPremiumPPB;
        uint16 gasCeilingMultiplier;
        uint24 stalenessSeconds;
    }

    struct jobCallbackArgs {
        uint jobID;
        string outputFS;
        string outputHash;
    }

    struct initArgs {
        address _tokenContract;
        address _bancorNetwork;
        address _fastGasFeed;
        uint32 _paymentPremiumPPB;
        uint24 _stalenessSeconds;
        uint256 _fallbackGasPrice;
        uint16 _gasCeilingMultiplier;
        address _dappToken;
        address _dappBntToken;
        address _bntToken;
        address _ethBntToken;
        address _ethToken;
        uint256 _gasPerTimeUnit;
        uint256 _usdtPrecision;
        address _usdtToken;
        address _usdtBntToken;
    }

    mapping(address => RegisteredDSP) public registeredDSPs;
    mapping(address => mapping(address => PerConsumerDSPEntry)) public dspData;

    mapping(address => address[]) public providers;

    mapping(address => address) public contracts;
    
    mapping(uint => JobData) public jobs;
    mapping(uint => ServiceData) public services;

    mapping(string => string) public approvedImages;
    mapping(address => mapping(string => DspDockerImage)) public dspApprovedImages;

    uint public totalDsps;

    uint public lastJobID;

    mapping(uint => address) private dspList;

    Config private s_config;  
    uint256 private s_fallbackGasPrice; // not in config object for gas savings

    function initialize(
        initArgs memory args
    ) external initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        token = IERC20Upgradeable(args._tokenContract);
        bancorNetwork = IBancorNetwork(args._bancorNetwork);
        FAST_GAS_FEED = AggregatorV3Interface(args._fastGasFeed);
        
        dappToken = args._dappToken;
        dappBntToken = args._dappBntToken;
        bntToken = args._bntToken;
        ethBntToken = args._ethBntToken;
        ethToken = args._ethToken;
    
        gasPerTimeUnit = args._gasPerTimeUnit;
        usdtPrecision = args._usdtPrecision;

        usdtToken = args._usdtToken;
        usdtBntToken = args._usdtBntToken;

        setConfig(
            args._paymentPremiumPPB,
            args._gasCeilingMultiplier,
            args._fallbackGasPrice,
            args._stalenessSeconds
        );
    }
      
    /**
    * @notice set the current configuration of the nexus
    */
    function setConfig(
        uint32 paymentPremiumPPB,
        uint16 gasCeilingMultiplier,
        uint256 fallbackGasPrice,
        uint24 stalenessSeconds
    ) public onlyOwner {
        s_config = Config({
            paymentPremiumPPB: paymentPremiumPPB,
            gasCeilingMultiplier: gasCeilingMultiplier,
            stalenessSeconds: stalenessSeconds
        });

        s_fallbackGasPrice = fallbackGasPrice;

        emit ConfigSet(
            paymentPremiumPPB,
            gasCeilingMultiplier,
            fallbackGasPrice,
            stalenessSeconds
        );
    }

    function jobServiceCompleted(uint id, address dsp, bool isJob) external view returns (bool) {
        if(isJob) {
            JobData storage jd = jobs[id];
            address[] storage dsps = providers[jd.owner];
            int founds = validateDspCaller(dsps, dsp, false);

            if(founds == -1) return false;
            
            return jd.done[uint(founds)];
        } else {
            ServiceData storage sd = services[id];
            address[] storage dsps = providers[sd.owner];
            int founds = validateDspCaller(dsps, dsp, false);

            if(founds == -1) return false;

            return sd.done[uint(founds)];
        }
    }
    
    /**
     * @dev set dsps
     */
    function setDsps(address[] calldata dsps) external {
        validateActiveDsps(dsps);

        providers[msg.sender] = dsps;

        emit UpdateDsps(
            msg.sender,
            dsps
        );
    }
    
    /**
     * @dev set consumer contract
     */
    function setConsumerContract(address authorized_contract) external {
        contracts[msg.sender] = authorized_contract;
    }
    
    /**
     * @dev transfer DAPP to contract to process jobs
     */
    function buyGasFor(
        uint _amount,
        address _consumer,
        address _dsp
    ) public nonReentrant {
        require(registeredDSPs[_dsp].active,"inactive");

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
    ) public nonReentrant {
        address _consumer = msg.sender;

        require(!(_amountToSell > dspData[_consumer][_dsp].amount),"overdrawn");
        
        dspData[_consumer][_dsp].amount -= _amountToSell;

        token.safeTransfer(_consumer, _amountToSell);
        
        emit SoldGas(_consumer, _dsp, _amountToSell);
    }
    
    /**
     * @dev allows dsp to claim for consumer
     */
    function claim() external nonReentrant {
        uint claimableAmount = registeredDSPs[msg.sender].claimableDapp;

        require(claimableAmount != 0,"req pos bal");
        
        token.safeTransfer(msg.sender, claimableAmount);
        
        emit ClaimedGas(msg.sender, claimableAmount);
    }

    /**
    * @notice calculates the minimum balance required for an upkeep to remain eligible
    */
    function getMinBalance(uint256 id, string memory jobType, address dsp) external view returns (uint) {
        if(compareStrings(jobType, "job")) {
            return calculatePaymentAmount(jobs[id].gasLimit,jobs[id].imageName, dsp);
        } else if(compareStrings(jobType, "service")) {
            return calcServiceDapps(
                services[id].imageName, 
                services[id].ioMegaBytes, 
                services[id].storageMegaBytes, 
                dsp, 
                true
            );
        }
    }
    
    /**
     * @dev queue job
     */
    function queueJob(queueJobArgs calldata args) public {
        validateConsumer(msg.sender);

        address[] storage dsps = providers[args.owner];
        require(dsps.length > 0,"no dsps");
        
        validateActiveDsps(dsps);

        lastJobID = lastJobID + 1;

        JobData storage jd = jobs[lastJobID];

        jd.callback = args.callback;
        jd.requireConsistent = args.requireConsistent;
        jd.consumer = msg.sender;
        jd.owner = args.owner;
        jd.imageName = args.imageName;
        jd.gasLimit = args.gasLimit;
        

        for(uint i=0;i<dsps.length;i++) {
            require(isImageApprovedForDSP(dsps[i], args.imageName), "not approved");
            require(
                dspData[msg.sender][dsps[i]].amount 
                >= 
                calculatePaymentAmount(jobs[lastJobID].gasLimit,jobs[lastJobID].imageName, dsps[i])
                ,"bal not met"
            );
        }
        
        emit QueueJob(
            msg.sender,
            args.owner,
            args.imageName,
            lastJobID,
            args.inputFS,
            args.args
        );
    }
    
    /**
     * @dev queue service
     */
    function queueService(queueServiceArgs calldata args) public {
        validateConsumer(msg.sender);

        address[] storage dsps = providers[args.owner];
        require(dsps.length > 0,"no dsps");

        validateActiveDsps(dsps);

        for(uint i=0;i<dsps.length;i++) {
            require(isImageApprovedForDSP(dsps[i], args.imageName), "not approved");
            validateMin(
                args.ioMegaBytes, 
                args.storageMegaBytes, 
                args.imageName, 
                args.months, 
                dsps[i]
            );
        }

        lastJobID = lastJobID + 1;

        ServiceData storage sd = services[lastJobID];

        sd.consumer = msg.sender;
        sd.owner = args.owner;
        sd.imageName = args.imageName;
        sd.ioMegaBytes = args.ioMegaBytes;
        sd.storageMegaBytes = args.storageMegaBytes;
        sd.months = args.months;

        emit QueueService(
            msg.sender,
            args.owner,
            args.imageName,
            args.ioMegaBytes,
            args.storageMegaBytes,
            lastJobID,
            args.inputFS,
            args.args
        );
    }
    
    /**
     * @dev dsp run job, determines data hash consistency and performs optional callback
     */
    function jobCallback(jobCallbackArgs calldata args) public {
        JobData storage jd = jobs[args.jobID];

        address[] storage dsps = providers[jd.owner];
        require(dsps.length > 0,"no dsps");
        
        require(!jd.done[uint(validateDspCaller(dsps,msg.sender,true))], "completed");

        // maybe throw if user doesn't want to accept inconsistency
        bool inconsistent = submitResEntry(
            args.jobID,
            keccak256(abi.encodePacked(args.outputFS)),
            providers[jd.owner]
        );

        if(jd.requireConsistent) {
            require(inconsistent,"inconsistent");
        }
        
        uint gasUsed;
        bool success;

        if(jd.callback){
            gasUsed = gasleft();
            success = callWithExactGas(jd.gasLimit, jd.consumer, abi.encodeWithSignature(
                "_dspcallback(string,string)",
                args.outputFS,
                args.outputHash
            ));
            gasUsed = gasUsed - gasleft();
        }

        // calc gas usage and deduct from quota as DAPPs (using Bancor) or as eth
        uint dapps = calculatePaymentAmount(gasUsed,jd.imageName,msg.sender);

        useGas(
            jd.consumer,
            dapps,
            msg.sender
        );

        emit JobResult(
            jd.consumer,
            msg.sender,
            args.outputFS,
            args.outputHash,
            dapps,
            args.jobID
        );

        if(providers[msg.sender].length != jd.resultsCount){
            return;
        }

        emit JobDone(
            jd.consumer,
            args.outputFS,
            args.outputHash,
            inconsistent,
            args.jobID
        );
    }
    
    /**
     * @dev dsp run service
     */
    // add check for not conflicting with DSP frontend default ports
    function serviceCallback(uint serviceId, uint port) public {
        require(port != 8888,"overlap");

        ServiceData storage sd = services[serviceId];

        address[] storage dsps = providers[sd.owner];
        require(dsps.length > 0,"no dsps");

        validateDspCaller(dsps,msg.sender,true);

        require(sd.started == false, "started");

        sd.started = true;
        sd.endDate = block.timestamp + ( sd.months * 30 days );
        
        address _consumer = sd.consumer;

        sd.dspServiceData[msg.sender].port = port;
        sd.dspServiceData[msg.sender].ioMegaBytesLimit += sd.ioMegaBytes;
        sd.dspServiceData[msg.sender].storageMegaBytesLimit += sd.storageMegaBytes;
        
        uint dapps = calcServiceDapps(
            sd.imageName,
            sd.ioMegaBytes,
            sd.storageMegaBytes,
            msg.sender,
            true
        );

        useGas(
            _consumer,
            dapps,
            msg.sender
        );

        emit ServiceRunning(
            _consumer, 
            msg.sender, 
            serviceId, 
            port
        );
    }
    
    /**
     * @dev handle job error
     */
    function jobError(
        uint jobID,
        string calldata  stdErr,
        string calldata outputFS
    ) public {
        JobData storage jd = jobs[jobID];

        address[] storage dsps = providers[jd.owner];
        require(dsps.length > 0,"no dsps");

        uint founds = uint(validateDspCaller(dsps,msg.sender,true));

        require(!jd.done[founds], "completed");

        uint dapps = calculatePaymentAmount(0,jd.imageName,msg.sender);

        useGas(
            jd.consumer,
            dapps,
            msg.sender
        );

        jd.done[founds] = true;
        
        emit JobError(jd.consumer, stdErr, outputFS, jobID);
    }
    
    /**
     * @dev handle service error
     */
    function serviceError(serviceErrorArgs calldata args) public {
        ServiceData storage sd = services[args.jobID];

        address[] storage dsps = providers[sd.owner];
        require(dsps.length > 0,"no dsps");
        
        uint founds = uint(validateDspCaller(dsps,msg.sender,true));

        require(!sd.done[founds], "completed");
        
        uint dapps = calcServiceDapps(
            sd.imageName,
            args.ioMegaBytesUsed,
            args.storageMegaBytesUsed,
            msg.sender,
            true
        );

        useGas(
            sd.consumer,
            dapps,
            msg.sender
        );

        sd.done[founds] = true;
        
        emit ServiceError(
            sd.consumer,
            msg.sender,
            args.stdErr,
            args.outputFS,
            args.jobID
        );
    }
    
    
    /**
     * @dev returns if service time done
     */
    function isServiceDone(uint id) external view returns (bool) {
        ServiceData storage sd = services[id];
        return sd.endDate < block.timestamp;
    }
    
    /**
     * @dev complete service
     */
    function serviceComplete(serviceCompleteArgs calldata args) public {
        ServiceData storage sd = services[args.jobID];

        require(sd.started == true, "not started");
        require(sd.endDate < block.timestamp, "time remaining");

        address[] storage dsps = providers[sd.owner];
        require(dsps.length > 0,"no dsps");
        
        uint founds = uint(validateDspCaller(dsps,msg.sender,true));

        require(!sd.done[founds], "completed");
        
        uint dapps = calcServiceDapps(
            sd.imageName,
            args.ioMegaBytesUsed,
            args.storageMegaBytesUsed,
            msg.sender,
            true
        );

        useGas(
            sd.consumer,
            dapps,
            msg.sender
        );

        sd.done[founds] = true;
        
        emit ServiceComplete(
            sd.consumer,
            msg.sender,
            args.outputFS,
            args.jobID
        );
    }

    /**
     * @dev extend service duration
     */
    function extendService(
        uint serviceId, 
        string calldata imageName, 
        uint months, 
        uint ioMb, 
        uint storageMb 
    ) external {
        validateConsumer(msg.sender);
        
        ServiceData storage sd = services[serviceId];

        require(compareStrings(imageName, sd.imageName),"missmatch");
        require(sd.endDate > block.timestamp, "time remaining");

        address[] storage dsps = providers[msg.sender];
        require(dsps.length > 0,"no dsps");

        // require service not completed
        // if service completed by dsp, do not charge

        for(uint i=0;i<dsps.length;i++) {
            bool include_base = months == 0 ? false : true;
            
            uint dapps = calcServiceDapps(
                imageName,
                ioMb,
                storageMb,
                dsps[i],
                include_base
            );

            if(include_base) {
                dapps *= months;
                validateMin(ioMb, storageMb, imageName, months, dsps[i]);
                sd.endDate = sd.endDate + ( months * 30 days );
            }

            buyGasFor(
                dapps,
                msg.sender,
                dsps[i]
            );

            sd.dspServiceData[dsps[i]].ioMegaBytesLimit += ioMb;
            sd.dspServiceData[dsps[i]].storageMegaBytesLimit += storageMb;

            emit ServiceExtended(
                msg.sender, 
                dsps[i], 
                serviceId, 
                sd.dspServiceData[dsps[i]].ioMegaBytesLimit, 
                sd.dspServiceData[dsps[i]].storageMegaBytesLimit, 
                sd.endDate
            );
        }
    }

    /**
    * @notice calculates the maximum payment for a given gas limit
    */
    function getMaxPaymentForGas(
        uint256 gasLimit, 
        string memory imageName, 
        address dsp
    ) external view returns (uint256 maxPayment) {
        return calculatePaymentAmount(gasLimit, imageName, dsp);
    }
    
    /**
     * @dev gov approve image
     */
    function approveImage(string calldata imageName, string calldata imageHash) external onlyOwner {
        require(bytes(approvedImages[imageName]).length == 0, "image exists");
        require(bytes(imageHash).length != 0, "invalid hash");

        approvedImages[imageName] = imageHash;
    }
    
    /**
     * @dev active and set endpoint and gas fee mult for dsp
     */
    function regDSP(string calldata endpoint) public {
        require(bytes(endpoint).length != 0, "invalid endpoint");

        address _dsp = msg.sender;

        if(bytes(registeredDSPs[_dsp].endpoint).length == 0) {
            dspList[totalDsps++] = _dsp;
        }

        registeredDSPs[_dsp].active = true;
        registeredDSPs[_dsp].endpoint = endpoint;
        
        emit DSPStatusChanged(_dsp, true, endpoint);
    }
    
    /**
     * @dev deprecate dsp
     */
    function deprecateDSP() public {
        address _dsp = msg.sender;

        if(bytes(registeredDSPs[_dsp].endpoint).length == 0) {
            dspList[totalDsps++] = _dsp;
        }

        registeredDSPs[_dsp].active = false;
        registeredDSPs[_dsp].endpoint = "deprecated";

        emit DSPStatusChanged(_dsp, false,"deprecated");
    }
    
    /**
     * @dev set docker image
     */
    function setDockerImage(
        string calldata imageName,
        uint jobFee,
        uint baseFee,
        uint storageFee,
        uint ioFee,
        uint minStorageMegaBytes,
        uint minIoMegaBytes
    ) external {
        require(bytes(approvedImages[imageName]).length != 0, "not approved");
        require(jobFee > 0, "job fee must be > 0");
        require(baseFee > 0, "base fee must be > 0");
        require(storageFee > 0, "storage fee must be > 0");
        require(ioFee > 0, "io fee must be > 0");
        require(minIoMegaBytes > 0, "min io must be > 0");

        address owner = msg.sender;

        // job related
        dspApprovedImages[owner][imageName].jobFee = jobFee;

        // service related
        dspApprovedImages[owner][imageName].baseFee = baseFee;
        dspApprovedImages[owner][imageName].storageFee = storageFee;
        dspApprovedImages[owner][imageName].ioFee = ioFee;
        dspApprovedImages[owner][imageName].minStorageMegaBytes = minStorageMegaBytes;
        dspApprovedImages[owner][imageName].minIoMegaBytes = minIoMegaBytes;
    }
    
    /**
     * @dev update docker image fees
     */
    function updateDockerImage(
        string calldata imageName,
        uint jobFee,
        uint baseFee,
        uint storageFee,
        uint ioFee,
        uint minStorageMegaBytes,
        uint minIoMegaBytes
    ) external {
        address owner = msg.sender;

        require(isImageApprovedForDSP(owner, imageName), "image not approved");
        require(
            jobFee > 0 && 
            baseFee > 0 && 
            storageFee > 0 && 
            ioFee > 0 && 
            minIoMegaBytes > 0
        , "invalid fee");

        bool diff = false;

        if(dspApprovedImages[owner][imageName].jobFee != jobFee) diff = true;
        if(dspApprovedImages[owner][imageName].baseFee != baseFee) diff = true;
        if(dspApprovedImages[owner][imageName].storageFee != storageFee) diff = true;
        if(dspApprovedImages[owner][imageName].ioFee != ioFee) diff = true;
        if(dspApprovedImages[owner][imageName].minStorageMegaBytes != minStorageMegaBytes) diff = true;
        if(dspApprovedImages[owner][imageName].minIoMegaBytes != minIoMegaBytes) diff = true;

        require(diff, "no diff");

        // job related
        dspApprovedImages[owner][imageName].jobFee = jobFee;

        // service related
        dspApprovedImages[owner][imageName].baseFee = baseFee;
        dspApprovedImages[owner][imageName].storageFee = storageFee;
        dspApprovedImages[owner][imageName].ioFee = ioFee;
        dspApprovedImages[owner][imageName].minStorageMegaBytes = minStorageMegaBytes;
        dspApprovedImages[owner][imageName].minIoMegaBytes = minIoMegaBytes;
    }
    
    /**
     * @dev returns approval status of image for dsp
     */
    function isImageApprovedForDSP(address _dsp, string calldata imageName) public view returns (bool) {
        return dspApprovedImages[_dsp][imageName].jobFee > 0;
    }
    
    /**
     * @dev unapprove docker image for dsp
     */
    function unapproveDockerForDSP(string calldata imageName) public  {
        address _dsp = msg.sender;

        delete dspApprovedImages[_dsp][imageName];

        emit DockerApprovalChanged(_dsp,imageName,false);
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

        require(founds > -1, "not found");
        require(!jd.done[uint(founds)], "completed");

        jd.done[uint(founds)] = true;
        jd.resultsCount++;
        jd.dataHash[uint(founds)] = dataHash;

        return inconsistent;
    }
    
    /**
     * @dev calculate fee
     */
    function calculatePaymentAmount(
        uint gas,
        string memory imageName,
        address dsp
    ) private view returns (uint) {
        uint jobDapps = calcJobDapps(imageName,dsp);
        uint gasWei = getFeedData();
        uint dappEth = getDappEth();
        
        gas += JOB_GAS_OVERHEAD;
        
        uint weiForGas = gasWei * gas;
        
        uint total = weiForGas * 1e9 * (PPB_BASE + s_config.paymentPremiumPPB) / dappEth;
        total /= 1e14;
        total += jobDapps;
        
        return total;
    }

    /**
     * @dev calculate job fee
     */
    function calcJobDapps(string memory imageName, address dsp) private view returns (uint) {
        return getDappUsd() * ( dspApprovedImages[dsp][imageName].jobFee / usdtPrecision );
    }

    /**
     * @dev calculate service fee
     */
    function calcServiceDapps(
        string memory imageName, 
        uint ioMegaBytes, 
        uint storageMegaBytes, 
        address dsp, 
        bool include_base
    ) private view returns (uint) {
        // base fee per hour * 24 hours * 30 days for monthly rate
        uint dappUsd = getDappUsd();

        uint baseFee = dspApprovedImages[dsp][imageName].baseFee;
        uint storageFee = dspApprovedImages[dsp][imageName].storageFee;
        uint ioFee = dspApprovedImages[dsp][imageName].ioFee;

        baseFee = include_base ? baseFee * 24 * 30 * dappUsd : 0;
        storageFee = storageFee * storageMegaBytes * dappUsd;
        ioFee = ioFee * ioMegaBytes * dappUsd;
        // ((100000 * 24 * 30) / 1e6) * 1249348) = 89,953,056 -> 4 dec adjusted -> 8,995.3056 DAPP ~ $72
        return ( baseFee + storageFee + ioFee ) / usdtPrecision;
    }

    /**
    * @notice use max of transaction gas price and adjusted price
    */
    function adjustGasPrice(uint256 gasWei, bool useTxGasPrice) private view returns (uint256 adjustedPrice) {
        adjustedPrice = gasWei * s_config.gasCeilingMultiplier;
        if (useTxGasPrice && tx.gasprice < adjustedPrice) {
            adjustedPrice = tx.gasprice;
        }
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
     * @dev require min io/storage met
     */
    function validateMin(
        uint ioMegaBytes, 
        uint storageMegaBytes, 
        string calldata imageName, 
        uint months, 
        address dsp
    ) private view {
        require(
            ioMegaBytes 
            >= 
            dspApprovedImages[dsp][imageName].minIoMegaBytes * months
            ,"min io"
        );
        require(
            storageMegaBytes 
            >= 
            dspApprovedImages[dsp][imageName].minStorageMegaBytes * months
            ,"min storage"
        );
    }

    /**
     * @dev require consumer be caller or owner
     */
    function validateConsumer(address consumer) private view {
        address authorized_contract = contracts[consumer];

        if(authorized_contract != address(0)){
            require(authorized_contract == msg.sender, "not auth");
        } else {
            require(consumer == msg.sender, "not sender");
        }
    }
    
    /**
     * @dev validates dsp is authorized for job or service
     */
    function validateDspCaller(address[] memory dsps, address dsp, bool error) private pure returns(int) {
        int founds = -1;
        
        for (uint i=0; i<dsps.length; i++) {
            if(dsps[i] == dsp){
                founds = int(i);
                break;
            }
        }

        if(error) {
            require(founds > -1, "not found");
        }
        
        return founds;
    }

    /**
     * @dev require all dsps be active
     */
    function validateActiveDsps(address[] memory dsps) private view {
        require(dsps.length > 0, "no dsps");
        for (uint i=0; i<dsps.length; i++) {
            require(registeredDSPs[dsps[i]].active, "not active");
        }
    }

    /**
     * @dev return bancor rate dapp eth
     */
    function getDappEth() private view returns (uint256) {
        address[] memory table = new address[](5);

        table[0] = dappToken;
        table[1] = dappBntToken;
        table[2] = bntToken;
        table[3] = ethBntToken;
        table[4] = ethToken;
        
        return bancorNetwork.rateByPath(table,10000); // how much 18,ETH for 1 4,DAPP
    }

    /**
     * @dev return bancor rate dapp usd
     */
    function getDappUsd() private view returns (uint256) {
        address[] memory table = new address[](5);

        table[0] = usdtToken;
        table[1] = usdtBntToken;
        table[2] = bntToken;
        table[3] = dappBntToken;
        table[4] = dappToken;
        
        return bancorNetwork.rateByPath(table,1000000); // how much 18,ETH for 1 6,USDT
    }

    /**
    * @dev retrieves feed data for fast gas/eth and link/eth prices. if the feed
    * data is stale it uses the configured fallback price. Once a price is picked
    * for gas it takes the min of gas price in the transaction or the fast gas
    * price in order to reduce costs for the upkeep clients.
    */
    function getFeedData() private view returns (uint) {
        uint32 stalenessSeconds = s_config.stalenessSeconds;
        bool staleFallback = stalenessSeconds > 0;
        uint256 timestamp;
        int256 feedValue; // = 99000000000 / 1e9 = 99 gwei

        (, feedValue, , timestamp, ) = FAST_GAS_FEED.latestRoundData();
        
        if ((staleFallback && stalenessSeconds < block.timestamp - timestamp) || feedValue <= 0) {
            revert('feed stale');
            // return s_fallbackGasPrice;
        } else {
            return uint256(feedValue);
        }
    }

    /**
    * @notice read the current configuration of the nexus
    */
    function getConfig()
        external
        view
        returns (
            uint32 paymentPremiumPPB,
            uint24 stalenessSeconds,
            uint16 gasCeilingMultiplier,
            uint256 fallbackGasPrice
        )
    {
        Config memory config = s_config;

        return (
            config.paymentPremiumPPB,
            config.stalenessSeconds,
            config.gasCeilingMultiplier,
            s_fallbackGasPrice
        );
    }
    
    /**
     * @dev return dsp addresses
     */
    function getDspAddresses() public view returns (address[] memory) {
        address[] memory addresses = new address[](totalDsps);

        for(uint i=0; i<totalDsps; i++) {
            addresses[i] = dspList[i];
        }

        return addresses;
    }
    
    /**
     * @dev returns port for dsp and job id
     */
    function getPortForDSP(uint jobID, address dsp) public view returns (uint) {        
        ServiceData storage sd = services[jobID];

        return sd.dspServiceData[dsp].port;
    }
    
    /**
     * @dev returns dsp endpoint
     */
    function getDSPEndpoint(address dsp) public view returns (string memory) {
        return registeredDSPs[dsp].endpoint;
    }
    
    /**
     * @dev returns dsp data limits
     */
    function getDSPDataLimits(uint id, address dsp) public view returns (DspLimits memory) {
        return DspLimits(
            services[id].dspServiceData[dsp].ioMegaBytesLimit,
            services[id].dspServiceData[dsp].storageMegaBytesLimit
        );
    }
    
    /**
     * @dev use DAPP gas, vroom
     */
    function useGas(
        address _consumer,
        uint _amountToUse,
        address _dsp
    ) internal {
        require(_amountToUse <= dspData[_consumer][_dsp].amount, "insuficient gas");

        dspData[_consumer][_dsp].amount -= _amountToUse;
        registeredDSPs[_dsp].claimableDapp += _amountToUse;

        emit UsedGas(_consumer, _dsp, _amountToUse);
    }
    
    /**
     * @dev compare strings by hash
     */
    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }
    
    /**
     * @dev convert address type to string
     */
    function toString(address account) internal pure returns(string memory) {
        return toString(abi.encodePacked(account));
    }
    
    /**
     * @dev converts uint to string
     */
    function toString(uint value) internal pure returns(string memory) {
        return toString(abi.encodePacked(value));
    }
    
    /**
     * @dev converts bytes32 value to string
     */
    function toString(bytes32 value) internal pure returns(string memory) {
        return toString(abi.encodePacked(value));
    }
    
    /**
     * @dev converts bytes value to string
     */
    function toString(bytes memory data) internal pure returns(string memory) {
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
}