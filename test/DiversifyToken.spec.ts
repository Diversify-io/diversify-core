import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
import { DiversifyToken } from "../typechain/DiversifyToken.d";

describe("DiversifyToken", function () {
  let divToken: DiversifyToken;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;

  this.beforeEach(async () => {
    const [a1, a2, a3] = await ethers.getSigners();
    addr1 = a1;
    addr2 = a2;
    addr3 = a3;
    const Token = await ethers.getContractFactory("DiversifyToken");
    divToken = (await upgrades.deployProxy(Token)) as DiversifyToken;
  });

  describe("Deployment", function () {
    it("should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await divToken.balanceOf(addr1.address);
      expect(await divToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("should transfer tokens correctly between two accounts", async function () {
      // Arrange
      const tokensToSend = BigNumber.from(1749);
      const tokensToReceive = tokensToSend.sub(tokensToSend.div(BigNumber.from(100)));
      const totalSupplyBefore = await divToken.totalSupply();

      const balance1before = await divToken.balanceOf(addr1.address);
      const balance2before = await divToken.balanceOf(addr2.address);

      // Act
      await divToken.transfer(addr2.address, tokensToSend);
      const totalSupplyAfter = await divToken.totalSupply();
      const balance1after = await divToken.balanceOf(addr1.address);
      const balance2after = await divToken.balanceOf(addr2.address);

      // Assert
      expect(balance2after).to.be.equal(tokensToReceive);
      expect(balance1after).to.be.equal(balance1before.sub(tokensToSend));

      // Log
      console.log("------------");
      console.log("BEFORE");
      console.log("total:\t\t" + totalSupplyBefore.toString());
      console.log("balance1:\t" + balance1before.toString());
      console.log("balance2:\t" + balance2before.toString());
      console.log("------------");
      console.log("AFTER");
      console.log("total:\t\t" + totalSupplyAfter.toString());
      console.log("balance1:\t" + balance1after.toString());
      console.log("balance2:\t" + balance2after.toString());
      console.log("------------");
      console.log("burnt:\t\t" + totalSupplyBefore.sub(totalSupplyAfter).toString());
    });

    /*
     TODO:
    it("should stop burning tokens as soon as the total amount reaches 1% of the initial", async function () {
      await divToken.burn(SUPPLY1, { from: account1 });
      await divToken.burn(SUPPLY3, { from: account3 });
      const balanceBeforeBurn = await divToken.balanceOf(account2);
      expect(balanceBeforeBurn).to.be.equal(SUPPLY2);
      await divToken.burn(balanceBeforeBurn.sub(BURN_STOP_SUPPLY), { from: account2 });
      const balanceAfterBurn = await divToken.balanceOf(account2);
      const totalSupplyBeforeSend = await divToken.totalSupply();
      await divToken.transfer(account1, ether("1000"), { from: account2 });
      const totalSupplyAfterSend = await divToken.totalSupply();
      expect(totalSupplyAfterSend).to.be.bignumber.equal(totalSupplyBeforeSend);
      const balance1 = await divToken.balanceOf(account1);
      const balance2 = await divToken.balanceOf(account2);
      expect(balanceAfterBurn).to.be.bignumber.equal(balance1.add(balance2).addn(1));
    });

    it("should burn the correct amount of tokens when reaching the auto-burn limit", async function () {
      await divToken.burn(SUPPLY1, { from: account1 });
      await divToken.burn(SUPPLY3, { from: account3 });
      const balanceBeforeBurn = await divToken.balanceOf(account2);
      expect(balanceBeforeBurn).to.be.bignumber.equal(SUPPLY2);
      const amountToBurn = balanceBeforeBurn.sub(BURN_STOP_SUPPLY).sub(ether("3333"));
      await divToken.burn(amountToBurn, { from: account2 });
      const balanceAfterBurn = await divToken.balanceOf(account2);
      // just to make this test case clearer
      // the user's balance is 3333 tokens larger than the auto-burn limit
      // we must not burn more than this amount
      expect(balanceAfterBurn).to.be.bignumber.equal(ether("2103333"));
      const expectingBurningAmount = ether("3333");
      const totalSupplyBeforeSend = await divToken.totalSupply();
      const {
        receipt: { transactionHash },
      } = await divToken.transfer(account1, balanceAfterBurn, { from: account2 });
      const events = await getEvents(transactionHash, token, "Transfer", web3);
      const actualBurningAmount = new BN(events[0].args.value);
      const totalSupplyAfterSend = await divToken.totalSupply();
      expect(actualBurningAmount).to.be.bignumber.equal(expectingBurningAmount);
      expect(totalSupplyAfterSend).to.be.bignumber.equal(totalSupplyBeforeSend.sub(expectingBurningAmount));
      const balance1 = await divToken.balanceOf(account1);
      expect(balanceAfterBurn).to.be.bignumber.equal(balance1.add(expectingBurningAmount));
    });*/
  });
});
