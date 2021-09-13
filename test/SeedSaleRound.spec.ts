import { parseEther } from '@ethersproject/units'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { ethers, upgrades } from 'hardhat'
import moment from 'moment'
import { SeedSaleRound__factory } from '../typechain/factories/SeedSaleRound__factory'
import { UpgradableDiversifyV1__factory } from '../typechain/factories/UpgradableDiversifyV1__factory'
import { SeedSaleRound } from '../typechain/SeedSaleRound'
import { UpgradableDiversifyV1 } from '../typechain/UpgradableDiversifyV1'
import { daysToSeconds, increaseTimeAndMine } from './helpers/time'
describe('SeedSaleRound', function () {
  let divToken: UpgradableDiversifyV1
  let addr1: SignerWithAddress // owner Wallet
  let addr2: SignerWithAddress
  let addr3: SignerWithAddress
  let beneficiary: SignerWithAddress
  let seedSaleRound: SeedSaleRound
  const SEED_SALE_DURATION = daysToSeconds(10)
  const SEED_SALE_LOCKING_PERIOD = daysToSeconds(360)
  const SEED_SALE_START_DATE = moment().add(1, 'd').unix()
  const SEED_SALE_RATE = 200
  const SEED_SALE_WEI_GOAL = parseEther('10')
  const SEED_SALE_TOTAL_SUPPLY = 100000 // divs

  const seedSaleSetup = async () =>
    await seedSaleRound.setup(
      beneficiary.address,
      SEED_SALE_START_DATE,
      SEED_SALE_DURATION,
      SEED_SALE_LOCKING_PERIOD,
      SEED_SALE_RATE,
      SEED_SALE_WEI_GOAL,
      divToken.address
    )

  this.beforeEach(async () => {
    const [a1, a2, a3, a4] = await ethers.getSigners()
    addr1 = a1
    addr2 = a2
    addr3 = a3
    beneficiary = a4

    // Deploy seedsale round
    const seedSaleRoundFactory = (await ethers.getContractFactory('SeedSaleRound')) as SeedSaleRound__factory
    seedSaleRound = await seedSaleRoundFactory.deploy()

    // Deploy token
    const tokenFactory = (await ethers.getContractFactory('UpgradableDiversify_V1')) as UpgradableDiversifyV1__factory
    divToken = (await upgrades.deployProxy(tokenFactory, [
      [addr1.address, seedSaleRound.address],
      [1000000000, SEED_SALE_TOTAL_SUPPLY],
      addr3.address,
    ])) as UpgradableDiversifyV1
  })

  describe('Setup', function () {
    it('should revert when called from other than owner', async function () {
      await expect(
        seedSaleRound
          .connect(addr2.address)
          .setup(
            beneficiary.address,
            SEED_SALE_START_DATE,
            SEED_SALE_DURATION,
            SEED_SALE_LOCKING_PERIOD,
            SEED_SALE_RATE,
            SEED_SALE_WEI_GOAL,
            divToken.address
          )
      ).to.be.reverted
    })

    it('should initialize correctly and raise event', async function () {
      await expect(seedSaleSetup())
        .to.emit(seedSaleRound, 'Setup')
        .withArgs(
          SEED_SALE_START_DATE,
          SEED_SALE_RATE,
          SEED_SALE_WEI_GOAL,
          parseEther(SEED_SALE_TOTAL_SUPPLY.toString()),
          SEED_SALE_DURATION,
          SEED_SALE_LOCKING_PERIOD
        )
    })

    it('should revert when setup was done', async function () {
      await seedSaleSetup()
      await expect(seedSaleSetup()).to.be.revertedWith('Seed already started')
    })
  })

  describe('Views', function () {
    this.beforeEach(async () => {
      await seedSaleSetup()
    })

    it('should return the seedsale token', async function () {
      expect(await seedSaleRound.token()).to.be.equal(divToken.address)
    })

    it('should return the beneficiary', async function () {
      expect(await seedSaleRound.beneficiary()).to.be.equal(beneficiary.address)
    })

    it('should return the rate', async function () {
      expect(await seedSaleRound.rate()).to.be.equal(SEED_SALE_RATE)
    })

    it('should return the total supply', async function () {
      expect(await seedSaleRound.totalSupply()).to.be.equal(parseEther(SEED_SALE_TOTAL_SUPPLY.toString()))
    })

    it('should return the balance of a given address', async function () {
      // Arrange
      expect(await seedSaleRound.balanceOf(addr1.address)).to.be.equal(0)
    })
  })

  describe('Buy Tokens', function () {
    describe('When seedsale state: setup', function () {
      it('should revert ', async function () {
        await expect(seedSaleRound.buyTokens({ value: 500 })).to.be.revertedWith('SeedSale not ready')
      })
    })

    describe('When seedsale state: ready or active', function () {
      this.beforeEach(async () => {
        await seedSaleSetup()
      })

      it('should revert when not started ', async function () {
        await expect(seedSaleRound.buyTokens({ value: 500 })).to.be.revertedWith('SeedSale not started')
      })

      it('should buy tokens and update balance', async function () {
        // Arrange
        const weiAmountToBuy = 5000
        await increaseTimeAndMine(daysToSeconds(1))
        await seedSaleRound.connect(addr2).buyTokens({ value: weiAmountToBuy })
        expect(await seedSaleRound.balanceOf(addr2.address)).to.be.equal(weiAmountToBuy * SEED_SALE_RATE)
      })

      it('should revert when time is over', async function () {
        // Arrange
        const weiAmountToBuy = 5000
        await increaseTimeAndMine(SEED_SALE_DURATION)
        await expect(seedSaleRound.connect(addr2).buyTokens({ value: weiAmountToBuy })).to.be.revertedWith(
          'End duration reached'
        )
      })
    })
  })
})
