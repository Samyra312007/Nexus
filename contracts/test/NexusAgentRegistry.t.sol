// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {NexusAgentRegistry} from "../src/NexusAgentRegistry.sol";

contract NexusAgentRegistryTest is Test {
    NexusAgentRegistry public registry;
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    bytes32 constant CAP_SENTIMENT = keccak256("sentiment-analysis");
    bytes32 constant CAP_ORACLE = keccak256("price-oracle");

    function setUp() public {
        registry = new NexusAgentRegistry();
        deal(alice, 100 ether);
        deal(bob, 100 ether);
    }

    function test_RegisterAgent() public {
        bytes32[] memory caps = new bytes32[](1);
        caps[0] = CAP_SENTIMENT;

        vm.prank(alice);
        uint256 agentId = registry.registerAgent{value: 10 ether}(
            "SentimentBot", "Analyzes sentiment", "QmHash",
            caps, 0, 0.05 ether, address(0)
        );

        assertEq(agentId, 1);
        assertEq(registry.agentCount(), 1);
    }

    function test_RevertIf_InsufficientStake() public {
        bytes32[] memory caps = new bytes32[](1);
        caps[0] = CAP_SENTIMENT;

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(NexusAgentRegistry.InsufficientStake.selector, 10 ether, 1 ether)
        );
        registry.registerAgent{value: 1 ether}(
            "Bot", "desc", "QmHash", caps, 0, 0.05 ether, address(0)
        );
    }
}
