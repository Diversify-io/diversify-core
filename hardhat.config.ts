import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import { task } from "hardhat/config";
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(await account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
export default {
  solidity: "0.8.4",
  networks: {
    hardhat: {},
    ganache: {
      url: "http://127.0.0.1:7545",
    },
  },
};
