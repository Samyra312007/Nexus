// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

struct Response {
    address validator;
    bytes result;
    bytes32 requestId;
}

enum ResponseStatus { Pending, Success, Failed, TimedOut }

struct Request {
    uint256 id;
    uint256 agentId;
    bytes32 requestId;
    address caller;
    address callbackContract;
    bytes4 callbackSelector;
    bytes payload;
    uint256 deposit;
    uint256 operationsReserve;
    uint256 rewardPot;
    uint256 createdAt;
    ResponseStatus status;
}

interface IAgentRequester {
    function createRequest(
        uint256 agentId,
        address callbackContract,
        bytes4 callbackSelector,
        bytes memory payload
    ) external payable returns (uint256 requestId);

    function getRequest(uint256 requestId) external view returns (Request memory);
    function getResponses(uint256 requestId) external view returns (Response[] memory);
}
