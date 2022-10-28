//SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.0;
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./SafeERC20Upgradeable.sol";

import "@openzeppelin/contracts/utils/Strings.sol";

import "./interfaces/IDappOraclePolygon.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// import "hardhat/console.sol";

contract NexusPolygon is OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    
    IERC20Upgradeable public token;
    IDappOraclePolygon public dappOracle;
    
    AggregatorV3Interface internal constant FAST_GAS_FEED = AggregatorV3Interface(0xf824eA79774E8698E6C6D156c60ab054794C9B18);

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
        uint id
    );

    event ServiceExtended(
        address indexed consumer,
        address indexed worker,
        uint id,
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
        uint fallbackGasPrice,
        uint24 stalenessSeconds
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

    struct ServiceData {
        address consumer;
        address owner;
        address[] workers;
        string imageName;
        bool started;
        uint endDate;
        uint months;
        mapping(address => bytes32) dataHash;
        mapping(uint => bool) done;
    }

    struct WorkerDockerImage {
        uint jobFee;
        uint baseFee;
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
        string inputFS;
        string[] args;
        uint months;
    }

    struct serviceErrorArgs {
        uint jobID;
        string stdErr;
        string outputFS;
    }

    struct serviceCompleteArgs {
        uint jobID;
        string outputFS;
    }

    struct Config {
        uint32 paymentPremiumPPB;
        uint24 stalenessSeconds;
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
        uint256 _usdtPrecision;
        uint256 _fallbackGasPrice;
        uint24 _stalenessSeconds;
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
    uint256 private s_fallbackGasPrice; // not in config object for gas savings

    function initialize(
        initArgs memory args
    ) external initializer {
        __Ownable_init();
        token = IERC20Upgradeable(args._tokenContract);
        dappOracle = IDappOraclePolygon(args._dappOracleContract);
    
        usdtPrecision = args._usdtPrecision;

        setConfig(
            args._paymentPremiumPPB,
            args._fallbackGasPrice,
            args._stalenessSeconds
        );
    }
      
    /**
    * @notice set the current configuration of the nexus
    */
    function setConfig(
        uint32 paymentPremiumPPB,
        uint256 fallbackGasPrice,
        uint24 stalenessSeconds
    ) public onlyOwner {
        s_config = Config({
            paymentPremiumPPB: paymentPremiumPPB,
            stalenessSeconds: stalenessSeconds
        });

        s_fallbackGasPrice = fallbackGasPrice;

        emit ConfigSet(
            paymentPremiumPPB,
            fallbackGasPrice,
            stalenessSeconds
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
    ) public {
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
    ) external {
        address _consumer = msg.sender;

        require(!(_amountToSell > workerData[_consumer][_worker].amount),"overdrawn");
        
        workerData[_consumer][_worker].amount -= _amountToSell;

        token.safeTransfer(_consumer, _amountToSell);
        
        emit SoldGas(_consumer, _worker, _amountToSell);
    }
    
    /**
     * @dev allows worker to claim for consumer
     */
    function claim() external {
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
                worker
            );
        }
    }
    
    /**
     * @dev queue job
     */
    function queueJob(queueJobArgs calldata args) external {
        
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
    function queueService(queueServiceArgs calldata args) external {
        validateConsumer(msg.sender);

        address[] storage workers = providers[args.owner];
        require(workers.length > 0,"no workers");

        validateActiveWorkers(workers);

        for(uint i=0;i<workers.length;i++) {
            require(isImageApprovedForWORKER(workers[i], args.imageName), "not approved");
        }

        lastJobID = lastJobID + 1;

        ServiceData storage sd = services[lastJobID];

        sd.consumer = msg.sender;
        sd.owner = args.owner;
        sd.imageName = args.imageName;
        sd.months = args.months;

        emit QueueService(
            msg.sender,
            args.owner,
            args.imageName,
            lastJobID,
            args.inputFS,
            args.args
        );
    }
    
    /**
     * @dev worker run job, determines data hash consistency and performs optional callback
     */
    function jobCallback(jobCallbackArgs calldata args) external {
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
    function serviceCallback(uint serviceId) external {
        ServiceData storage sd = services[serviceId];

        address[] storage workers = providers[sd.owner];
        require(workers.length > 0,"no workers");

        validateWorkerCaller(workers,msg.sender,true);

        require(sd.started == false, "started");

        sd.started = true;
        sd.endDate = block.timestamp + ( sd.months * 30 days );
        
        address _consumer = sd.consumer;
        
        uint dapps = calcServiceDapps(
            sd.imageName,
            msg.sender
        );

        useGas(
            _consumer,
            dapps,
            msg.sender
        );

        emit ServiceRunning(
            _consumer, 
            msg.sender, 
            serviceId
        );
    }
    
    /**
     * @dev handle job error
     */
    function jobError(
        uint jobID,
        string calldata  stdErr,
        string calldata outputFS
    ) external {
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
    function serviceError(serviceErrorArgs calldata args) external {
        ServiceData storage sd = services[args.jobID];

        address[] storage workers = providers[sd.owner];
        require(workers.length > 0,"no workers");
        
        uint founds = uint(validateWorkerCaller(workers,msg.sender,true));

        require(!sd.done[founds], "completed");
        
        uint dapps = calcServiceDapps(
            sd.imageName,
            msg.sender
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
    function serviceComplete(serviceCompleteArgs calldata args) external {
        ServiceData storage sd = services[args.jobID];

        require(sd.started == true, "not started");
        require(sd.endDate < block.timestamp, "time remaining");

        address[] storage workers = providers[sd.owner];
        require(workers.length > 0,"no workers");
        
        uint founds = uint(validateWorkerCaller(workers,msg.sender,true));

        require(!sd.done[founds], "completed");
        
        uint dapps = calcServiceDapps(
            sd.imageName,
            msg.sender
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
        uint months
    ) external {
        validateConsumer(msg.sender);
        
        ServiceData storage sd = services[serviceId];

        require(compareStrings(imageName, sd.imageName),"missmatch");
        require(sd.endDate > block.timestamp, "no time remaining");
        require(months > 0, "months > 0");

        address[] storage workers = providers[msg.sender];
        require(workers.length > 0,"no workers");

        for(uint i=0;i<workers.length;i++) {
            uint dapps = calcServiceDapps(
                imageName,
                workers[i]
            );

            dapps *= months;
            sd.endDate = sd.endDate + ( months * 30 days );

            buyGasFor(
                dapps,
                msg.sender,
                workers[i]
            );

            emit ServiceExtended(
                msg.sender, 
                workers[i], 
                serviceId, 
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
    function regWORKER(string calldata endpoint) external {
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
    function deprecateWORKER() external {
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
        uint baseFee
    ) public {
        address owner = msg.sender;

        require(bytes(approvedImages[imageName]).length != 0, "image not approved");
        require(
            jobFee > 0 && 
            baseFee > 0
        , "invalid fee");

        // job related
        workerApprovedImages[owner][imageName].jobFee = jobFee;

        // service related
        workerApprovedImages[owner][imageName].baseFee = baseFee;
    }
    
    /**
     * @dev update docker image fees
     */
    function updateDockerImage(
        string calldata imageName,
        uint jobFee,
        uint baseFee
    ) external {
        bool diff = false;

        if(workerApprovedImages[msg.sender][imageName].jobFee != jobFee) diff = true;
        if(workerApprovedImages[msg.sender][imageName].baseFee != baseFee) diff = true;

        require(diff, "no diff");

        setDockerImage(
            imageName,
            jobFee,
            baseFee
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
    function unapproveDockerForWORKER(string calldata imageName) external  {
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
        uint weiForGas = getFeedData() * (gas + JOB_GAS_OVERHEAD);
        uint premium = PPB_BASE + s_config.paymentPremiumPPB;
        uint total = (weiForGas * 1e9 * premium) / getDappMatic();
        total = total / 1e14;
        return total + calcJobDapps(imageName,worker);
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
            return s_fallbackGasPrice; // 200 gwei
        } else {
            return uint256(feedValue);
        }
    }

    /**
     * @dev calculate job fee for job, gas fee added onto job fee e.g. 100000 = $0.1 per job
     */
    function calcJobDapps(string memory imageName, address worker) private view returns (uint) {
        return ( getUsdDapp() * workerApprovedImages[worker][imageName].jobFee ) / usdtPrecision;
    }

    /**
     * @dev calculate service fee, hourly rate, e.g. 100000 = $0.1 per hour for service
     */
    function calcServiceDapps(
        string memory imageName, 
        address worker
    ) public view returns (uint) {
        uint dappUsd = getUsdDapp();

        uint baseFee = workerApprovedImages[worker][imageName].baseFee;
        
        return ( baseFee * 24 * 30 * dappUsd ) / usdtPrecision;
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
     * @dev return oracle rate of how much ETH per DAPP
     */
    function getDappMatic() private view returns (uint) {
        return dappOracle.lastDappMaticPrice();
    }

    /**
     * @dev return oracle rate dapp usd
     */
    function getUsdDapp() private view returns (uint256) {
        return dappOracle.lastUsdDappPrice();
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
            uint256 fallbackGasPrice
        )
    {
        Config memory config = s_config;

        return (
            config.paymentPremiumPPB,
            config.stalenessSeconds,
            s_fallbackGasPrice
        );
    }
    
    /**
     * @dev return worker addresses
     */
    function getWorkerAddresses() external view returns (address[] memory) {
        address[] memory addresses = new address[](totalWorkers);

        for(uint i=0; i<totalWorkers; i++) {
            addresses[i] = workerList[i];
        }

        return addresses;
    }
    
    /**
     * @dev returns worker endpoint
     */
    function getWORKEREndpoint(address worker) external view returns (string memory) {
        return registeredWORKERs[worker].endpoint;
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