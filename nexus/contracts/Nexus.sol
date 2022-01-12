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
    uint public usdtPrecision = 1e6;
    
    IERC20 public token;
    IBancorNetwork public bancorNetwork;
    AggregatorV3Interface public immutable FAST_GAS_FEED;

    address dappToken = 0x939B462ee3311f8926c047D2B576C389092b1649;
    address dappBntToken = 0x33A23d447De16a8Ff802c9Fcc917465Df01A3977;
    address bntToken = 0x1F573D6Fb3F13d689FF844B4cE37794d79a7FF1C;
    address ethBntToken = 0xb1CD6e4153B2a390Cf00A6556b0fC1458C4A5533;
    address ethToken = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    address usdtToken = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address usdtBntToken = 0x5365B5BC56493F08A38E5Eb08E36cBbe6fcC8306;

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

    event RunJob(
        address indexed consumer,
        string imageName,
        string inputFS,
        bool callback,
        bool requireConsistent,
        string[] args,
        uint id
    );

    event RunService(
        address indexed consumer,
        string imageName,
        string inputFS,
        uint ioMegaBytes,
        uint storageMegaBytes,
        string[] args,
        uint id,
        uint months
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
    
    event ConfigSet(
        uint32 paymentPremiumPPB,
        uint16 gasCeilingMultiplier,
        uint fallbackGasPrice,
        uint24 stalenessSeconds
    );
    
    event UpdateJob(
        address consumer,
        uint id,
        address[] dsps
    );
    
    event UpdateService(
        address consumer,
        uint id,
        address[] dsps
    );

    struct PerConsumerDSPEntry {
        uint amount;
        uint claimable;
    }

    struct RegisteredDSP {
        bool active;
        bool registered;
        mapping(string => bool) approvedImages;
        string endpoint;
        uint claimableDapp;
    }

    struct JobData {
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
        address owner;
        address[] dsps;
        string imageName;
        uint lastCalled;
        uint endDate;
        uint months;
        uint ioMegaBytes;
        uint storageMegaBytes;
        mapping(address => DspServiceData) dspServiceData;
        mapping(address => bytes32) dataHash;
    }

    struct JobDockerImage {
        address owner;
        string image;
        string imageHash;
        uint jobFee;
        bool setup;
    }

    struct ServiceDockerImage {
        address owner;
        string image;
        string imageHash;
        uint baseFee;
        uint storageFee;
        uint ioFee;
        uint minStorageMegaBytes;
        uint minIoMegaBytes;
        bool setup;
    }

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

    struct DspLimits {
        uint ioMegaBytesLimit;
        uint storageMegaBytesLimit;
    }

    struct Config {
        uint32 paymentPremiumPPB;
        uint16 gasCeilingMultiplier;
        uint24 stalenessSeconds;
    }

    mapping(address => RegisteredDSP) public registeredDSPs;
    mapping(address => mapping(address => PerConsumerDSPEntry)) public dspData;
    mapping(address => address[]) public consumerData;
    mapping(uint => JobData) public jobs;
    mapping(uint => ServiceData) public services;
    mapping(address => mapping(string => JobDockerImage)) public jobDockerImages;
    mapping(address => mapping(string => ServiceDockerImage)) public serviceDockerImages;

    uint public lastJobID;

    mapping(uint => address) private dspList;

    uint private totalDsps;

    Config private s_config;  
    uint256 private s_fallbackGasPrice; // not in config object for gas savings

    constructor (
        // string memory manifest,
        address _tokenContract,
        address _bancorNetwork,
        address _fastGasFeed,
        uint32 _paymentPremiumPPB,
        uint24 _stalenessSeconds,
        uint256 _fallbackGasPrice,
        uint16 _gasCeilingMultiplier
    ) {
        token = IERC20(_tokenContract);
        bancorNetwork = IBancorNetwork(_bancorNetwork);
        FAST_GAS_FEED = AggregatorV3Interface(_fastGasFeed);

        setConfig(
            _paymentPremiumPPB,
            _gasCeilingMultiplier,
            _fallbackGasPrice,
            _stalenessSeconds
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
    
    /**
     * @dev set dsps for job or service
     */
    function setDsps(uint id, address[] calldata dsps, bool isJob, string calldata imageName) external {
        validateOwner(msg.sender);
        validateDsps(dsps);

        if(isJob) {
            JobData storage jd = jobs[id];

            require(jd.owner != address(0),"invalid job");
            require(compareStrings(imageName, jd.imageName),"image missmatch");

            for(uint i=0;i<dsps.length;i++) {
                require(
                    dspData[msg.sender][dsps[i]].amount 
                    >= 
                    calculatePaymentAmount(jobs[id].gasLimit,jobs[id].imageName, dsps[i])
                    ,"min balance not met"
                );
            }

            jd.dsps = dsps;

            emit UpdateJob(
                msg.sender,
                id,
                dsps
            );
        } else {
            ServiceData storage sd = services[id];

            require(sd.owner != address(0),"invalid service");
            require(compareStrings(imageName, sd.imageName),"image missmatch");
            
            sd.dsps = dsps;

            for(uint i=0;i<dsps.length;i++) {
                validateMin(
                    sd.ioMegaBytes, 
                    sd.storageMegaBytes, 
                    imageName, 
                    sd.months, 
                    sd.dsps[i]
                );
            }

            emit UpdateService(
                msg.sender,
                id,
                dsps
            );
        }
    }
    
    /**
     * @dev create consumer data entry
     */
    function setConsumerPermissions(address[] calldata owners) public {
        consumerData[msg.sender] = owners;
    }

    /**
     * @dev extend service duration
     */
    function extendService(
        uint serviceId, 
        string calldata imageName, 
        uint months, 
        uint ioMb, 
        uint storageMb, 
        address[] calldata dsps
    ) external {
        validateOwner(msg.sender);
        
        ServiceData storage sd = services[serviceId];

        require(compareStrings(imageName, sd.imageName),"image missmatch");

        for(uint i=0;i<dsps.length;i++) {
            bool include_base = months == 0 ? false : true;
            
            uint dapps = calcServiceDapps(imageName, ioMb, storageMb, dsps[i], include_base);

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
    function claim() external {
        uint claimableAmount = registeredDSPs[msg.sender].claimableDapp;
        require(claimableAmount != 0,"must have positive balance to claim");
        token.safeTransfer(msg.sender, claimableAmount);
        emit ClaimedGas(msg.sender, claimableAmount);
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
     * @dev determines data hash consistency and performs optional callback
     */
    function jobCallback(uint jobID, string calldata outputFS) public {
        
        bytes32 dataHash = keccak256(abi.encodePacked(outputFS));

        JobData storage jd = jobs[jobID];
        
        // maybe throw if user doesn't want to accept inconsistency
        bool inconsistent = submitResEntry(jobID, dataHash, jd.dsps);
        bool success;

        if(jd.requireConsistent) {
            require(inconsistent,"inconsistent response");
        }
        
        uint gasUsed;
        if(jd.callback){
            gasUsed = gasleft();
            success = callWithExactGas(jd.gasLimit, jd.owner, abi.encodeWithSignature(
                "_dspcallback(uint256,string)",
                jobID,
                outputFS
            ));
            gasUsed = gasUsed - gasleft();
        }

        // calc gas usage and deduct from quota as DAPPs (using Bancor) or as eth
        uint dapps = calculatePaymentAmount(gasUsed,jd.imageName,msg.sender);

        useGas(
            jd.owner,
            dapps,
            msg.sender
        );

        emit JobResult(jd.owner, msg.sender, outputFS, dapps, jobID);

        if(jd.dsps.length != jd.resultsCount){
            return;
        }

        emit JobDone(jd.owner, outputFS,inconsistent, jobID);
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
        uint gasWei = getFeedData(); // 99000000000 fast gas price of 1 gas in wei
        uint dappEth = getDappEth(); // how much 18,ETH for 1 4,DAPP
        // 99000000000 * 80000 = 7.92E15 ((7.92E15/1e18)*$3,980) = $31.52 for gas for base * 20% fee
        // 5,051.2821 DAPP for $39.40
        gas += JOB_GAS_OVERHEAD;
        uint weiForGas = gasWei * gas; 
        // 7.92E15 * 1e9 = 7.92E24
        // 7.92E24 * 1,200,000,000 = 9.504E33
        // 9.504E33 / 1989696218183 = 4.776608566E21
        // add 0
        // 4.776608566E21 + 0 = 4.776608566E21
        uint total = weiForGas * 1e9 * (PPB_BASE + s_config.paymentPremiumPPB) / dappEth;
        total /= 1e14;
        total += jobDapps;
        // require(total <= LINK_TOTAL_SUPPLY, "payment greater than all LINK");
        return total;
    }

    /**
     * @dev calculate job fee
     */
    function calcJobDapps(string memory imageName, address dsp) private view returns (uint) {
        return getDappUsd() * ( jobDockerImages[dsp][imageName].jobFee / usdtPrecision );
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

        uint baseFee = serviceDockerImages[dsp][imageName].baseFee;
        uint storageFee = serviceDockerImages[dsp][imageName].storageFee;
        uint ioFee = serviceDockerImages[dsp][imageName].ioFee;

        baseFee = include_base ? baseFee * 24 * 30 * dappUsd : 0;
        storageFee = storageFee * storageMegaBytes * dappUsd;
        ioFee = ioFee * ioMegaBytes * dappUsd;
        // ((100000 * 24 * 30) / 1e6) * 1249348) = 89,953,056 -> 4 dec adjusted -> 8,995.3056 DAPP ~ $72
        return ( baseFee + storageFee + ioFee ) / usdtPrecision;
    }

    /**
    * @notice calculates the minimum balance required for an upkeep to remain eligible
    */
    function getMinBalance(uint256 id, string memory jobType, address dsp) external view returns (uint) {
        if(compareStrings(jobType, "job")) {
            return calculatePaymentAmount(jobs[id].gasLimit,jobs[id].imageName, dsp);
        }
        else if(compareStrings(jobType, "service")) {
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
     * @dev run service
     */
    // add check for not conflicting with DSP frontend default ports
    function serviceCallback(uint serviceId, uint port) public {
        require(port != 8888,"dsp portal port overlap");

        ServiceData storage sd = services[serviceId];

        validateDsp(sd.dsps);

        if(sd.lastCalled == 0) {
            sd.lastCalled = block.timestamp;
            sd.endDate = block.timestamp + ( sd.months * 30 days );
        } else {
            require(sd.lastCalled > block.timestamp + 30 days,"called within 30 days");
            sd.lastCalled = block.timestamp;
        }
        
        address _consumer = sd.owner;

        sd.dspServiceData[msg.sender].port = port;
        sd.dspServiceData[msg.sender].ioMegaBytesLimit += sd.ioMegaBytes;
        sd.dspServiceData[msg.sender].storageMegaBytesLimit += sd.storageMegaBytes;
        
        uint dapps = calcServiceDapps(sd.imageName, sd.ioMegaBytes, sd.storageMegaBytes, msg.sender, true);

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
    function jobError(uint jobID, string calldata  stdErr, string calldata outputFS) public {
        JobData storage jd = jobs[lastJobID];
        address _dsp = msg.sender;
        int founds = -1;
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
     * @dev run job or service
     */
    function runJob(runJobArgs calldata args) public {
        validateOwner(args.consumer);
        validateDsps(args.dsps);

        lastJobID = lastJobID + 1;

        JobData storage jd = jobs[lastJobID];

        jd.callback = args.callback;
        jd.requireConsistent = args.requireConsistent;
        jd.owner = args.consumer;
        jd.imageName = args.imageName;
        jd.gasLimit = args.gasLimit;
        jd.dsps = args.dsps;

        for(uint i=0;i<args.dsps.length;i++) {
            require(
                dspData[args.consumer][args.dsps[i]].amount 
                >= 
                calculatePaymentAmount(jobs[lastJobID].gasLimit,jobs[lastJobID].imageName, args.dsps[i])
                ,"min balance not met"
            );
            console.log(args.dsps[i]);
        }
        
        emit RunJob(
            args.consumer,
            args.imageName,
            args.inputFS,
            args.callback,
            args.requireConsistent,
            args.args,
            lastJobID
        );
    }
    
    /**
     * @dev run job or service
     */
    function runService(runServiceArgs calldata args) public {
        validateOwner(args.consumer);
        validateDsps(args.dsps);

        for(uint i=0;i<args.dsps.length;i++) {
            validateMin(
                args.ioMegaBytes, 
                args.storageMegaBytes, 
                args.imageName, 
                args.months, 
                args.dsps[i]
            );
        }

        lastJobID = lastJobID + 1;

        ServiceData storage sd = services[lastJobID];

        sd.owner = args.consumer;
        sd.imageName = args.imageName;
        sd.ioMegaBytes = args.ioMegaBytes;
        sd.storageMegaBytes = args.storageMegaBytes;
        sd.months = args.months;
        sd.dsps = args.dsps;
        
        console.log(args.consumer);
        console.log(args.imageName);
        console.log(args.inputFS);
        console.log(args.ioMegaBytes);
        console.log(args.storageMegaBytes);
        //console.log(args.args);
        console.log(lastJobID);
        console.log(args.months);

        emit RunService(
            args.consumer,
            args.imageName,
            args.inputFS,
            args.ioMegaBytes,
            args.storageMegaBytes,
            args.args,
            lastJobID,
            args.months
        );
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
            serviceDockerImages[dsp][imageName].minIoMegaBytes * months
            ,"min io bytes not met"
        );
        require(
            storageMegaBytes 
            >= serviceDockerImages[dsp][imageName].minStorageMegaBytes * months
            ,"min storage bytes not met"
        );
    }
    
    /**
     * @dev active and set endpoint and gas fee mult for dsp
     */
    function regDSP(string calldata endpoint) public {
        address _dsp = msg.sender;
        if(!registeredDSPs[_dsp].registered) {
            dspList[totalDsps++] = _dsp;
        }
        registeredDSPs[_dsp].active = true;
        registeredDSPs[_dsp].endpoint = endpoint;
        registeredDSPs[_dsp].registered = true;
        
        emit DSPStatusChanged(_dsp, true, endpoint);
    }
    
    /**
     * @dev deprecate dsp
     */
    function deprecateDSP() public {
        address _dsp = msg.sender;
        registeredDSPs[_dsp].active = false;
        registeredDSPs[_dsp].endpoint = "";
        emit DSPStatusChanged(_dsp, false,"");
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
        jobDockerImages[owner][imageName].image = imageAddress;
        jobDockerImages[owner][imageName].imageHash = imageHash;
        jobDockerImages[owner][imageName].jobFee = jobFee;
        jobDockerImages[owner][imageName].setup = true;

        approveDockerForDSP(imageName,true);
        
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
        uint ioFee,
        uint minStorageMegaBytes,
        uint minIoMegaBytes
    ) public {
        address owner = msg.sender;
        serviceDockerImages[owner][imageName].image = imageAddress;
        serviceDockerImages[owner][imageName].imageHash = imageHash;
        serviceDockerImages[owner][imageName].baseFee = baseFee;
        serviceDockerImages[owner][imageName].storageFee = storageFee;
        serviceDockerImages[owner][imageName].ioFee = ioFee;
        serviceDockerImages[owner][imageName].minStorageMegaBytes = minStorageMegaBytes;
        serviceDockerImages[owner][imageName].minIoMegaBytes = minIoMegaBytes;
        serviceDockerImages[owner][imageName].setup = true;

        approveDockerForDSP(imageName,false);
        
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
    function approveDockerForDSP(string calldata imageName, bool isJob) public {
        if(isJob) {
            require(jobDockerImages[msg.sender][imageName].setup == true, "image does not exist");
        } else {
            require(serviceDockerImages[msg.sender][imageName].setup == true, "image does not exist");
        }
        
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
     * @dev require consumer be caller or owner
     */
    function validateOwner(address consumer) private view {
        address[] storage owners = consumerData[consumer];
        for (uint i=0; i<owners.length; i++) {
            if(owners[i] != address(0)){
                require(owners[i] == msg.sender, "consumer not owner");
            } else {
                require(consumer == msg.sender, "consumer not sender");
            }
        }
    }

    /**
     * @dev require all dsps be active
     */
    function validateDsps(address[] memory dsps) private view {
        for (uint i=0; i<dsps.length; i++) {
            require(registeredDSPs[dsps[i]].active, "dsp not active");
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
    function getFeedData() private view returns (uint256 gasWei) {
        uint32 stalenessSeconds = s_config.stalenessSeconds;
        bool staleFallback = stalenessSeconds > 0;
        uint256 timestamp;
        int256 feedValue; // = 99000000000 / 1e9 = 99 gwei
        (, feedValue, , timestamp, ) = FAST_GAS_FEED.latestRoundData();
        if ((staleFallback && stalenessSeconds < block.timestamp - timestamp) || feedValue <= 0) {
            gasWei = s_fallbackGasPrice;
        } else {
            gasWei = uint256(feedValue);
        }
        return gasWei;
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