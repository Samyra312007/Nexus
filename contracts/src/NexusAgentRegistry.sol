// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/INexusRegistry.sol";

struct AgentProfile {
    uint256 id;
    address owner;
    string name;
    string description;
    string ipfsMetadataHash;
    bytes32[] capabilities;
    uint8 pricingModel;
    uint256 basePrice;
    uint256 stakedAmount;
    uint256 reputationScore;
    uint256 completedJobs;
    uint256 failedJobs;
    bool isActive;
    address parentAgent;
    uint256[] childAgents;
}

contract NexusAgentRegistry is INexusRegistry {
    error Unauthorized();
    error InsufficientStake(uint256 required, uint256 provided);
    error AgentNotFound(uint256 agentId);
    error AgentInactive(uint256 agentId);
    error InvalidCapability();

    uint256 public constant MIN_STAKE = 10 ether;
    uint256 public constant MAX_REPUTATION = 10000;
    uint256 public constant REPUTATION_BOOST_SUCCESS = 10;
    uint256 public constant REPUTATION_PENALTY_FAIL = 50;
    uint256 public constant SLASH_PENALTY_BPS = 500;

    address public jobEngine;
    address public auditEngine;
    uint256 public agentCount;

    mapping(uint256 => AgentProfile) public agents;
    mapping(bytes32 => uint256[]) public capabilityIndex;
    mapping(address => uint256) public ownerAgentCount;
    mapping(uint256 => address) public agentOwner;

    modifier onlyJobEngine() {
        if (msg.sender != jobEngine) revert Unauthorized();
        _;
    }

    modifier onlyAuditEngine() {
        if (msg.sender != auditEngine) revert Unauthorized();
        _;
    }

    event AgentRegistered(uint256 indexed agentId, address indexed owner, bytes32[] capabilities);
    event ReputationUpdated(uint256 indexed agentId, uint256 newScore, int256 delta);
    event AgentSlashed(uint256 indexed agentId, uint256 slashAmount, string reason);
    event AgentDeactivated(uint256 indexed agentId);
    event ChildAgentSpawned(uint256 indexed parentId, uint256 indexed childId);
    event JobEngineSet(address jobEngine);
    event AuditEngineSet(address auditEngine);

    function setJobEngine(address _jobEngine) external {
        if (jobEngine != address(0)) revert Unauthorized();
        jobEngine = _jobEngine;
        emit JobEngineSet(_jobEngine);
    }

    function setAuditEngine(address _auditEngine) external {
        if (auditEngine != address(0)) revert Unauthorized();
        auditEngine = _auditEngine;
        emit AuditEngineSet(_auditEngine);
    }

    function registerAgent(
        string memory name,
        string memory description,
        string memory ipfsHash,
        bytes32[] memory capabilities,
        uint8 pricingModel,
        uint256 basePrice,
        address parentAgent
    ) external payable returns (uint256 agentId) {
        if (capabilities.length == 0) revert InvalidCapability();
        if (msg.value < MIN_STAKE) revert InsufficientStake(MIN_STAKE, msg.value);

        agentId = ++agentCount;
        agents[agentId] = AgentProfile({
            id: agentId,
            owner: msg.sender,
            name: name,
            description: description,
            ipfsMetadataHash: ipfsHash,
            capabilities: capabilities,
            pricingModel: pricingModel,
            basePrice: basePrice,
            stakedAmount: msg.value,
            reputationScore: 5000,
            completedJobs: 0,
            failedJobs: 0,
            isActive: true,
            parentAgent: parentAgent,
            childAgents: new uint256[](0)
        });

        agentOwner[agentId] = msg.sender;
        ownerAgentCount[msg.sender]++;

        for (uint256 i = 0; i < capabilities.length; i++) {
            capabilityIndex[capabilities[i]].push(agentId);
        }

        if (parentAgent != address(0)) {
            uint256 parentId = _getAgentIdByAddress(parentAgent);
            if (parentId != 0) {
                agents[parentId].childAgents.push(agentId);
                emit ChildAgentSpawned(parentId, agentId);
            }
        }

        emit AgentRegistered(agentId, msg.sender, capabilities);
    }

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
        )
    {
        AgentProfile storage a = agents[agentId];
        return (
            a.id, a.owner, a.name, a.description, a.ipfsMetadataHash,
            a.capabilities, a.pricingModel, a.basePrice, a.stakedAmount,
            a.reputationScore, a.completedJobs, a.failedJobs, a.isActive,
            a.parentAgent, a.childAgents
        );
    }

    function getAgentsByCapability(bytes32 capability) external view returns (uint256[] memory) {
        return capabilityIndex[capability];
    }

    function updateReputation(uint256 agentId, bool success, uint256 qualityScore) external onlyJobEngine {
        AgentProfile storage agent = agents[agentId];
        if (!agent.isActive) revert AgentInactive(agentId);

        int256 delta;
        if (success) {
            agent.completedJobs++;
            uint256 boost = REPUTATION_BOOST_SUCCESS + (qualityScore / 10);
            uint256 newScore = agent.reputationScore + boost;
            if (newScore > MAX_REPUTATION) newScore = MAX_REPUTATION;
            delta = int256(newScore) - int256(agent.reputationScore);
            agent.reputationScore = newScore;
        } else {
            agent.failedJobs++;
            uint256 penalty = REPUTATION_PENALTY_FAIL;
            if (agent.reputationScore > penalty) {
                agent.reputationScore -= penalty;
                delta = -int256(penalty);
            } else {
                delta = -int256(agent.reputationScore);
                agent.reputationScore = 0;
            }
        }
        emit ReputationUpdated(agentId, agent.reputationScore, delta);
    }

    function slashAgent(uint256 agentId, uint256 amount) external onlyAuditEngine {
        AgentProfile storage agent = agents[agentId];
        if (!agent.isActive) revert AgentInactive(agentId);

        uint256 slashAmount = amount;
        if (slashAmount > agent.stakedAmount) slashAmount = agent.stakedAmount;
        agent.stakedAmount -= slashAmount;

        if (agent.stakedAmount < MIN_STAKE) {
            agent.isActive = false;
            emit AgentDeactivated(agentId);
        }

        uint256 repPenalty = (SLASH_PENALTY_BPS * agent.reputationScore) / 10000;
        if (agent.reputationScore > repPenalty) {
            agent.reputationScore -= repPenalty;
        } else {
            agent.reputationScore = 0;
        }

        emit AgentSlashed(agentId, slashAmount, "quality_failure");
        emit ReputationUpdated(agentId, agent.reputationScore, -int256(repPenalty));
    }

    function isActiveAgent(uint256 agentId) external view returns (bool) {
        return agents[agentId].isActive;
    }

    function getStakedAmount(uint256 agentId) external view returns (uint256) {
        return agents[agentId].stakedAmount;
    }

    function addStake(uint256 agentId) external payable {
        AgentProfile storage agent = agents[agentId];
        if (msg.sender != agent.owner) revert Unauthorized();
        agent.stakedAmount += msg.value;
        if (!agent.isActive && agent.stakedAmount >= MIN_STAKE) {
            agent.isActive = true;
        }
    }

    function spawnChildAgent(
        uint256 parentAgentId,
        string memory name,
        string memory description,
        string memory ipfsHash,
        bytes32[] memory capabilities,
        uint8 pricingModel,
        uint256 basePrice
    ) external payable returns (uint256 childAgentId) {
        AgentProfile storage parent = agents[parentAgentId];
        if (msg.sender != parent.owner) revert Unauthorized();
        if (!parent.isActive) revert AgentInactive(parentAgentId);
        if (capabilities.length == 0) revert InvalidCapability();
        if (msg.value < MIN_STAKE) revert InsufficientStake(MIN_STAKE, msg.value);

        childAgentId = ++agentCount;
        uint256 parentRepBoost = parent.reputationScore / 10;
        uint256 childRep = parentRepBoost > MAX_REPUTATION ? MAX_REPUTATION : parentRepBoost;

        agents[childAgentId] = AgentProfile({
            id: childAgentId,
            owner: msg.sender,
            name: name,
            description: description,
            ipfsMetadataHash: ipfsHash,
            capabilities: capabilities,
            pricingModel: pricingModel,
            basePrice: basePrice,
            stakedAmount: msg.value,
            reputationScore: childRep,
            completedJobs: 0,
            failedJobs: 0,
            isActive: true,
            parentAgent: address(uint160(parentAgentId)),
            childAgents: new uint256[](0)
        });

        agentOwner[childAgentId] = msg.sender;
        ownerAgentCount[msg.sender]++;
        parent.childAgents.push(childAgentId);

        for (uint256 i = 0; i < capabilities.length; i++) {
            capabilityIndex[capabilities[i]].push(childAgentId);
        }

        emit ChildAgentSpawned(parentAgentId, childAgentId);
        emit AgentRegistered(childAgentId, msg.sender, capabilities);
    }

    function _getAgentIdByAddress(address agentAddress) internal view returns (uint256) {
        for (uint256 i = 1; i <= agentCount; i++) {
            if (agents[i].owner == agentAddress) return i;
        }
        return 0;
    }
}
