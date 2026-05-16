// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract NexusEscrow {
    error AlreadyReleased(uint256 jobId);
    error InsufficientDeposit(uint256 provided, uint256 required);
    error Unauthorized();

    address public jobEngine;
    address public auditEngine;
    address public vault;
    address public registry;

    mapping(uint256 => uint256) public jobEscrow;
    mapping(uint256 => bool) public released;

    modifier onlyJobEngine() {
        if (msg.sender != jobEngine) revert Unauthorized();
        _;
    }

    modifier onlyAuditEngine() {
        if (msg.sender != auditEngine) revert Unauthorized();
        _;
    }

    event EscrowLocked(uint256 indexed jobId, uint256 amount, address poster);
    event EscrowReleased(uint256 indexed jobId, address worker, uint256 amount);
    event EscrowRefunded(uint256 indexed jobId, address poster, uint256 amount);

    constructor(address _jobEngine, address _vault, address _registry) {
        jobEngine = _jobEngine;
        vault = _vault;
        registry = _registry;
    }

    function setAuditEngine(address _auditEngine) external {
        if (auditEngine != address(0)) revert Unauthorized();
        auditEngine = _auditEngine;
    }

    function lock(uint256 jobId, uint256 amount) external payable onlyJobEngine {
        if (released[jobId]) revert AlreadyReleased(jobId);
        if (msg.value < amount) revert InsufficientDeposit(msg.value, amount);
        jobEscrow[jobId] = amount;
        emit EscrowLocked(jobId, amount, msg.sender);
    }

    function release(
        uint256 jobId,
        address worker,
        uint256 auditScore,
        uint256 threshold
    ) external onlyAuditEngine {
        if (released[jobId]) revert AlreadyReleased(jobId);

        uint256 escrowAmount = jobEscrow[jobId];
        released[jobId] = true;

        if (auditScore >= threshold) {
            (bool sent,) = payable(worker).call{value: escrowAmount}("");
            require(sent, "Release transfer failed");
            emit EscrowReleased(jobId, worker, escrowAmount);
        } else {
            (, address owner,,,,,,,,,,,,,) = INexusRegistry3(registry).getAgent(
                _getWorkerAgentId(worker)
            );
            uint256 refundAmount = escrowAmount / 2;
            (bool sentRefund,) = payable(owner).call{value: refundAmount}("");
            require(sentRefund, "Refund transfer failed");
            emit EscrowRefunded(jobId, owner, refundAmount);
        }
    }

    function refund(uint256 jobId) external onlyJobEngine {
        if (released[jobId]) revert AlreadyReleased(jobId);
        uint256 escrowAmount = jobEscrow[jobId];
        released[jobId] = true;
        (bool sent,) = payable(msg.sender).call{value: escrowAmount}("");
        require(sent, "Refund transfer failed");
        emit EscrowRefunded(jobId, msg.sender, escrowAmount);
    }

    function _getWorkerAgentId(address worker) internal pure returns (uint256) {
        return uint256(uint160(worker));
    }
}

interface INexusRegistry3 {
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
