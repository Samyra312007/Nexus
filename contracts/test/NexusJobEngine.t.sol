// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {NexusAgentRegistry} from "../src/NexusAgentRegistry.sol";
import {NexusVault} from "../src/NexusVault.sol";
import "../src/NexusJobEngine.sol";

contract NexusJobEngineTest is Test {
    NexusAgentRegistry public registry;
    NexusVault public vault;
    NexusJobEngine public jobEngine;

    address public alice = makeAddr("alice");
    bytes32 constant CAP_SENTIMENT = keccak256("sentiment-analysis");

    function setUp() public {
        registry = new NexusAgentRegistry();
        vault = new NexusVault(address(registry));
        jobEngine = new NexusJobEngine(address(registry), address(vault));
        deal(alice, 100 ether);
    }

    function test_PostJob() public {
        vm.prank(alice);
        uint256 jobId = jobEngine.postJob{value: 0.5 ether}(CAP_SENTIMENT, "QmTaskSpec", 75, 300);
        assertEq(jobId, 1);
    }

    function test_SubmitBid() public {
        vm.startPrank(alice);
        bytes32[] memory caps = new bytes32[](1);
        caps[0] = CAP_SENTIMENT;
        registry.registerAgent{value: 10 ether}("WB", "", "QmH", caps, 0, 0.05 ether, address(0));
        jobEngine.postJob{value: 0.5 ether}(CAP_SENTIMENT, "QmTask", 75, 300);
        jobEngine.submitBid(1, 0.1 ether);
        vm.stopPrank();
    }

    function test_ResolveBids() public {
        vm.startPrank(alice);
        bytes32[] memory caps = new bytes32[](1);
        caps[0] = CAP_SENTIMENT;
        registry.registerAgent{value: 10 ether}("WB", "", "QmH", caps, 0, 0.05 ether, address(0));
        jobEngine.postJob{value: 0.5 ether}(CAP_SENTIMENT, "QmTask", 75, 300);
        jobEngine.submitBid(1, 0.1 ether);
        vm.stopPrank();
        jobEngine.resolveBids(1);
    }
}
