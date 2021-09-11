import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { parseEther } from 'ethers/lib/utils'
import { ethers, upgrades } from 'hardhat'
import { UpgradableDiversifyV1__factory } from '../typechain/factories/UpgradableDiversifyV1__factory'
import { UpgradableDiversifyV1 } from '../typechain/UpgradableDiversifyV1'
import { TimelockedTokenVault__factory } from './../typechain/factories/TimelockedTokenVault__factory'
import { TimelockedTokenVault } from './../typechain/TimelockedTokenVault.d'

describe('TimelockedTokenVault', function () {
  let divToken: UpgradableDiversifyV1
  let addr1: SignerWithAddress // owner Wallet
  let beneficary: SignerWithAddress
  let addr3: SignerWithAddress
  let vault: TimelockedTokenVault
  const VAULT_START_BALANCE = 2000000000
  this.beforeEach(async () => {
    const [a1, a2, a3] = await ethers.getSigners()
    addr1 = a1
    beneficary = a2
    addr3 = a3
    const tokenFactory = (await ethers.getContractFactory('UpgradableDiversify_V1')) as UpgradableDiversifyV1__factory
    const vaultFactory = (await ethers.getContractFactory('TimelockedTokenVault')) as TimelockedTokenVault__factory

    vault = await vaultFactory.deploy(beneficary.address, Date.now(), 5)

    divToken = (await upgrades.deployProxy(tokenFactory, [
      [addr1.address, vault.address],
      [1000000000, VAULT_START_BALANCE],
      addr3.address,
    ])) as UpgradableDiversifyV1
  })

  describe('Start', function () {
    it('should only be called from owner', async function () {
      await expect(vault.connect(beneficary).start(divToken.address)).to.be.reverted
    })

    it('should start successful', async function () {
      // Arrange
      const token = divToken.address

      // Arrange
      await vault.start(token)

      // Assert
      expect(await vault.started()).to.be.equal(true)
    })

    it('should revert if already started', async function () {
      await vault.start(divToken.address)
      await expect(vault.start(divToken.address)).to.be.reverted
    })
  })

  describe('Views', function () {
    this.beforeEach(async () => {
      await vault.start(divToken.address)
    })

    it('should return the token', async function () {
      expect(await vault.token()).to.be.equal(divToken.address)
    })

    it('should return the beneficiary', async function () {
      expect(await vault.beneficiary()).to.be.equal(beneficary.address)
    })

    it('should return the startBalance', async function () {
      const startBalance = await vault.startBalance()
      // convert to momos
      expect(startBalance).to.be.equal(parseEther(VAULT_START_BALANCE.toString()))
    })

    it('should return the start state', async function () {
      expect(await vault.started()).to.be.equal(true)
    })

    it('should return the retrievedTokens', async function () {
      expect(await vault.retrievedTokens()).to.be.equal(0)
    })
  })
})
