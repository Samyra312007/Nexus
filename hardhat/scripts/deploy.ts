import { ethers } from "hardhat";

async function main() {
  console.log("Deploying NEXUS contracts to Somnia...\n");

  const Registry = await ethers.getContractFactory("NexusAgentRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  console.log("NexusAgentRegistry:", await registry.getAddress());

  const Vault = await ethers.getContractFactory("NexusVault");
  const vault = await Vault.deploy(await registry.getAddress());
  await vault.waitForDeployment();
  console.log("NexusVault:", await vault.getAddress());

  const JobEngine = await ethers.getContractFactory("NexusJobEngine");
  const jobEngine = await JobEngine.deploy(
    await registry.getAddress(),
    await vault.getAddress()
  );
  await jobEngine.waitForDeployment();
  console.log("NexusJobEngine:", await jobEngine.getAddress());

  const Escrow = await ethers.getContractFactory("NexusEscrow");
  const escrow = await Escrow.deploy(
    await jobEngine.getAddress(),
    await vault.getAddress(),
    await registry.getAddress()
  );
  await escrow.waitForDeployment();
  console.log("NexusEscrow:", await escrow.getAddress());

  const SOMNIA_AGENT_PLATFORM = process.env.AGENT_EXECUTOR_ADDRESS || "0x157C56dEdbAB6caD541109daabA4663Fc016026e";
  const AuditEngine = await ethers.getContractFactory("NexusAuditEngine");
  const auditEngine = await AuditEngine.deploy(
    await jobEngine.getAddress(),
    await escrow.getAddress(),
    await registry.getAddress(),
    SOMNIA_AGENT_PLATFORM
  );
  await auditEngine.waitForDeployment();
  console.log("NexusAuditEngine:", await auditEngine.getAddress());

  // Wire contracts together
  let tx = await registry.setJobEngine(await jobEngine.getAddress());
  await tx.wait();
  tx = await registry.setAuditEngine(await auditEngine.getAddress());
  await tx.wait();

  tx = await jobEngine.setEscrow(await escrow.getAddress());
  await tx.wait();
  tx = await jobEngine.setAuditEngine(await auditEngine.getAddress());
  await tx.wait();

  tx = await escrow.setAuditEngine(await auditEngine.getAddress());
  await tx.wait();

  console.log("\n=== NEXUS Deployment Complete ===");
  console.log("Registry:    ", await registry.getAddress());
  console.log("Vault:       ", await vault.getAddress());
  console.log("JobEngine:   ", await jobEngine.getAddress());
  console.log("Escrow:      ", await escrow.getAddress());
  console.log("AuditEngine: ", await auditEngine.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
