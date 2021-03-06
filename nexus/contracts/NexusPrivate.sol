//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./SafeERC20Upgradeable.sol";
import "./ReentrancyGuardUpgradeable.sol";

import "./interfaces/IDappOracle.sol";

import "hardhat/console.sol";

contract NexusPrivate is OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    
    IERC20Upgradeable public token;
    IDappOracle public dappOracle;

    uint public usdtPrecision;

    address private usdtToken;
    address private usdtBntToken;

    uint256 private constant CUSHION = 5_000;
    uint256 private constant JOB_GAS_OVERHEAD = 80_000;
    uint256 private constant PPB_BASE = 1_000_000_000;

    event BoughtGas(
        address indexed buyer,
        address indexed consumer,
        address indexed worker,
        uint amount
    );

    event SoldGas(
        address indexed consumer,
        address indexed worker,
        uint amount
    );

    event ClaimedGas(
        address indexed worker,
        uint amount
    );

    event JobResult(
        address indexed consumer, 
        address indexed worker,
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
        address indexed worker,
        uint id,
        uint port
    );

    event ServiceExtended(
        address indexed consumer,
        address indexed worker,
        uint id,
        uint ioMegaBytes, 
        uint storageMegaBytes,
        uint endDate
    );

    event UsedGas(
        address indexed consumer,
        address indexed worker,
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

    event WORKERStatusChanged(
        address indexed worker,
        bool active,
        string endpoint
    );

    event DockerApprovalChanged(
        address indexed worker,
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
        address indexed worker, 
        string stdErr,
        string outputFS,
        uint id
    );
    
    event ServiceComplete(
        address indexed consumer, 
        address indexed worker, 
        string outputFS,
        uint id
    );
    
    event ConfigSet(
        uint32 paymentPremiumPPB,
        uint16 gasCeilingMultiplier,
        uint fallbackGasPrice
    );
    
    event UpdateWorkers(
        address consumer,
        address[] workers
    );

    struct PerConsumerWORKEREntry {
        uint amount;
        uint claimable;
    }

    struct RegisteredWORKER {
        bool active;
        string endpoint;
        uint claimableDapp;
    }

    struct JobData {
        address consumer;
        address owner;
        address[] workers;
        bool callback;
        uint resultsCount;
        string imageName;
        uint gasLimit;
        bool requireConsistent;
        mapping(uint => bool) done;
        mapping(uint => bytes32) dataHash;
    }

    struct WorkerServiceData {
        uint port;
        uint ioMegaBytesLimit;
        uint storageMegaBytesLimit;
    }

    struct ServiceData {
        address consumer;
        address owner;
        address[] workers;
        string imageName;
        bool started;
        uint endDate;
        uint months;
        uint ioMegaBytes;
        uint storageMegaBytes;
        mapping(address => WorkerServiceData) workerServiceData;
        mapping(address => bytes32) dataHash;
        mapping(uint => bool) done;
    }

    struct WorkerDockerImage {
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

    struct WorkerLimits {
        uint ioMegaBytesLimit;
        uint storageMegaBytesLimit;
    }

    struct Config {
        uint32 paymentPremiumPPB;
        uint16 gasCeilingMultiplier;
        uint fallbackGasPrice;
    }

    struct jobCallbackArgs {
        uint jobID;
        string outputFS;
        string outputHash;
    }

    struct initArgs {
        address _tokenContract;
        address _dappOracleContract;
        uint32 _paymentPremiumPPB;
        uint16 _gasCeilingMultiplier;
        uint256 _usdtPrecision;
        uint256 _fallbackGasPrice;
    }

    mapping(address => RegisteredWORKER) public registeredWORKERs;
    mapping(address => mapping(address => PerConsumerWORKEREntry)) public workerData;

    mapping(address => address[]) public providers;

    mapping(address => address) public contracts;
    
    mapping(uint => JobData) public jobs;
    mapping(uint => ServiceData) public services;

    mapping(string => string) public approvedImages;
    mapping(address => mapping(string => WorkerDockerImage)) public workerApprovedImages;

    uint public totalWorkers;
    uint public totalDappGasPaid;

    uint public lastJobID;

    mapping(uint => address) public workerList;

    Config private s_config;  

    function initialize(
        initArgs memory args
    ) external initializer {
        __Ownable_init();
        __ReentrancyGuard_init();
        token = IERC20Upgradeable(args._tokenContract);
        dappOracle = IDappOracle(args._dappOracleContract);
    
        usdtPrecision = args._usdtPrecision;

        setConfig(
            args._paymentPremiumPPB,
            args._gasCeilingMultiplier,
            args._fallbackGasPrice
        );
    }
      
    /**
    * @notice set the current configuration of the nexus
    */
    function setConfig(
        uint32 paymentPremiumPPB,
        uint16 gasCeilingMultiplier,
        uint fallbackGasPrice
    ) public onlyOwner {
        s_config = Config({
            paymentPremiumPPB: paymentPremiumPPB,
            gasCeilingMultiplier: gasCeilingMultiplier,
            fallbackGasPrice: fallbackGasPrice
        });


        emit ConfigSet(
            paymentPremiumPPB,
            gasCeilingMultiplier,
            fallbackGasPrice
        );
    }

    function jobServiceCompleted(uint id, address worker, bool isJob) external view returns (bool) {
        if(isJob) {
            JobData storage jd = jobs[id];
            address[] storage workers = providers[jd.owner];
            int founds = validateWorkerCaller(workers, worker, false);

            if(founds == -1) return false;
            
            return jd.done[uint(founds)];
        } else {
            ServiceData storage sd = services[id];
            address[] storage workers = providers[sd.owner];
            int founds = validateWorkerCaller(workers, worker, false);

            if(founds == -1) return false;

            return sd.done[uint(founds)];
        }
    }
    
    /**
     * @dev set workers
     */
    function setWorkers(address[] calldata workers) external {
        validateActiveWorkers(workers);

        providers[msg.sender] = workers;

        emit UpdateWorkers(
            msg.sender,
            workers
        );
    }
    
    /**
     * @dev set consumer contract
     */
    function setConsumerContract(address authorized_contract) external {
        require(contracts[msg.sender] != authorized_contract,"already authorized");
        contracts[msg.sender] = authorized_contract;
    }
    
    /**
     * @dev transfer DAPP to contract to process jobs
     */
    function buyGasFor(
        uint _amount,
        address _consumer,
        address _worker
    ) public nonReentrant {
        require(registeredWORKERs[_worker].active,"inactive");

        token.safeTransferFrom(msg.sender, address(this), _amount);
        
        workerData[_consumer][_worker].amount += _amount;
        
        emit BoughtGas(msg.sender, _consumer, _worker, _amount);
    }
    
    /**
     * @dev return DAPP
     */
    function sellGas(
        uint _amountToSell,
        address _worker
    ) public nonReentrant {
        address _consumer = msg.sender;

        require(!(_amountToSell > workerData[_consumer][_worker].amount),"overdrawn");
        
        workerData[_consumer][_worker].amount -= _amountToSell;

        token.safeTransfer(_consumer, _amountToSell);
        
        emit SoldGas(_consumer, _worker, _amountToSell);
    }
    
    /**
     * @dev allows worker to claim for consumer
     */
    function claim() external nonReentrant {
        uint claimableAmount = registeredWORKERs[msg.sender].claimableDapp;

        require(claimableAmount != 0,"req pos bal");
        
        token.safeTransfer(msg.sender, claimableAmount);
        
        emit ClaimedGas(msg.sender, claimableAmount);
    }

    /**
    * @notice calculates the minimum balance required for an upkeep to remain eligible
    */
    function getMinBalance(uint256 id, string memory jobType, address worker) external view returns (uint) {
        if(compareStrings(jobType, "job")) {
            return calculatePaymentAmount(jobs[id].gasLimit,jobs[id].imageName, worker);
        } else if(compareStrings(jobType, "service")) {
            return calcServiceDapps(
                services[id].imageName, 
                services[id].ioMegaBytes, 
                services[id].storageMegaBytes, 
                worker, 
                true
            );
        }
    }
    
    /**
     * @dev queue job
     */
    function queueJob(queueJobArgs calldata args) public {
        validateConsumer(msg.sender);

        address[] storage workers = providers[args.owner];
        require(workers.length > 0,"no workers");
        
        validateActiveWorkers(workers);

        lastJobID = lastJobID + 1;

        JobData storage jd = jobs[lastJobID];

        jd.callback = args.callback;
        jd.requireConsistent = args.requireConsistent;
        jd.consumer = msg.sender;
        jd.owner = args.owner;
        jd.imageName = args.imageName;
        jd.gasLimit = args.gasLimit;

        for(uint i=0;i<workers.length;i++) {
            require(isImageApprovedForWORKER(workers[i], args.imageName), "not approved");
            require(
                workerData[msg.sender][workers[i]].amount 
                >= 
                calculatePaymentAmount(jobs[lastJobID].gasLimit,jobs[lastJobID].imageName, workers[i])
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

        address[] storage workers = providers[args.owner];
        require(workers.length > 0,"no workers");

        validateActiveWorkers(workers);

        for(uint i=0;i<workers.length;i++) {
            require(isImageApprovedForWORKER(workers[i], args.imageName), "not approved");
            validateMin(
                args.ioMegaBytes, 
                args.storageMegaBytes, 
                args.imageName, 
                args.months, 
                workers[i]
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
     * @dev worker run job, determines data hash consistency and performs optional callback
     */
    function jobCallback(jobCallbackArgs calldata args) public {
        JobData storage jd = jobs[args.jobID];

        address[] storage workers = providers[jd.owner];
        require(workers.length > 0,"no workers");
        
        require(!jd.done[uint(validateWorkerCaller(workers,msg.sender,true))], "completed");

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

        if(jd.callback){
            gasUsed = gasleft();
            callWithExactGas(jd.gasLimit, jd.consumer, abi.encodeWithSignature(
                "_workercallback(string,string)",
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
     * @dev worker run service
     */
    // add check for not conflicting with WORKER frontend default ports
    function serviceCallback(uint serviceId, uint port) public {
        require(port != 8888,"overlap");

        ServiceData storage sd = services[serviceId];

        address[] storage workers = providers[sd.owner];
        require(workers.length > 0,"no workers");

        validateWorkerCaller(workers,msg.sender,true);

        require(sd.started == false, "started");

        sd.started = true;
        sd.endDate = block.timestamp + ( sd.months * 30 days );
        
        address _consumer = sd.consumer;

        sd.workerServiceData[msg.sender].port = port;
        sd.workerServiceData[msg.sender].ioMegaBytesLimit += sd.ioMegaBytes;
        sd.workerServiceData[msg.sender].storageMegaBytesLimit += sd.storageMegaBytes;
        
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

        address[] storage workers = providers[jd.owner];
        require(workers.length > 0,"no workers");

        uint founds = uint(validateWorkerCaller(workers,msg.sender,true));

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

        address[] storage workers = providers[sd.owner];
        require(workers.length > 0,"no workers");
        
        uint founds = uint(validateWorkerCaller(workers,msg.sender,true));

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

        address[] storage workers = providers[sd.owner];
        require(workers.length > 0,"no workers");
        
        uint founds = uint(validateWorkerCaller(workers,msg.sender,true));

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

        address[] storage workers = providers[msg.sender];
        require(workers.length > 0,"no workers");

        // require service not completed
        // if service completed by worker, do not charge

        for(uint i=0;i<workers.length;i++) {
            bool include_base = months == 0 ? false : true;
            
            uint dapps = calcServiceDapps(
                imageName,
                ioMb,
                storageMb,
                workers[i],
                include_base
            );

            if(include_base) {
                dapps *= months;
                validateMin(ioMb, storageMb, imageName, months, workers[i]);
                sd.endDate = sd.endDate + ( months * 30 days );
            }

            buyGasFor(
                dapps,
                msg.sender,
                workers[i]
            );

            sd.workerServiceData[workers[i]].ioMegaBytesLimit += ioMb;
            sd.workerServiceData[workers[i]].storageMegaBytesLimit += storageMb;

            emit ServiceExtended(
                msg.sender, 
                workers[i], 
                serviceId, 
                sd.workerServiceData[workers[i]].ioMegaBytesLimit, 
                sd.workerServiceData[workers[i]].storageMegaBytesLimit, 
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
        address worker
    ) external view returns (uint256 maxPayment) {
        return calculatePaymentAmount(gasLimit, imageName, worker);
    }
    
    /**
     * @dev gov approve image
     */
    function approveImage(string calldata imageName, string calldata imageHash) external onlyOwner {
        require(bytes(imageHash).length != 0, "invalid hash");

        approvedImages[imageName] = imageHash;
    }
    
    /**
     * @dev gov unapprove image
     */
    function unapproveImage(string calldata imageName, string calldata imageHash) external onlyOwner {
        require(bytes(imageHash).length != 0, "invalid hash");

        delete approvedImages[imageName];
    }
    
    /**
     * @dev active and set endpoint for worker
     */
    function regWORKER(string calldata endpoint) public {
        require(bytes(endpoint).length != 0, "invalid endpoint");

        address _worker = msg.sender;

        if(bytes(registeredWORKERs[_worker].endpoint).length == 0) {
            workerList[totalWorkers++] = _worker;
        }

        registeredWORKERs[_worker].active = true;
        registeredWORKERs[_worker].endpoint = endpoint;
        
        emit WORKERStatusChanged(_worker, true, endpoint);
    }
    
    /**
     * @dev deprecate worker
     */
    function deprecateWORKER() public {
        address _worker = msg.sender;

        if(bytes(registeredWORKERs[_worker].endpoint).length == 0) {
            workerList[totalWorkers++] = _worker;
        }

        registeredWORKERs[_worker].active = false;
        registeredWORKERs[_worker].endpoint = "deprecated";

        emit WORKERStatusChanged(_worker, false,"deprecated");
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
    ) public {
        address owner = msg.sender;

        require(bytes(approvedImages[imageName]).length != 0, "image not approved");
        require(
            jobFee > 0 && 
            baseFee > 0 && 
            storageFee > 0 && 
            ioFee > 0 && 
            minIoMegaBytes > 0
        , "invalid fee");

        // job related
        workerApprovedImages[owner][imageName].jobFee = jobFee;

        // service related
        workerApprovedImages[owner][imageName].baseFee = baseFee;
        workerApprovedImages[owner][imageName].storageFee = storageFee;
        workerApprovedImages[owner][imageName].ioFee = ioFee;
        workerApprovedImages[owner][imageName].minStorageMegaBytes = minStorageMegaBytes;
        workerApprovedImages[owner][imageName].minIoMegaBytes = minIoMegaBytes;
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
        bool diff = false;

        if(workerApprovedImages[msg.sender][imageName].jobFee != jobFee) diff = true;
        if(workerApprovedImages[msg.sender][imageName].baseFee != baseFee) diff = true;
        if(workerApprovedImages[msg.sender][imageName].storageFee != storageFee) diff = true;
        if(workerApprovedImages[msg.sender][imageName].ioFee != ioFee) diff = true;
        if(workerApprovedImages[msg.sender][imageName].minStorageMegaBytes != minStorageMegaBytes) diff = true;
        if(workerApprovedImages[msg.sender][imageName].minIoMegaBytes != minIoMegaBytes) diff = true;

        require(diff, "no diff");

        setDockerImage(
            imageName,
            jobFee,
            baseFee,
            storageFee,
            ioFee,
            minStorageMegaBytes,
            minIoMegaBytes
        );
    }
    
    /**
     * @dev returns approval status of image for worker
     */
    function isImageApprovedForWORKER(address worker, string calldata imageName) public view returns (bool) {
        return workerApprovedImages[worker][imageName].jobFee > 0;
    }
    
    /**
     * @dev unapprove docker image for worker
     */
    function unapproveDockerForWORKER(string calldata imageName) public  {
        address _worker = msg.sender;

        delete workerApprovedImages[_worker][imageName];

        emit DockerApprovalChanged(_worker,imageName,false);
    }
    
    /**
     * @dev ensures returned data hash is universally accepted
     */
    function submitResEntry(uint jobID,bytes32 dataHash, address[] memory workers) private returns (bool) {
        JobData storage jd = jobs[jobID];
        address _worker = msg.sender;
        int founds = -1;
        bool inconsistent = false;

        for (uint i=0; i<workers.length; i++) {
            if(jd.done[i]){
                if(jd.dataHash[i] != dataHash){
                    inconsistent = true;
                }
            }
            if(workers[i] == _worker){
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
        address worker
    ) private view returns (uint) {
        uint jobDapps = calcJobDapps(imageName,worker);
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
    function calcJobDapps(string memory imageName, address worker) private view returns (uint) {
        return getDappUsd() * ( workerApprovedImages[worker][imageName].jobFee / usdtPrecision );
    }

    /**
     * @dev calculate service fee
     */
    function calcServiceDapps(
        string memory imageName, 
        uint ioMegaBytes, 
        uint storageMegaBytes, 
        address worker, 
        bool include_base
    ) public view returns (uint) {
        // base fee per hour * 24 hours * 30 days for monthly rate
        uint dappUsd = getDappUsd();

        uint baseFee = workerApprovedImages[worker][imageName].baseFee;
        uint storageFee = workerApprovedImages[worker][imageName].storageFee;
        uint ioFee = workerApprovedImages[worker][imageName].ioFee;

        baseFee = include_base ? baseFee * 24 * 30 * dappUsd : 0;
        storageFee = storageFee * storageMegaBytes * dappUsd;
        ioFee = ioFee * ioMegaBytes * dappUsd;
        // ((100000 * 24 * 30) / 1e6) * 1249348) = 89,953,056 -> 4 dec adjusted -> 8,995.3056 DAPP ~ $72
        return ( baseFee + storageFee + ioFee ) / usdtPrecision;
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
        address worker
    ) public view {
        require(
            ioMegaBytes 
            >= 
            workerApprovedImages[worker][imageName].minIoMegaBytes * months
            ,"min io"
        );
        require(
            storageMegaBytes 
            >= 
            workerApprovedImages[worker][imageName].minStorageMegaBytes * months
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
     * @dev validates worker is authorized for job or service
     */
    function validateWorkerCaller(address[] memory workers, address worker, bool error) private pure returns(int) {
        int founds = -1;
        
        for (uint i=0; i<workers.length; i++) {
            if(workers[i] == worker){
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
     * @dev require all workers be active
     */
    function validateActiveWorkers(address[] memory workers) public view {
        require(workers.length > 0, "no workers");
        for (uint i=0; i<workers.length; i++) {
            require(registeredWORKERs[workers[i]].active, "not active");
        }
    }

    /**
     * @dev return oracle rate dapp eth
     */
    function getDappEth() private view returns (uint256) {
        return dappOracle.lastDappEthPrice();
    }

    /**
     * @dev return oracle rate dapp usd
     */
    function getDappUsd() private view returns (uint256) {
        return dappOracle.lastDappUsdPrice();
    }

    /**
    * @dev retrieves feed data for fast gas/eth and link/eth prices. if the feed
    * data is stale it uses the configured fallback price. Once a price is picked
    * for gas it takes the min of gas price in the transaction or the fast gas
    * price in order to reduce costs for the upkeep clients.
    */
    function getFeedData() private view returns (uint) {
        Config memory config = s_config;
        return config.fallbackGasPrice;
    }

    /**
    * @notice read the current configuration of the nexus
    */
    function getConfig()
        external
        view
        returns (
            uint32 paymentPremiumPPB,
            uint16 gasCeilingMultiplier,
            uint fallbackGasPrice
        )
    {
        Config memory config = s_config;

        return (
            config.paymentPremiumPPB,
            config.gasCeilingMultiplier,
            config.fallbackGasPrice
        );
    }
    
    /**
     * @dev return worker addresses
     */
    function getWorkerAddresses() public view returns (address[] memory) {
        address[] memory addresses = new address[](totalWorkers);

        for(uint i=0; i<totalWorkers; i++) {
            addresses[i] = workerList[i];
        }

        return addresses;
    }
    
    /**
     * @dev returns port for worker and job id
     */
    function getPortForWORKER(uint jobID, address worker) public view returns (uint) {        
        ServiceData storage sd = services[jobID];

        return sd.workerServiceData[worker].port;
    }
    
    /**
     * @dev returns worker endpoint
     */
    function getWORKEREndpoint(address worker) public view returns (string memory) {
        return registeredWORKERs[worker].endpoint;
    }
    
    /**
     * @dev returns worker data limits
     */
    function getWORKERDataLimits(uint id, address worker) public view returns (WorkerLimits memory) {
        return WorkerLimits(
            services[id].workerServiceData[worker].ioMegaBytesLimit,
            services[id].workerServiceData[worker].storageMegaBytesLimit
        );
    }
    
    /**
     * @dev returns worker amount
     */
    function getWORKERAmount(address account, address worker) external view returns (uint) {
        return workerData[account][worker].amount;
    }
    
    /**
     * @dev use DAPP gas, vroom
     */
    function useGas(
        address _consumer,
        uint _amountToUse,
        address _worker
    ) internal {
        require(_amountToUse <= workerData[_consumer][_worker].amount, "insuficient gas");

        workerData[_consumer][_worker].amount -= _amountToUse;
        registeredWORKERs[_worker].claimableDapp += _amountToUse;

        totalDappGasPaid += _amountToUse;

        emit UsedGas(_consumer, _worker, _amountToUse);
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