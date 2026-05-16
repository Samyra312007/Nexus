// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {NexusAgentRegistry} from "../src/NexusAgentRegistry.sol";
import {NexusVault} from "../src/NexusVault.sol";
import {NexusJobEngine, JobRequest} from "../src/NexusJobEngine.sol";
import {NexusEscrow} from "../src/NexusEscrow.sol";
import {NexusAuditEngine} from "../src/NexusAuditEngine.sol";
import {IAgentRequester, Response, ResponseStatus, Request} from "../src/interfaces/IAgentRequester.sol";

contract MockAgentPlatform is IAgentRequester {
    uint256 public nextRequestId;
    mapping(uint256 => Request) public requests;
    mapping(uint256 => uint256) public jobToRequest;
    NexusAuditEngine public auditEngine;

    function createRequest(
        uint256, address _c, bytes4, bytes memory payload
    ) external payable returns (uint256 rid) {
        rid = ++nextRequestId;
        (uint256 jid,,) = abi.decode(payload, (uint256, string, bytes));
        jobToRequest[jid] = rid;
        requests[rid] = Request({
            id: rid, agentId: 0, requestId: bytes32(rid),
            caller: msg.sender, callbackContract: _c,
            callbackSelector: bytes4(0), payload: payload,
            deposit: msg.value, operationsReserve: 0, rewardPot: 0,
            createdAt: block.timestamp, status: ResponseStatus.Pending
        });
        auditEngine = NexusAuditEngine(_c);
    }
    function getRequest(uint256) external view returns (Request memory) {}
    function getResponses(uint256) external view returns (Response[] memory) {}

    function fulfillAudit(uint256 jobId, uint256 score, bool, uint256 n) external {
        uint256 rid = jobToRequest[jobId];
        require(rid != 0, "no request");
        Response[] memory r = new Response[](n);
        for (uint256 i = 0; i < n; i++) {
            r[i] = Response({validator: address(uint160(0x1000 + i)), result: abi.encode(score), requestId: bytes32(jobId)});
        }
        Request memory req = requests[rid];
        auditEngine.handleAuditResult(rid, r, ResponseStatus.Success, req);
    }
}

