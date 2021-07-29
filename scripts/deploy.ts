import { ethers, upgrades } from "hardhat";

// npx hardhat run scripts/deploy.js --network
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Token = await ethers.getContractFactory("DiversifyToken");

  const mc = await upgrades.deployProxy(Token);

  console.log("Token address:", mc.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
