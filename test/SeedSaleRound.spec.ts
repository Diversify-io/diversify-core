import { BigNumber } from '@ethersproject/bignumber'
import { parseEther } from '@ethersproject/units'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { BigNumberish } from 'ethers'
import { ethers, upgrades } from 'hardhat'
import moment from 'moment'
import { SeedSaleRound, SeedSaleRound__factory, UpgradableDiversifyV1, UpgradableDiversifyV1__factory } from '../types'
import { calculateReceivedAmount } from './helpers/calculators'
import { ADDRESS_0 } from './helpers/constants'
import { daysToSeconds, getCurrentBlockTime, increaseTimeAndMine } from './helpers/time'

describe('SeedSaleRound', function () {
  let divToken: UpgradableDiversifyV1
  let addr1: SignerWithAddress // owner Wallet
  let addr2: SignerWithAddress
  let addr3: SignerWithAddress
  let beneficiary: SignerWithAddress
  let seedSaleRound: SeedSaleRound
  const SEED_SALE_DURATION = daysToSeconds(10)
  const SEED_SALE_LOCKING_PERIOD = daysToSeconds(360)
  const SEED_SALE_RATE = 200
  const SEED_SALE_WEI_GOAL = parseEther('10')
  const SEED_SALE_MIN_WEI_AMOUNT = 0
  const SEED_SALE_MAX_WEI_AMOUNT = 0
  const SEED_SALE_TOTAL_SUPPLY = 100000 // divs

  const seedSaleSetup = async (
    beneficiary_?: string,
    startDate_?: BigNumberish,
    duration_?: BigNumberish,
    lockingPeriod_?: BigNumberish,
    rate_?: BigNumberish,
    weiGoal_?: BigNumberish,
    weiMinTransactionLimit_?: BigNumberish,
    weiMaxInvestmentLimit_?: BigNumberish
  ) => {
    const seedSaleStartDate = moment
      .unix(await getCurrentBlockTime())
      .add('1', 'd')
      .unix()

    await seedSaleRound.setup(
      beneficiary_ ?? beneficiary.address,
      startDate_ ?? seedSaleStartDate,
      duration_ ?? SEED_SALE_DURATION,
      lockingPeriod_ ?? SEED_SALE_LOCKING_PERIOD,
      rate_ ?? SEED_SALE_RATE,
      weiGoal_ ?? SEED_SALE_WEI_GOAL,
      weiMinTransactionLimit_ ?? SEED_SALE_MIN_WEI_AMOUNT,
      weiMaxInvestmentLimit_ ?? SEED_SALE_MAX_WEI_AMOUNT,
      divToken.address
    )
  }

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
      [10000000000000, SEED_SALE_TOTAL_SUPPLY],
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
            await getCurrentBlockTime(),
            SEED_SALE_DURATION,
            SEED_SALE_LOCKING_PERIOD,
            SEED_SALE_RATE,
            SEED_SALE_WEI_GOAL,
            SEED_SALE_MIN_WEI_AMOUNT,
            SEED_SALE_MAX_WEI_AMOUNT,
            divToken.address
          )
      ).to.be.reverted
    })

    it('should revert when beneficary not specified', async function () {
      await expect(
        seedSaleRound.setup(
          ADDRESS_0,
          await getCurrentBlockTime(),
          SEED_SALE_DURATION,
          SEED_SALE_LOCKING_PERIOD,
          SEED_SALE_RATE,
          SEED_SALE_WEI_GOAL,
          SEED_SALE_MIN_WEI_AMOUNT,
          SEED_SALE_MAX_WEI_AMOUNT,
          divToken.address
        )
      ).to.be.revertedWith('Beneficary not specified')
    })

    it('should revert when duration is zero', async function () {
      await expect(
        seedSaleRound.setup(
          beneficiary.address,
          await getCurrentBlockTime(),
          0,
          SEED_SALE_LOCKING_PERIOD,
          SEED_SALE_RATE,
          SEED_SALE_WEI_GOAL,
          SEED_SALE_MIN_WEI_AMOUNT,
          SEED_SALE_MAX_WEI_AMOUNT,
          divToken.address
        )
      ).to.be.revertedWith('Duration needs to be bigger than 0')
    })

    it('should revert when token not set', async function () {
      await expect(
        seedSaleRound.setup(
          beneficiary.address,
          await getCurrentBlockTime(),
          SEED_SALE_DURATION,
          SEED_SALE_LOCKING_PERIOD,
          SEED_SALE_RATE,
          SEED_SALE_WEI_GOAL,
          SEED_SALE_MIN_WEI_AMOUNT,
          SEED_SALE_MAX_WEI_AMOUNT,
          ADDRESS_0
        )
      ).to.be.revertedWith('Token must be set')
    })

    it('should revert when contract owns no token', async function () {
      const alienFactory = (await ethers.getContractFactory('UpgradableDiversify_V1')) as UpgradableDiversifyV1__factory
      const initalAmount = 2000000000

      const alienToken = (await upgrades.deployProxy(alienFactory, [
        [addr2.address],
        [initalAmount],
        addr3.address,
      ])) as UpgradableDiversifyV1

      await expect(
        seedSaleRound.setup(
          beneficiary.address,
          await getCurrentBlockTime(),
          SEED_SALE_DURATION,
          SEED_SALE_LOCKING_PERIOD,
          SEED_SALE_RATE,
          SEED_SALE_WEI_GOAL,
          SEED_SALE_MIN_WEI_AMOUNT,
          SEED_SALE_MAX_WEI_AMOUNT,
          alienToken.address
        )
      ).to.be.revertedWith('Seedsale has no amount for the given token')
    })

    it('should revert when rate not set', async function () {
      await expect(
        seedSaleRound.setup(
          beneficiary.address,
          await getCurrentBlockTime(),
          SEED_SALE_DURATION,
          SEED_SALE_LOCKING_PERIOD,
          0,
          SEED_SALE_WEI_GOAL,
          SEED_SALE_MIN_WEI_AMOUNT,
          SEED_SALE_MAX_WEI_AMOUNT,
          divToken.address
        )
      ).to.be.revertedWith('Rate needs to be bigger than 0')
    })

    it('should revert when goal not set', async function () {
      await expect(
        seedSaleRound.setup(
          beneficiary.address,
          await getCurrentBlockTime(),
          SEED_SALE_DURATION,
          SEED_SALE_LOCKING_PERIOD,
          SEED_SALE_RATE,
          0,
          SEED_SALE_MIN_WEI_AMOUNT,
          SEED_SALE_MAX_WEI_AMOUNT,
          divToken.address
        )
      ).to.be.revertedWith('Goal needs to be bigger than 0')
    })

    it('should initialize correctly and raise event', async function () {
      const seedSaleStart = await getCurrentBlockTime()

      await expect(
        seedSaleRound.setup(
          beneficiary.address,
          seedSaleStart,
          SEED_SALE_DURATION,
          SEED_SALE_LOCKING_PERIOD,
          SEED_SALE_RATE,
          SEED_SALE_WEI_GOAL,
          SEED_SALE_MIN_WEI_AMOUNT,
          SEED_SALE_MAX_WEI_AMOUNT,
          divToken.address
        )
      )
        .to.emit(seedSaleRound, 'Setup')
        .withArgs(
          seedSaleStart,
          SEED_SALE_RATE,
          SEED_SALE_WEI_GOAL,
          SEED_SALE_MIN_WEI_AMOUNT,
          SEED_SALE_MAX_WEI_AMOUNT,
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

    describe('When seedsale ready and startdate not passed', function () {
      this.beforeEach(async () => {
        await seedSaleSetup()
      })

      it('should revert when startdate not passed ', async function () {
        await expect(seedSaleRound.buyTokens({ value: 500 })).to.be.revertedWith('SeedSale not started')
      })
    })
    describe('When seedsale started ', function () {
      this.beforeEach(async () => {
        await seedSaleSetup(undefined, undefined, undefined, undefined, undefined, undefined, 300, 1000)
        await increaseTimeAndMine(daysToSeconds(1))
      })

      it('should revert if zero amount', async function () {
        await expect(seedSaleRound.buyTokens({ value: 0 })).to.be.revertedWith('Wei amount cant be zero')
      })

      it('should revert if amount below min buy limit', async function () {
        await expect(seedSaleRound.buyTokens({ value: 200 })).to.be.revertedWith(
          'Transaction doesnt reach minTransactionLimit'
        )
      })

      it('should revert if over max investment limit', async function () {
        await expect(seedSaleRound.buyTokens({ value: 1001 })).to.be.revertedWith(
          'Transaction exceeds investment limit!'
        )
      })

      it('should revert if amount overreaches total supply', async function () {
        await expect(seedSaleRound.buyTokens({ value: parseEther('800') })).to.be.revertedWith(
          'Transaction overeaches totalSupply'
        )
      })

      it('should buy max token amount, update balance and emit event', async function () {
        // Arrange
        const weiAmountToBuy = 1000
        await expect(seedSaleRound.connect(addr2).buyTokens({ value: weiAmountToBuy }))
          .to.be.emit(seedSaleRound, 'TokenPurchased')
          .withArgs(addr2.address, weiAmountToBuy, weiAmountToBuy * SEED_SALE_RATE)
        expect(await seedSaleRound.balanceOf(addr2.address)).to.be.equal(weiAmountToBuy * SEED_SALE_RATE)
      })

      it('should buy continously until max amount and revert', async function () {
        await expect(seedSaleRound.connect(addr2).buyTokens({ value: 500 }))
          .to.be.emit(seedSaleRound, 'TokenPurchased')
          .withArgs(addr2.address, 500, 500 * SEED_SALE_RATE)
        await expect(seedSaleRound.connect(addr2).buyTokens({ value: 500 }))
          .to.be.emit(seedSaleRound, 'TokenPurchased')
          .withArgs(addr2.address, 500, 500 * SEED_SALE_RATE)
        expect(await seedSaleRound.balanceOf(addr2.address)).to.be.equal(1000 * SEED_SALE_RATE)
        await expect(seedSaleRound.connect(addr2).buyTokens({ value: 500 })).to.be.revertedWith(
          'Transaction exceeds investment limit!'
        )
      })
    })

    describe('When seedsale over', function () {
      this.beforeEach(async () => {
        await seedSaleSetup()
        await increaseTimeAndMine(daysToSeconds(1))
        await increaseTimeAndMine(SEED_SALE_DURATION)
      })
      it('should revert', async function () {
        const weiAmountToBuy = 5000
        await expect(seedSaleRound.connect(addr2).buyTokens({ value: weiAmountToBuy })).to.be.revertedWith(
          'End duration reached'
        )
      })
    })

    describe('When seedsale closed', function () {
      this.beforeEach(async () => {
        await seedSaleSetup()
        await increaseTimeAndMine(daysToSeconds(1))
        await increaseTimeAndMine(SEED_SALE_DURATION)
        await seedSaleRound.close()
      })
      it('should revert', async function () {
        const weiAmountToBuy = 5000
        await expect(seedSaleRound.connect(addr2).buyTokens({ value: weiAmountToBuy })).to.be.revertedWith(
          'SeedSale not active'
        )
      })
    })
  })

  describe('Close', function () {
    this.beforeEach(async () => {
      await seedSaleSetup()
    })

    it('should revert when called from other than owner', async function () {
      await expect(seedSaleRound.connect(addr2.address).close()).to.be.reverted
    })

    describe('When seedsale is ongoing', function () {
      it('should revert', async function () {
        await expect(seedSaleRound.close()).to.be.revertedWith('End duration not reached')
      })
    })

    describe('When seedsale goal failed', function () {
      this.beforeEach(async () => {
        await increaseTimeAndMine(daysToSeconds(1))
        await increaseTimeAndMine(SEED_SALE_DURATION)
      })
      it('should enable refunds and emit event when goal not reached', async function () {
        await expect(seedSaleRound.close()).to.be.emit(seedSaleRound, 'RefundsEnabled')
      })

      it('should revert when reclosing', async function () {
        await seedSaleRound.close()
        await expect(seedSaleRound.close()).to.be.revertedWith('Seedsale needs to be active state')
      })
    })
    describe('When seedsale goal reached', function () {
      this.beforeEach(async () => {
        await increaseTimeAndMine(daysToSeconds(1))
        await seedSaleRound.connect(addr2).buyTokens({ value: SEED_SALE_WEI_GOAL })
        await increaseTimeAndMine(SEED_SALE_DURATION)
      })
      it('should close correctly and emit event', async function () {
        const beneficaryBalanceBefore = await beneficiary.getBalance()
        const amountToBurn = parseEther(SEED_SALE_TOTAL_SUPPLY.toString()).sub(SEED_SALE_WEI_GOAL.mul(SEED_SALE_RATE))
        await expect(seedSaleRound.close()).to.be.emit(seedSaleRound, 'Closed') // Check for event
        expect(await beneficiary.getBalance()).to.be.equal(beneficaryBalanceBefore.add(SEED_SALE_WEI_GOAL)) // Transfer
        expect(await divToken.amountBurned()).to.be.equal(amountToBurn) // Burn
      })
    })
  })

  describe('claimRefund', function () {
    this.beforeEach(async () => {
      await seedSaleSetup()
    })
    it('should revert when not refunding', async function () {
      await expect(seedSaleRound.claimRefund(addr1.address)).to.be.revertedWith('Refunding disabled')
    })

    it('should claim refund when enabled', async function () {
      const transferredAmount = SEED_SALE_WEI_GOAL.div(2)
      await increaseTimeAndMine(daysToSeconds(1))
      await seedSaleRound.connect(addr2).buyTokens({ value: transferredAmount })

      await increaseTimeAndMine(SEED_SALE_DURATION)
      await expect(seedSaleRound.close()).to.be.emit(seedSaleRound, 'RefundsEnabled')

      const accountBalanceAfterBuy = await addr2.getBalance()

      await expect(seedSaleRound.connect(addr2).claimRefund(addr2.address))
        .to.be.emit(seedSaleRound, 'Refunded')
        .withArgs(addr2.address, transferredAmount)

      expect(await addr2.getBalance()).to.be.gt(accountBalanceAfterBuy)
    })
  })

  describe('retrieveFreezedTokens', function () {
    this.beforeEach(async () => {
      await seedSaleSetup()
    })

    describe('When seedsale not closed', function () {
      it('should revert', async function () {
        await expect(seedSaleRound.retrieveFreezedTokens()).to.be.revertedWith('Sale not closed')
      })
    })

    describe('When seedsale closed', function () {
      this.beforeEach(async () => {
        await increaseTimeAndMine(daysToSeconds(1))
        await seedSaleRound.connect(addr2).buyTokens({ value: SEED_SALE_WEI_GOAL })
        await increaseTimeAndMine(SEED_SALE_DURATION)
        await seedSaleRound.close()
      })

      it('should revert when locking period not over', async function () {
        await expect(seedSaleRound.retrieveFreezedTokens()).to.be.revertedWith('Seed locking period not ended')
      })

      it('should retrieve tokens when locking is over', async function () {
        await increaseTimeAndMine(SEED_SALE_LOCKING_PERIOD)
        const balanceBefore = await divToken.balanceOf(addr2.address)
        await seedSaleRound.connect(addr2).retrieveFreezedTokens()
        const balanceAfterFirstCollect = await divToken.balanceOf(addr2.address)
        expect(balanceAfterFirstCollect).to.be.gt(balanceBefore)
        await seedSaleRound.connect(addr2).retrieveFreezedTokens()
        expect(await divToken.balanceOf(addr2.address)).to.be.eq(balanceAfterFirstCollect)
      })
    })
  })

  describe('retrieveTokens', function () {
    let alienToken: UpgradableDiversifyV1
    let transferredAmount: BigNumber
    this.beforeEach(async () => {
      // Arrange
      const alienFactory = (await ethers.getContractFactory('UpgradableDiversify_V1')) as UpgradableDiversifyV1__factory
      const initalAmount = 2000000000
      transferredAmount = calculateReceivedAmount(BigNumber.from(initalAmount))

      alienToken = (await upgrades.deployProxy(alienFactory, [
        [seedSaleRound.address, addr2.address],
        [initalAmount, initalAmount],
        addr3.address,
      ])) as UpgradableDiversifyV1

      await seedSaleSetup()
    })

    it('should be restricted to owner', async function () {
      await expect(seedSaleRound.connect(beneficiary).retrieveTokens(beneficiary.address, divToken.address)).to.be
        .reverted
    })

    it('should revert if seedsale token', async function () {
      await expect(seedSaleRound.retrieveTokens(beneficiary.address, divToken.address)).to.be.revertedWith(
        'You should only use this method to withdraw extraneous tokens.'
      )
    })

    it('should revert when called from other than owner', async function () {
      await expect(seedSaleRound.connect(addr2.address).retrieveTokens(beneficiary.address, alienToken.address)).to.be
        .reverted
    })

    it('should revert if not beneficary', async function () {
      await expect(seedSaleRound.retrieveTokens(addr2.address, alienToken.address)).to.be.revertedWith(
        'You can only transfer tokens to the beneficiary'
      )
    })

    it('should retrieve alien tokens', async function () {
      await seedSaleRound.retrieveTokens(beneficiary.address, alienToken.address)
      expect(await alienToken.balanceOf(seedSaleRound.address)).to.be.equals(0)
      expect(await alienToken.balanceOf(beneficiary.address)).to.be.equals(parseEther(transferredAmount.toString()))
    })
  })

  describe('retrieveETH branches', function () {
    this.beforeEach(async () => {
      await seedSaleSetup()
    })

    it('should be restricted to owner', async function () {
      await expect(seedSaleRound.connect(beneficiary).retrieveETH(beneficiary.address)).to.be.reverted
    })

    it('should revert when seedsale not closed', async function () {
      await expect(seedSaleRound.retrieveETH(beneficiary.address)).to.be.revertedWith('Only allowed when closed')
    })

    it('should revert when seedsale refunding', async function () {
      await increaseTimeAndMine(daysToSeconds(1))
      await increaseTimeAndMine(SEED_SALE_DURATION)
      await seedSaleRound.close()
      await expect(seedSaleRound.retrieveETH(beneficiary.address)).to.be.revertedWith('Only allowed when closed')
    })

    it('should revert if not beneficary', async function () {
      await increaseTimeAndMine(daysToSeconds(1))
      await seedSaleRound.connect(addr2).buyTokens({ value: SEED_SALE_WEI_GOAL })
      await increaseTimeAndMine(SEED_SALE_DURATION)
      await seedSaleRound.close()
      await expect(seedSaleRound.retrieveETH(addr2.address)).to.be.revertedWith(
        'You can only transfer tokens to the beneficiary'
      )
    })
  })
})
