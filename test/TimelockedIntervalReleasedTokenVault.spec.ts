import { parseEther } from '@ethersproject/units'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import { UpgradableDiversifyV1__factory } from '../typechain/factories/UpgradableDiversifyV1__factory'
import { UpgradableDiversifyV1 } from '../typechain/UpgradableDiversifyV1'
import { TimelockedIntervalReleasedTokenVault__factory } from './../typechain/factories/TimelockedIntervalReleasedTokenVault__factory'
import { TimelockedIntervalReleasedTokenVault } from './../typechain/TimelockedIntervalReleasedTokenVault.d'
import { calculateReceivedAmount, daysToSeconds, increaseTimeAndMine } from './utils/testHelpers'

describe('TimelockedIntervalReleasedTokenVault', function () {
  let divToken: UpgradableDiversifyV1
  let addr1: SignerWithAddress // owner Wallet
  let beneficary: SignerWithAddress
  let addr3: SignerWithAddress
  let vault: TimelockedIntervalReleasedTokenVault

  const VAULT_START_BALANCE = 3000000000
  const LOCK_TIME = daysToSeconds(30)
  const LOCK_INTERVAL = daysToSeconds(1)
  const PART_PER_PAYOUT = 3000000000 / 30 // thirty intervals (each day)

  this.beforeEach(async () => {
    const [a1, a2, a3] = await ethers.getSigners()
    addr1 = a1
    beneficary = a2
    addr3 = a3
    const tokenFactory = (await ethers.getContractFactory('UpgradableDiversify_V1')) as UpgradableDiversifyV1__factory
    const vaultFactory = (await ethers.getContractFactory(
      'TimelockedIntervalReleasedTokenVault'
    )) as TimelockedIntervalReleasedTokenVault__factory

    vault = await vaultFactory.deploy(beneficary.address, LOCK_TIME, LOCK_INTERVAL)

    divToken = (await upgrades.deployProxy(tokenFactory, [
      [addr1.address, vault.address],
      [1000000000, VAULT_START_BALANCE],
      addr3.address,
    ])) as UpgradableDiversifyV1
  })

  describe('Views', function () {
    it('should return the available amount during different periods', async function () {
      await vault.start(divToken.address)
      expect(await vault.availableAmount()).to.be.equal(0)
      await increaseTimeAndMine(LOCK_INTERVAL)
      expect(await vault.availableAmount()).to.be.equal(parseEther(PART_PER_PAYOUT.toString()))
      await increaseTimeAndMine(LOCK_TIME)
      expect(await vault.availableAmount()).to.be.equal(parseEther(VAULT_START_BALANCE.toString()))
    })
  })

  describe('Retrieve locked tokens', function () {
    it('should be restricted to owner', async function () {
      await expect(vault.connect(beneficary.address).retrieveLockedTokens()).to.be.reverted
    })
    it('should revert when not started', async function () {
      await expect(vault.retrieveLockedTokens()).to.be.revertedWith('Lock not started')
    })

    it('should transfer revert when started and no tokens are available', async function () {
      // Arrange
      await vault.start(divToken.address)

      // Act
      await expect(vault.retrieveLockedTokens()).to.be.revertedWith(
        'No tokens available for retrieving at this moment.'
      )
    })

    it('should withdrawal whole amount when lock is over', async function () {
      // Arrange
      const transferredAmount = calculateReceivedAmount(await divToken.balanceOf(vault.address))
      await vault.start(divToken.address)
      await increaseTimeAndMine(LOCK_TIME)

      // Act
      await vault.retrieveLockedTokens()

      // Assert
      expect(await divToken.balanceOf(vault.address)).to.be.equal(0)
      expect(await divToken.balanceOf(beneficary.address)).to.be.equal(transferredAmount)
    })

    it('should allow withdrawal of tokens in accordance with the withdrawal policy', async function () {
      // Arrange
      const transferredAmount = calculateReceivedAmount(parseEther(PART_PER_PAYOUT.toString()))
      await vault.start(divToken.address)

      // Simulate all 30 payouts
      for (let index = 0; index < 30; index++) {
        const balanceBefeficary = divToken.balanceOf(beneficary.address)
        await increaseTimeAndMine(LOCK_INTERVAL)
        await vault.retrieveLockedTokens()
        expect(await vault.availableAmount()).to.be.equal(0)
        expect(await divToken.balanceOf(beneficary.address)).to.be.equal(
          (await balanceBefeficary).add(transferredAmount)
        )
      }

      expect(await divToken.balanceOf(vault.address)).to.be.equal(0)
    })
  })
})