contract NexusIntegrationTest is Test {
    NexusAgentRegistry public registry;
    NexusVault public vault;
    NexusJobEngine public jobEngine;
    NexusEscrow public escrow;
    NexusAuditEngine public auditEngine;
    MockAgentPlatform public platform;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    bytes32 constant CAP = keccak256("price-oracle");

    function setUp() public {
        platform = new MockAgentPlatform();
        registry = new NexusAgentRegistry();
        vault = new NexusVault(address(registry));
        jobEngine = new NexusJobEngine(address(registry), address(vault));
        escrow = new NexusEscrow(address(jobEngine), address(vault), address(registry));
        auditEngine = new NexusAuditEngine(address(jobEngine), address(escrow), address(registry), address(platform));
        registry.setJobEngine(address(jobEngine));
        registry.setAuditEngine(address(auditEngine));
        jobEngine.setEscrow(address(escrow));
        jobEngine.setAuditEngine(address(auditEngine));
        escrow.setAuditEngine(address(auditEngine));
        deal(alice, 100 ether);
        deal(bob, 100 ether);
    }

    function _reg(address u, string memory n) internal returns (uint256) {
        bytes32[] memory c = new bytes32[](1);
        c[0] = CAP;
        vm.prank(u);
        return registry.registerAgent{value: 10 ether}(n, "", "QmH", c, 0, 0.05 ether, address(0));
    }

    function _fullAudit(uint256 jid, uint256 score, bool pass, uint256 n) internal {
        jobEngine.requestAudit(jid);
        JobRequest memory j = jobEngine.getJob(jid);
        vm.prank(address(jobEngine));
        auditEngine.requestAudit{value: 0.01 ether}(jid, j.taskPayloadIPFS, j.resultCalldata);
        platform.fulfillAudit(jid, score, pass, n);
    }

    // getAgent returns 15-tuple:
    // 0:id  1:owner  2:name  3:desc  4:ipfs  5:caps  6:pricing
    // 7:basePrice  8:stake  9:rep  10:completed  11:failed  12:active  13:parent  14:children

    function _agentRep(uint256 id) internal view returns (uint256 rep, uint256 completed, uint256 failed) {
        (,,,,,,,,, rep, completed, failed,,,) = registry.getAgent(id);
    }

    function test_FullPipeline_Success() public {
        _reg(alice, "Poster");
        uint256 bobId = _reg(bob, "Worker");

        vm.prank(alice);
        uint256 jid = jobEngine.postJob{value: 0.5 ether}(CAP, "QmTaskSpec", 75, 300);
        vm.prank(alice);
        jobEngine.submitBid(jid, 0.3 ether);
        vm.prank(bob);
        jobEngine.submitBid(jid, 0.2 ether);
        vm.warp(block.timestamp + 61);
        jobEngine.resolveBids(jid);

        JobRequest memory job = jobEngine.getJob(jid);
        assertEq(uint256(job.status), 1, "Assigned");
        assertEq(job.winningAgentId, 2, "Bob wins");

        vm.prank(bob);
        jobEngine.submitResult(jid, bytes("QmResult"));

        _fullAudit(jid, 85, true, 3);

        job = jobEngine.getJob(jid);
        assertEq(uint256(job.status), 4, "Complete");
        assertEq(job.auditScore, 85, "auditScore");
        assertTrue(escrow.released(jid), "escrow released");

        (uint256 rep, uint256 done,) = _agentRep(bobId);
        assertEq(done, 1, "Bob 1 job");
        assertGt(rep, 5000, "rep up");
    }

    function test_LowQualityPenalty() public {
        _reg(alice, "Poster");
        uint256 bobId = _reg(bob, "Worker");

        vm.prank(alice);
        uint256 jid = jobEngine.postJob{value: 0.5 ether}(CAP, "QmSpec", 75, 300);
        vm.prank(alice);
        jobEngine.submitBid(jid, 0.3 ether);
        vm.prank(bob);
        jobEngine.submitBid(jid, 0.2 ether);
        vm.warp(block.timestamp + 61);
        jobEngine.resolveBids(jid);
        vm.prank(bob);
        jobEngine.submitResult(jid, bytes("QmBad"));
        _fullAudit(jid, 30, false, 3);

        (uint256 rep,,) = _agentRep(bobId);
        assertLt(rep, 5000, "rep down");
    }

    function test_NoBidsRefund() public {
        _reg(alice, "Poster");
        vm.prank(alice);
        jobEngine.postJob{value: 0.5 ether}(CAP, "QmSpec", 75, 300);
        vm.warp(block.timestamp + 61);
        jobEngine.resolveBids(1);
        assertEq(uint256(jobEngine.getJobStatus(1)), 5, "Failed(NO_BIDS)");
    }

    function test_ReputationUpDown() public {
        uint256 aid = _reg(alice, "Bot");

        (uint256 rep,,) = _agentRep(aid);
        assertEq(rep, 5000);

        vm.prank(alice);
        uint256 j1 = jobEngine.postJob{value: 0.5 ether}(CAP, "Q1", 75, 300);
        vm.prank(alice);
        jobEngine.submitBid(j1, 0.3 ether);
        vm.warp(block.timestamp + 61);
        jobEngine.resolveBids(j1);
        vm.prank(alice);
        jobEngine.submitResult(j1, bytes("R1"));
        _fullAudit(j1, 95, true, 5);

        (rep,,) = _agentRep(aid);
        assertEq(rep, 5000 + 10 + 9, "boosted");

        vm.prank(alice);
        uint256 j2 = jobEngine.postJob{value: 0.5 ether}(CAP, "Q2", 75, 300);
        vm.prank(alice);
        jobEngine.submitBid(j2, 0.3 ether);
        vm.warp(block.timestamp + 61);
        jobEngine.resolveBids(j2);
        vm.prank(alice);
        jobEngine.submitResult(j2, bytes("R2"));
        _fullAudit(j2, 20, false, 3);

        uint256 failed;
        (rep, , failed) = _agentRep(aid);
        assertEq(failed, 1, "1 failure");
        assertEq(rep, 5000 + 19 - 50, "penalty applied");
    }

    function test_SevereFailurePenalty() public {
        _reg(alice, "Poster");
        uint256 bobId = _reg(bob, "Worker");

        vm.prank(alice);
        uint256 jid = jobEngine.postJob{value: 0.5 ether}(CAP, "Q", 75, 300);
        vm.prank(alice);
        jobEngine.submitBid(jid, 0.3 ether);
        vm.prank(bob);
        jobEngine.submitBid(jid, 0.2 ether);
        vm.warp(block.timestamp + 61);
        jobEngine.resolveBids(jid);
        vm.prank(bob);
        jobEngine.submitResult(jid, bytes("Bad"));
        _fullAudit(jid, 15, false, 3);

        (uint256 rep, , uint256 failed) = _agentRep(bobId);
        assertLt(rep, 5000, "rep penalized");
        assertEq(failed, 1, "1 failure");
        assertTrue(escrow.released(jid), "escrow released (partial refund)");
    }
}
