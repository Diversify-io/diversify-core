import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { ethers, upgrades } from 'hardhat'
import { UpgradableDiversifyV1, UpgradableDiversifyV2Mock } from '../types'
import {
  calculateBurnAmount,
  calculateCommunityAmount,
  calculateFoundationAmount,
  calculateReceivedAmount,
} from './helpers/calculators'

describe('DiversifyToken', function () {
  let divToken: UpgradableDiversifyV1
  let addr1: SignerWithAddress // owner Wallet
  let addr2: SignerWithAddress
  let addr3: SignerWithAddress
  let addr4: SignerWithAddress // foundation
  let addr5: SignerWithAddress // community
  this.beforeEach(async () => {
    const [a1, a2, a3, a4, a5] = await ethers.getSigners()
    addr1 = a1
    addr2 = a2
    addr3 = a3
    addr4 = a4
    addr5 = a5
    const Token = await ethers.getContractFactory('UpgradableDiversify_V1')
    divToken = (await upgrades.deployProxy(Token, [
      [addr1.address],
      [1000000000],
      addr4.address, // foundation
      addr5.address, // community
    ])) as UpgradableDiversifyV1
  })

  describe('Deployment', function () {
    it('should assign the total supply of tokens to the owner', async function () {
      const ownerBalance = await divToken.balanceOf(addr1.address)
      expect(await divToken.totalSupply()).to.equal(ownerBalance)
    })

    it('should assign the foundation to the constructor', async function () {
      expect(await divToken.foundation()).to.equal(addr4.address)
    })

    it('should assign the community to the constructor', async function () {
      expect(await divToken.community()).to.equal(addr5.address)
    })

    describe('Deploy and upgrade token contract to V2', () => {
      it('Deploy and upgrade V2', async () => {
        const divV2 = await ethers.getContractFactory('UpgradableDiversify_V2_Mock')
        const divTokenV2 = (await upgrades.upgradeProxy(divToken.address, divV2)) as UpgradableDiversifyV2Mock

        const amountBeforeUpgrade = await divTokenV2.balanceOf(addr1.address)
        const supplyBeforeUpgrade = await divTokenV2.totalSupply()
        await divTokenV2.exampleFunction()
        const amountAfterUpgrade = await divTokenV2.balanceOf(addr1.address)
        const supplyAfterUpgrade = await divTokenV2.totalSupply()

        expect(amountBeforeUpgrade.add(500)).equals(amountAfterUpgrade)
        expect(supplyBeforeUpgrade.add(500)).equals(supplyAfterUpgrade)
        expect(divTokenV2.address).to.be.equals(divToken.address)
      })
    })
  })

  describe('Transactions', function () {
    it('should transfer tokens correctly between two accounts', async function () {
      // Arrange
      const tokensToSend = parseEther('1749') // Convert momo's to tokens
      const tokenToFound = tokensToSend.mul(await divToken.foundationRate()).div(10 ** 4)
      const tokenToCommunity = tokensToSend.mul(await divToken.communityRate()).div(10 ** 4)
      const tokensToReceive = calculateReceivedAmount(tokensToSend)
      const totalSupplyBefore = await divToken.totalSupply()

      const balance1before = await divToken.balanceOf(addr1.address)
      const balance2before = await divToken.balanceOf(addr2.address)
      const balance3before = await divToken.balanceOf(addr3.address)
      const balance4before = await divToken.balanceOf(addr4.address) // Foundation
      const balance5before = await divToken.balanceOf(addr5.address) // Community

      // Act
      await divToken.transfer(addr2.address, tokensToSend)
      const totalSupplyAfter = await divToken.totalSupply()
      const balance1after = await divToken.balanceOf(addr1.address)
      const balance2after = await divToken.balanceOf(addr2.address)
      const balance3after = await divToken.balanceOf(addr3.address)
      const balance4after = await divToken.balanceOf(addr4.address) // Foundation
      const balance5after = await divToken.balanceOf(addr5.address) // Community

      // Assert
      expect(balance1after).to.be.equal(balance1before.sub(tokensToSend))
      expect(balance2after).to.be.equal(tokensToReceive)
      expect(balance4after).to.be.equal(balance4before.add(tokenToFound))
      expect(balance5after).to.be.equal(balance5before.add(tokenToCommunity))

      // Log
      console.log('------------')
      console.log('In momos')
      console.log('BEFORE')
      console.log('total:\t\t' + totalSupplyBefore.toString())
      console.log('balance1:\t' + balance1before.toString())
      console.log('balance2:\t' + balance2before.toString())
      console.log('balance3:\t' + balance3before.toString())
      console.log('balance4 (foundation):\t' + balance4before.toString())
      console.log('balance5 (community):\t' + balance5before.toString())
      console.log('------------')
      console.log('transfered:\t' + tokensToSend)
      console.log('------------')
      console.log('AFTER')
      console.log('total:\t\t' + totalSupplyAfter.toString())
      console.log('balance1:\t' + balance1after.toString())
      console.log('balance2:\t' + balance2after.toString())
      console.log('balance3:\t' + balance3after.toString())
      console.log('balance4 (foundation):\t' + balance4after.toString())
      console.log('balance5 (community):\t' + balance5after.toString())
      console.log('------------')
      console.log('burnt:\t\t' + totalSupplyBefore.sub(totalSupplyAfter).toString())
      console.log('found:\t\t' + balance4after.sub(balance4before).toString())
      console.log('community:\t\t' + balance5after.sub(balance5before).toString())
    })

    it('should update the views amountBurned and amountFounded', async function () {
      // Arrange
      const amountToTransfer = BigNumber.from(500)
      const amountToBeFounded = calculateFoundationAmount(amountToTransfer)
      const amountToBeCommunity = calculateCommunityAmount(amountToTransfer)
      const amountToBeBurned = calculateBurnAmount(amountToTransfer)

      // Act
      await divToken.transfer(addr2.address, amountToTransfer)

      // Assert
      expect(await divToken.amountBurned()).to.be.equal(amountToBeBurned)
      expect(await divToken.amountFounded()).to.be.equal(amountToBeFounded)
      expect(await divToken.amountCommunity()).to.be.equal(amountToBeCommunity)
    })
  })

  describe('Foundation', function () {
    describe('Change Wallet', function () {
      it('should change address', async function () {
        // Arrange
        const oldFoundationWallet = await divToken.foundation()
        // Act
        await divToken.setFoundation(addr2.address)
        const newFoundationWallet = await divToken.foundation()

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
        await expect(divToken.setFoundation(addr2.address))
          .to.emit(divToken, 'FoundationChanged')
          .withArgs(addr4.address, addr2.address)
      })
    })
    describe('Change rate', function () {
      it('should change rate and update view', async function () {
        // Arrange
        const foundationRate = 50 // basis points eq 0.5 pct
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

      it('should reverte if rate too height', async function () {
        // Arrange
        const foundationRate = 500 // basis points eq 0.5 pct

        // Assert
        expect(divToken.setFoundationRate(foundationRate)).to.be.reverted
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

  describe('Community', function () {
    describe('Change Wallet', function () {
      it('should change address', async function () {
        // Arrange
        const oldCommunity = await divToken.community()
        // Act
        await divToken.setCommunity(addr2.address)
        const newCommunity = await divToken.community()

        // Assert
        expect(newCommunity).to.be.equal(addr2.address)

        // Log
        console.log('------------')
        console.log('Old:\t' + oldCommunity)
        console.log('New:\t' + newCommunity)
        console.log('------------')
      })
      it('should raise event', async function () {
        // Assert
        await expect(divToken.setCommunity(addr2.address))
          .to.emit(divToken, 'CommunityChanged')
          .withArgs(addr5.address, addr2.address)
      })
    })
    describe('Change rate', function () {
      it('should change rate and update view', async function () {
        // Arrange
        const communityRate = 50 // basis points eq 0.5 pct
        const oldCommunityRate = (await divToken.communityRate()).toNumber()

        // Act
        await divToken.setCommunityRate(communityRate)
        const newCommunityRate = (await divToken.communityRate()).toNumber()

        // Assert
        expect(newCommunityRate).to.be.equal(communityRate)

        // Log
        console.log('------------')
        console.log('Old Rate:\t' + oldCommunityRate / 100 + '%')
        console.log('New Rate:\t' + newCommunityRate / 100 + '%')
        console.log('------------')
      })

      it('should reverte if rate too height', async function () {
        // Arrange
        const communityRate = 500 // basis points eq 0.5 pct

        // Assert
        expect(divToken.setCommunityRate(communityRate)).to.be.reverted
      })

      it('should raise event', async function () {
        // Assert
        const oldCommunityRate = divToken.communityRate
        const communityRate = 0.5 * 100 // change to 0.5%
        await expect(divToken.setCommunityRate(communityRate))
          .to.emit(divToken, 'CommunityRateChanged')
          .withArgs(oldCommunityRate, communityRate)
      })
    })
  })

  describe('Burn', function () {
    it('should burn and update amountBurned', async function () {
      // Arrange
      const amountToBurn = 500
      // Act
      await divToken.burn(500)
      // Assert
      expect(await divToken.amountBurned()).to.be.equal(amountToBurn)
    })

    it('should revert if burn from other account', async function () {
      // Arrange
      const amountToBurn = 500

      // Assert
      await expect(divToken.connect(addr2).burnFrom(addr1.address, amountToBurn)).to.be.revertedWith(
        'ERC20: burn amount exceeds allowance'
      )
    })

    it('should transfer burn allowance and burn from account', async function () {
      // Arrange
      const amountToBurn = 500
      const initialAmount = await divToken.balanceOf(addr1.address)
      await divToken.increaseAllowance(addr2.address, amountToBurn)

      // Act
      await divToken.connect(addr2).burnFrom(addr1.address, amountToBurn)

      // Assert
      expect(await divToken.amountBurned()).to.be.equal(amountToBurn)
      expect(await divToken.balanceOf(addr1.address)).to.be.equal(initialAmount.sub(amountToBurn))
    })

    it('should stop burning tokens as soon as the total amount reaches 10% of the initial supply', async function () {
      // Arrange
      const initialTotalSupply = await divToken.totalSupply()
      const initialBalance = await divToken.balanceOf(addr1.address)
      const burnStopSupply = await divToken.burnStopSupply() // @dev constant set to 10% of initial supply
      const maxTokenToBurn = initialTotalSupply.sub(burnStopSupply)

      // Check for overburning
      await expect(divToken.burn(initialTotalSupply)).to.be.reverted

      // Normal burn
      await divToken.burn(maxTokenToBurn)
      const finalTotalSupply = await divToken.totalSupply()
      const finalBalance = await divToken.balanceOf(addr1.address)
      // Assert
      expect(finalTotalSupply).eq(burnStopSupply)
      expect(finalBalance).eq(initialBalance.sub(maxTokenToBurn))

      // Recheck Lock
      await expect(divToken.burn(finalBalance)).to.be.reverted

      // Check transfer
      await divToken.transfer(addr2.address, finalBalance)
      expect(await divToken.balanceOf(addr2.address)).equals(
        finalBalance.sub(calculateFoundationAmount(finalBalance)).sub(calculateCommunityAmount(finalBalance))
      )
    })

    it('should adjust transfer burn amount, if it exceeds the total burn amount', async function () {
      // Arrange
      const initialTotalSupply = await divToken.totalSupply()
      const initialBalanceAcc2 = await divToken.balanceOf(addr2.address)
      const burnStopSupply = await divToken.burnStopSupply() // @dev constant set to 10% of initial supply
      const maxTokenToBurn = initialTotalSupply.sub(burnStopSupply)
      const addr1Amountd = await divToken.balanceOf(addr1.address)

      // Burn down near the supply
      await divToken.burn(maxTokenToBurn.sub(50))
      const addr1Amount = await divToken.balanceOf(addr1.address)
      await divToken.transfer(addr2.address, addr1Amount)

      // Assert
      expect(await divToken.balanceOf(addr2.address)).equals(
        addr1Amount
          .add(initialBalanceAcc2)
          .sub(50)
          .sub(calculateFoundationAmount(addr1Amount))
          .sub(calculateCommunityAmount(addr1Amount))
      )
    })
  })
})
