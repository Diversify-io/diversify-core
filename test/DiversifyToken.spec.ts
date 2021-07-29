import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { ethers, upgrades } from 'hardhat'
import { DiversifyBurn } from '../typechain/DiversifyBurn.d'
import { DiversifyV1 } from '../typechain/DiversifyV1.d'
import { DiversifyV2 } from '../typechain/DiversifyV2.d'

describe('DiversifyToken', function () {
  let divToken: DiversifyV1
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
    const Token = await ethers.getContractFactory('Diversify_V1')
    divToken = (await upgrades.deployProxy(Token, [addr4.address])) as DiversifyV1
  })

  describe('Deployment', function () {
    it('should assign the total supply of tokens to the owner', async function () {
      const ownerBalance = await divToken.balanceOf(addr1.address)
      expect(await divToken.totalSupply()).to.equal(ownerBalance)
    })

    it('should assign the foundation wallet to the constructor', async function () {
      expect(await divToken.foundationWallet()).to.equal(addr4.address)
    })

    describe('Deploy and upgrade token contract to V2', () => {
      it('Deploy and upgrade V2', async () => {
        const divV2 = await ethers.getContractFactory('Diversify_V2')
        const divTokenV2 = (await upgrades.upgradeProxy(divToken.address, divV2)) as DiversifyV2

        const amountBeforeUpgrade = await divTokenV2.balanceOf(addr1.address)
        const supplyBeforeUpgrade = await divTokenV2.totalSupply()
        await divTokenV2.exampleFunction()
        const amountAfterUpgrade = await divTokenV2.balanceOf(addr1.address)
        const supplyAfterUpgrade = await divTokenV2.totalSupply()

        expect(amountBeforeUpgrade.add(500)).equals(amountAfterUpgrade)
        expect(supplyBeforeUpgrade.add(500)).equals(supplyAfterUpgrade)
      })
    })
  })

  describe('Transactions', function () {
    it('should transfer tokens correctly between two accounts', async function () {
      // Arrange
      const tokensToSend = parseEther('1749') // Convert momo's to tokens
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
      console.log('In momos')
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

    it('should stop burning tokens as soon as the total amount reaches 10% of the initial supply', async function () {
      // Arrange
      const divBurn = await ethers.getContractFactory('Diversify_Burn')
      const divBurnMock = (await upgrades.upgradeProxy(divToken.address, divBurn)) as DiversifyBurn
      const initialTotalSupply = await divBurnMock.totalSupply()
      const initialBalance = await divBurnMock.balanceOf(addr1.address)
      const burnStopSupply = await divBurnMock.burnStopSupply() // @dev constant set to 10% of initial supply

      // Act
      await divBurnMock.burn(addr1.address, initialTotalSupply)

      const finalTotalSupply = await divBurnMock.totalSupply()
      const finalBalance = await divBurnMock.balanceOf(addr1.address)

      // Assert
      expect(finalTotalSupply).eq(burnStopSupply)
      expect(finalBalance).eq(initialBalance.sub(initialTotalSupply.sub(burnStopSupply)))

      // Recheck Lock
      await expect(divBurnMock.burn(addr1.address, finalBalance)).to.be.reverted

      // Check transfer
      await divBurnMock.setFoundationRate(0) // sake of simplicity, disable foundation
      await divBurnMock.transfer(addr2.address, finalBalance)
      expect(await divBurnMock.balanceOf(addr2.address)).equals(finalBalance)
    })
  })

  describe('Foundation', function () {
    describe('Change Wallet', function () {
      it('should change address', async function () {
        // Arrange
        const oldFoundationWallet = await divToken.foundationWallet()

        // Act
        await divToken.setFoundationWallet(addr2.address)
        const newFoundationWallet = await divToken.foundationWallet()

        // Assert
        expect(newFoundationWallet).to.be.equal(addr2.address)

        // Log
        console.log('------------')
        console.log('Old Wallet:\t' + oldFoundationWallet)
        console.log('New Wallet:\t' + newFoundationWallet)
        console.log('------------')
      })
      it('should raise event', async function () {
        // Assert
        await expect(divToken.setFoundationWallet(addr2.address))
          .to.emit(divToken, 'FoundationWalletChanged')
          .withArgs(addr4.address, addr2.address)
      })
    })
    describe('change rate', function () {
      it('should change rate', async function () {
        // Arrange
        const foundationRate = 0.5 * 100 // change to 0.5%
        const oldFoundationRate = (await divToken.foundationRate()).toNumber()

        // Act
        await divToken.setFoundationRate(foundationRate)
        const newFoundationRate = (await divToken.foundationRate()).toNumber()

        // Assert
        expect(newFoundationRate).to.be.equal(foundationRate)

        // Log
        console.log('------------')
        console.log('Old Rate:\t' + oldFoundationRate / 100 + '%')
        console.log('New Rate:\t' + newFoundationRate / 100 + '%')
        console.log('------------')
      })
      it('should raise event', async function () {
        // Assert
        const oldFoundationRate = divToken.foundationRate
        const foundationRate = 0.5 * 100 // change to 0.5%
        await expect(divToken.setFoundationRate(foundationRate))
          .to.emit(divToken, 'FoundationRateChanged')
          .withArgs(oldFoundationRate, foundationRate)
      })
    })
  })
})
