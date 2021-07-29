import { upgrades } from "hardhat";

// scripts/transfer_ownership.js
async function main() {
  const gnosisSafe = "0x3Bc4f238330CfB5D0767722Ad1f092c806AB7a2b";

  console.log("Transferring ownership of ProxyAdmin...");
  // The owner of the ProxyAdmin can upgrade our contracts
  await upgrades.admin.transferProxyAdminOwnership(gnosisSafe);
  console.log("Transferred ownership of ProxyAdmin to:", gnosisSafe);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
