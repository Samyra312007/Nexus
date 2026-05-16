// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

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

    function updateReputation(uint256 agentId, bool success, uint256 qualityScore) external;
    function slashAgent(uint256 agentId, uint256 amount) external;
    function getAgentsByCapability(bytes32 capability) external view returns (uint256[] memory);
    function agentCount() external view returns (uint256);
    function isActiveAgent(uint256 agentId) external view returns (bool);
}
