// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {NexusAgentRegistry} from "../src/NexusAgentRegistry.sol";
import {NexusVault} from "../src/NexusVault.sol";
import {NexusJobEngine} from "../src/NexusJobEngine.sol";
import {NexusEscrow} from "../src/NexusEscrow.sol";
import {NexusAuditEngine} from "../src/NexusAuditEngine.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        NexusAgentRegistry registry = new NexusAgentRegistry();
        console.log("NexusAgentRegistry deployed at:", address(registry));

        NexusVault vault = new NexusVault(address(registry));
        console.log("NexusVault deployed at:", address(vault));

        NexusJobEngine jobEngine = new NexusJobEngine(address(registry), address(vault));
        console.log("NexusJobEngine deployed at:", address(jobEngine));

        NexusEscrow escrow = new NexusEscrow(address(jobEngine), address(vault), address(registry));
        console.log("NexusEscrow deployed at:", address(escrow));

        address somniaAgentPlatform = vm.envOr("AGENT_EXECUTOR_ADDRESS", address(0x157C56dEdbAB6caD541109daabA4663Fc016026e));
        NexusAuditEngine auditEngine = new NexusAuditEngine(
            address(jobEngine), address(escrow), address(registry), somniaAgentPlatform
        );
        console.log("NexusAuditEngine deployed at:", address(auditEngine));

        registry.setJobEngine(address(jobEngine));
        registry.setAuditEngine(address(auditEngine));

        jobEngine.setEscrow(address(escrow));
        jobEngine.setAuditEngine(address(auditEngine));

        escrow.setAuditEngine(address(auditEngine));

        vm.stopBroadcast();

        console.log("=== NEXUS Deployment Complete ===");
        console.log("Registry:    ", address(registry));
        console.log("Vault:       ", address(vault));
        console.log("JobEngine:   ", address(jobEngine));
        console.log("Escrow:      ", address(escrow));
        console.log("AuditEngine: ", address(auditEngine));
    }
}
