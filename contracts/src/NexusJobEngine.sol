// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/INexusRegistry.sol";

struct JobRequest {
    uint256 id;
    address poster;
    bytes32 requiredCapability;
    string taskPayloadIpfs;
    uint256 budgetWei;
    uint256 qualityThreshold;
    uint256 deadline;
    uint8 status;
    uint256 winningAgentId;
    bytes resultCalldata;
    uint256 auditScore;
}

struct Bid {
    uint256 agentId;
    uint256 price;
    uint256 timestamp;
}

interface IReactiveHandler {
    function onJobPosted(uint256 jobId) external;
    function onBidSubmitted(uint256 jobId, uint256 agentId) external;
}

contract NexusJobEngine {
    error JobExpired(uint256 jobId);
    error NotQualified(uint256 agentId, bytes32 capability);
    error BidTooHigh(uint256 bid, uint256 budget);
    error AuctionNotResolved(uint256 jobId);
    error NotWinningAgent(uint256 jobId, uint256 agentId);
    error InvalidStatus(uint256 jobId, uint8 expected, uint8 actual);
    error NotJobPoster(uint256 jobId);
    error InsufficientBudget();
    error NoBidsReceived(uint256 jobId);

    address public registry;
    address public escrow;
    address public auditEngine;
    address public vault;

    uint256 public jobCount;
    uint256 public constant BID_WINDOW = 60;

    mapping(uint256 => JobRequest) public jobs;
    mapping(uint256 => Bid[]) public jobBids;
    mapping(uint256 => mapping(uint256 => bool)) public hasBid;
    mapping(address => uint256[]) public posterJobs;

    modifier onlyAuditEngine() {
        if (msg.sender != auditEngine) revert();
        _;
    }

    event JobPosted(
        uint256 indexed jobId,
        bytes32 indexed capability,
        uint256 budget,
        uint256 deadline
    );

    event BidSubmitted(uint256 indexed jobId, uint256 indexed agentId, uint256 price);
    event BidWithdrawn(uint256 indexed jobId, uint256 indexed agentId);
    event JobAssigned(uint256 indexed jobId, uint256 indexed agentId, uint256 price);
    event ResultSubmitted(uint256 indexed jobId, uint256 indexed agentId, bytes result);
    event AuditRequested(uint256 indexed jobId);
    event JobCompleted(uint256 indexed jobId, uint256 qualityScore);
    event JobFailed(uint256 indexed jobId, string reason);
    event JobRefunded(uint256 indexed jobId);

    constructor(address _registry, address _vault) {
        registry = _registry;
        vault = _vault;
    }

    function setEscrow(address _escrow) external {
        if (escrow != address(0)) revert();
        escrow = _escrow;
    }

    function setAuditEngine(address _auditEngine) external {
        if (auditEngine != address(0)) revert();
        auditEngine = _auditEngine;
    }

    function postJob(
        bytes32 capability,
        string memory taskPayloadIpfs,
        uint256 qualityThreshold,
        uint256 deadlineOffset
    ) external payable returns (uint256 jobId) {
        if (msg.value == 0) revert InsufficientBudget();
        if (deadlineOffset == 0) deadlineOffset = BID_WINDOW;

        jobId = ++jobCount;
        jobs[jobId] = JobRequest({
            id: jobId,
            poster: msg.sender,
            requiredCapability: capability,
            taskPayloadIpfs: taskPayloadIpfs,
            budgetWei: msg.value,
            qualityThreshold: qualityThreshold,
            deadline: block.timestamp + deadlineOffset,
            status: 0,
            winningAgentId: 0,
            resultCalldata: bytes(""),
            auditScore: 0
        });

        posterJobs[msg.sender].push(jobId);

        emit JobPosted(jobId, capability, msg.value, block.timestamp + deadlineOffset);
    }

    function submitBid(uint256 jobId, uint256 price) external {
        JobRequest storage job = jobs[jobId];
        if (block.timestamp > job.deadline) revert JobExpired(jobId);
        if (job.status != 0) revert InvalidStatus(jobId, 0, job.status);
        if (price > job.budgetWei) revert BidTooHigh(price, job.budgetWei);

        uint256 agentId = _getSenderAgentId();
        if (!INexusRegistry(registry).isActiveAgent(agentId)) revert NotQualified(agentId, job.requiredCapability);
        if (hasBid[jobId][agentId]) return;

        hasBid[jobId][agentId] = true;
        jobBids[jobId].push(Bid({agentId: agentId, price: price, timestamp: block.timestamp}));

        emit BidSubmitted(jobId, agentId, price);
    }

    function resolveBids(uint256 jobId) external {
        JobRequest storage job = jobs[jobId];
        if (job.status != 0) revert InvalidStatus(jobId, 0, job.status);

        Bid[] memory bids = jobBids[jobId];
        if (bids.length == 0) {
            job.status = 5;
            emit JobFailed(jobId, "NO_BIDS");
            emit JobRefunded(jobId);
            return;
        }

        uint256 bestAgentId = bids[0].agentId;
        uint256 bestPrice = bids[0].price;

        for (uint256 i = 1; i < bids.length; i++) {
            if (bids[i].price < bestPrice) {
                bestPrice = bids[i].price;
                bestAgentId = bids[i].agentId;
            }
        }

        job.status = 1;
        job.winningAgentId = bestAgentId;

        emit JobAssigned(jobId, bestAgentId, bestPrice);
    }

    function submitResult(uint256 jobId, bytes calldata result) external {
        JobRequest storage job = jobs[jobId];
        if (job.status != 1) revert InvalidStatus(jobId, 1, job.status);

        uint256 agentId = _getSenderAgentId();
        if (agentId != job.winningAgentId) revert NotWinningAgent(jobId, agentId);

        job.resultCalldata = result;
        job.status = 2;

        emit ResultSubmitted(jobId, agentId, result);
    }

    function requestAudit(uint256 jobId) external returns (uint256) {
        JobRequest storage job = jobs[jobId];
        if (job.status != 2) revert InvalidStatus(jobId, 2, job.status);
        job.status = 3;
        emit AuditRequested(jobId);
        return jobId;
    }

    function completeJob(uint256 jobId, uint256 qualityScore) external onlyAuditEngine {
        JobRequest storage job = jobs[jobId];
        job.auditScore = qualityScore;
        job.status = 4;

        if (qualityScore >= job.qualityThreshold) {
            INexusRegistry(registry).updateReputation(job.winningAgentId, true, qualityScore);
            emit JobCompleted(jobId, qualityScore);
        } else {
            INexusRegistry(registry).updateReputation(job.winningAgentId, false, qualityScore);
            emit JobFailed(jobId, "LOW_QUALITY");
        }
    }

    function getJob(uint256 jobId) external view returns (JobRequest memory) {
        return jobs[jobId];
    }

    function getJobStatus(uint256 jobId) external view returns (uint8) {
        return jobs[jobId].status;
    }

    function getJobWinningAgent(uint256 jobId) external view returns (uint256) {
        return jobs[jobId].winningAgentId;
    }

    function getJobQualityThreshold(uint256 jobId) external view returns (uint256) {
        return jobs[jobId].qualityThreshold;
    }

    function getJobWorker(uint256 jobId) external view returns (address, uint256) {
        uint256 agentId = jobs[jobId].winningAgentId;
        (, address owner,,,,,,,,,,,,,) = INexusRegistry(registry).getAgent(agentId);
        return (owner, agentId);
    }

    function getBids(uint256 jobId) external view returns (Bid[] memory) {
        return jobBids[jobId];
    }

    function getPosterJobs(address poster) external view returns (uint256[] memory) {
        return posterJobs[poster];
    }

    function _getSenderAgentId() internal view returns (uint256) {
        for (uint256 i = 1; i <= INexusRegistry(registry).agentCount(); i++) {
            (, address owner,,,,,,,,,,,,,) = INexusRegistry(registry).getAgent(i);
            if (owner == msg.sender) return i;
        }
        return 0;
    }
}
