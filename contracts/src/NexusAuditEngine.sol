// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IAgentRequester.sol";

interface IEscrow {
    function release(uint256 jobId, address worker, uint256 auditScore, uint256 threshold) external;
}

interface IJobEngine {
    function completeJob(uint256 jobId, uint256 qualityScore) external;
    function getJobStatus(uint256 jobId) external view returns (uint8);
    function getJobWinningAgent(uint256 jobId) external view returns (uint256);
    function getJobQualityThreshold(uint256 jobId) external view returns (uint256);
    function getJobWorker(uint256 jobId) external view returns (address, uint256);
}

contract NexusAuditEngine {
    error OnlyPlatform();
    error AuditInProgress(uint256 jobId);
    error NoAuditNeeded(uint256 jobId);
    error InsufficientValidators();

    address public jobEngine;
    address public escrow;
    address public registry;
    IAgentRequester public platform;

    uint256 public constant AUDITOR_AGENT_ID = 42;
    uint256 public constant VALIDATOR_MINIMUM = 3;
    uint256 public constant AUDIT_DEPOSIT = 0.01 ether;

    struct Audit {
        uint256 jobId;
        uint256 requestId;
        uint256 score;
        uint256 validatorCount;
        uint256 responsesCount;
        bool passed;
        bool completed;
    }

    mapping(uint256 => Audit) public audits;
    mapping(uint256 => uint256) public jobToRequest;
    mapping(uint256 => uint256) public requestToJob;

    event AuditRequested(uint256 indexed jobId, uint256 indexed requestId);
    event AuditCompleted(uint256 indexed jobId, uint256 qualityScore, bool passed);
    event AuditFailed(uint256 indexed jobId, string reason);
    event ValidatorResponse(uint256 indexed jobId, address validator, bytes result);

    constructor(address _jobEngine, address _escrow, address _registry, address _platform) {
        jobEngine = _jobEngine;
        escrow = _escrow;
        registry = _registry;
        platform = IAgentRequester(_platform);
    }

    function requestAudit(
        uint256 jobId,
        string memory originalSpec,
        bytes memory submittedResult
    ) external payable {
        if (msg.sender != jobEngine) revert();
        if (audits[jobId].completed) revert NoAuditNeeded(jobId);

        bytes memory payload = abi.encode(jobId, originalSpec, submittedResult);

        uint256 requestId = platform.createRequest{value: msg.value}(
            AUDITOR_AGENT_ID,
            address(this),
            this.handleAuditResult.selector,
            payload
        );

        audits[jobId] = Audit({
            jobId: jobId,
            requestId: requestId,
            score: 0,
            validatorCount: 0,
            responsesCount: 0,
            passed: false,
            completed: false
        });

        jobToRequest[jobId] = requestId;
        requestToJob[requestId] = jobId;

        emit AuditRequested(jobId, requestId);
    }

    function handleAuditResult(
        uint256 requestId,
        Response[] memory responses,
        ResponseStatus status,
        Request memory
    ) external {
        if (msg.sender != address(platform)) revert OnlyPlatform();

        uint256 jobId = requestToJob[requestId];
        Audit storage audit = audits[jobId];

        if (status == ResponseStatus.Success && responses.length > 0) {
            uint256 totalScore = 0;
            uint256 validResponses = 0;

            for (uint256 i = 0; i < responses.length; i++) {
                if (responses[i].validator != address(0)) {
                    uint256 score = abi.decode(responses[i].result, (uint256));
                    if (score <= 100) {
                        totalScore += score;
                        validResponses++;
                        emit ValidatorResponse(jobId, responses[i].validator, responses[i].result);
                    }
                }
            }

            if (validResponses >= VALIDATOR_MINIMUM) {
                audit.score = totalScore / validResponses;
                audit.responsesCount = validResponses;
                audit.validatorCount = responses.length;
                audit.passed = audit.score >= _getQualityThreshold(jobId);
                audit.completed = true;

                _settleJob(jobId, audit.score, audit.passed);
                emit AuditCompleted(jobId, audit.score, audit.passed);
            } else {
                emit AuditFailed(jobId, "INSUFFICIENT_VALIDATORS");
            }
        } else if (status == ResponseStatus.TimedOut) {
            emit AuditFailed(jobId, "VALIDATOR_TIMEOUT");
        } else {
            emit AuditFailed(jobId, "AUDIT_FAILED");
        }
    }

    function _settleJob(uint256 jobId, uint256 qualityScore, bool passed) internal {
        uint256 threshold = _getQualityThreshold(jobId);
        address worker = _getWorkerAddress(jobId);

        IEscrow(escrow).release(jobId, worker, qualityScore, threshold);
        IJobEngine(jobEngine).completeJob(jobId, qualityScore);
    }

    function _getQualityThreshold(uint256 jobId) internal view returns (uint256) {
        return IJobEngine(jobEngine).getJobQualityThreshold(jobId);
    }

    function _getWorkerAddress(uint256 jobId) internal view returns (address) {
        (address owner,) = IJobEngine(jobEngine).getJobWorker(jobId);
        return owner;
    }

    function getAudit(uint256 jobId) external view returns (Audit memory) {
        return audits[jobId];
    }

    function getRequestId(uint256 jobId) external view returns (uint256) {
        return jobToRequest[jobId];
    }
}

interface INexusRegistry5 {
    function getAgent(uint256 agentId)
        external
        view
        returns (
            uint256 id,
            address owner,
            string memory name,
            string memory description,
            string memory ipfsMetadataHash,
            bytes32[] memory capabilities,
            uint8 pricingModel,
            uint256 basePrice,
            uint256 stakedAmount,
            uint256 reputationScore,
            uint256 completedJobs,
            uint256 failedJobs,
            bool isActive,
            address parentAgent,
            uint256[] memory childAgents
        );
}
