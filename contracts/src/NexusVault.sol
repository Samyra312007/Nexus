// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract NexusVault {
    error UnauthorizedAgent(uint256 agentId);
    error DailyLimitExceeded(uint256 spent, uint256 limit);
    error InsufficientBalance(uint256 available, uint256 required);
    error VaultNotFound(uint256 agentId);

    address public registry;
    uint256 public constant DEFAULT_DAILY_LIMIT = 5 ether;

    struct Vault {
        uint256 balance;
        uint256 totalEarned;
        uint256 totalSpent;
        uint256 totalSlashed;
        uint256 dailySpent;
        uint256 lastResetTimestamp;
        uint256 dailySpendLimit;
    }

    mapping(uint256 => Vault) public vaults;
    mapping(uint256 => address) public agentVaultOwner;

    modifier onlyAgent(uint256 agentId) {
        (, address owner,,,,,,,,,,,,,) = INexusRegistry(registry).getAgent(agentId);
        if (msg.sender != owner) revert UnauthorizedAgent(agentId);
        _;
    }

    event VaultDeposited(uint256 indexed agentId, uint256 amount, uint256 newBalance);
    event VaultEarned(uint256 indexed agentId, uint256 amount, uint256 newBalance);
    event VaultSpent(uint256 indexed agentId, address to, uint256 amount, uint256 newBalance);
    event VaultSlashed(uint256 indexed agentId, uint256 amount, uint256 newBalance);
    event DailyLimitSet(uint256 indexed agentId, uint256 newLimit);
    event AgentLinked(uint256 indexed agentId, address vaultAddress);

    constructor(address _registry) {
        registry = _registry;
    }

    function linkAgent(uint256 agentId) external {
        if (agentVaultOwner[agentId] != address(0)) revert();
        agentVaultOwner[agentId] = msg.sender;
        vaults[agentId] = Vault({
            balance: 0,
            totalEarned: 0,
            totalSpent: 0,
            totalSlashed: 0,
            dailySpent: 0,
            lastResetTimestamp: block.timestamp,
            dailySpendLimit: DEFAULT_DAILY_LIMIT
        });
        emit AgentLinked(agentId, address(this));
    }

    function deposit(uint256 agentId) external payable onlyAgent(agentId) {
        vaults[agentId].balance += msg.value;
        emit VaultDeposited(agentId, msg.value, vaults[agentId].balance);
    }

    function earn(uint256 agentId) external payable {
        vaults[agentId].balance += msg.value;
        vaults[agentId].totalEarned += msg.value;
        emit VaultEarned(agentId, msg.value, vaults[agentId].balance);
    }

    function spend(uint256 agentId, address to, uint256 amount) external onlyAgent(agentId) {
        Vault storage v = vaults[agentId];
        _resetDailyIfNeeded(agentId);

        if (v.balance < amount) revert InsufficientBalance(v.balance, amount);
        if (v.dailySpent + amount > v.dailySpendLimit) {
            revert DailyLimitExceeded(v.dailySpent + amount, v.dailySpendLimit);
        }

        v.balance -= amount;
        v.totalSpent += amount;
        v.dailySpent += amount;

        (bool sent,) = payable(to).call{value: amount}("");
        require(sent, "Transfer failed");

        emit VaultSpent(agentId, to, amount, v.balance);
    }

    function slash(uint256 agentId, uint256 amount) external {
        Vault storage v = vaults[agentId];
        uint256 slashAmount = amount;
        if (slashAmount > v.balance) slashAmount = v.balance;
        v.balance -= slashAmount;
        v.totalSlashed += slashAmount;
        emit VaultSlashed(agentId, slashAmount, v.balance);
    }

    function setDailyLimit(uint256 agentId, uint256 newLimit) external onlyAgent(agentId) {
        vaults[agentId].dailySpendLimit = newLimit;
        emit DailyLimitSet(agentId, newLimit);
    }

    function getBalance(uint256 agentId) external view returns (uint256) {
        return vaults[agentId].balance;
    }

    function getVaultSummary(uint256 agentId)
        external
        view
        returns (uint256 balance, uint256 totalEarned, uint256 totalSpent, uint256 dailySpent, uint256 dailyLimit)
    {
        Vault storage v = vaults[agentId];
        return (v.balance, v.totalEarned, v.totalSpent, v.dailySpent, v.dailySpendLimit);
    }

    function _resetDailyIfNeeded(uint256 agentId) internal {
        Vault storage v = vaults[agentId];
        if (block.timestamp >= v.lastResetTimestamp + 1 days) {
            v.dailySpent = 0;
            v.lastResetTimestamp = block.timestamp;
        }
    }
}

interface INexusRegistry {
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
