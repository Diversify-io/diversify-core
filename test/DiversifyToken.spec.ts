import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { ethers, upgrades } from 'hardhat'
import { DiversifyToken } from '../typechain/DiversifyToken.d'

describe('DiversifyToken', function () {
  let divToken: DiversifyToken
  let addr1: SignerWithAddress // owner Wallet
  let addr2: SignerWithAddress
  let addr3: SignerWithAddress
  let addr4: SignerWithAddress // foundationWallet
  this.beforeEach(async () => {
    const [a1, a2, a3, a4] = await ethers.getSigners()
    addr1 = a1
    addr2 = a2
    addr3 = a3
    addr4 = a4
    const Token = await ethers.getContractFactory('DiversifyToken')
    divToken = (await upgrades.deployProxy(Token, [addr4.address])) as DiversifyToken
  })

  describe('Deployment', function () {
    it('should assign the total supply of tokens to the owner', async function () {
      const ownerBalance = await divToken.balanceOf(addr1.address)
      expect(await divToken.totalSupply()).to.equal(ownerBalance)
    })

    it('should assign the foundation wallet to the constructor', async function () {
      expect(await divToken.foundationWallet()).to.equal(addr4.address)
    })
  })

  describe('Transactions', function () {
    it('should transfer tokens correctly between two accounts', async function () {
      // Arrange
      const tokensToSend = BigNumber.from(1749)
      const tokenToBurn = tokensToSend.div(BigNumber.from(100))
      const tokenToFound = tokensToSend.mul(await divToken.foundationRate()).div(10 ** 4)
      const tokensToReceive = tokensToSend.sub(tokenToBurn).sub(tokenToFound)
      const totalSupplyBefore = await divToken.totalSupply()

      const balance1before = await divToken.balanceOf(addr1.address)
      const balance2before = await divToken.balanceOf(addr2.address)
      const balance3before = await divToken.balanceOf(addr3.address)
      const balance4before = await divToken.balanceOf(addr4.address)

      // Act
      await divToken.transfer(addr2.address, tokensToSend)
      const totalSupplyAfter = await divToken.totalSupply()
      const balance1after = await divToken.balanceOf(addr1.address)
      const balance2after = await divToken.balanceOf(addr2.address)
      const balance3after = await divToken.balanceOf(addr3.address)
      const balance4after = await divToken.balanceOf(addr4.address)

      // Assert
      expect(balance1after).to.be.equal(balance1before.sub(tokensToSend))
      expect(balance2after).to.be.equal(tokensToReceive)
      expect(balance4after).to.be.equal(balance4before.add(tokenToFound))

      // Log
      console.log('------------')
      console.log('BEFORE')
      console.log('total:\t\t' + totalSupplyBefore.toString())
      console.log('balance1:\t' + balance1before.toString())
      console.log('balance2:\t' + balance2before.toString())
      console.log('balance3:\t' + balance3before.toString())
      console.log('balance4:\t' + balance4before.toString())
      console.log('------------')
      console.log('transfered:\t' + tokensToSend)
      console.log('------------')
      console.log('AFTER')
      console.log('total:\t\t' + totalSupplyAfter.toString())
      console.log('balance1:\t' + balance1after.toString())
      console.log('balance2:\t' + balance2after.toString())
      console.log('balance3:\t' + balance3after.toString())
      console.log('balance4:\t' + balance4after.toString())
      console.log('------------')
      console.log('burnt:\t\t' + totalSupplyBefore.sub(totalSupplyAfter).toString())
      console.log('found:\t\t' + balance4after.sub(balance4before).toString())
    })

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
  })
})
