import { BigNumber } from '@ethersproject/bignumber'
import { parseEther } from 'ethers/lib/utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { expect } from 'chai'
import { Staking, Staking__factory, UpgradableDiversifyV1, UpgradableDiversifyV1__factory } from '../types'
import { ethers, upgrades, network } from 'hardhat'
import { calculateReceivedAmount } from './helpers/calculators'
import { daysToSeconds, getCurrentBlockTime, increaseTimeAndMine } from './helpers/time'
import { calculateStakingReward } from './helpers/calculators'

describe('Staking', function () {
  let staking: Staking
  let divToken: UpgradableDiversifyV1
  let owner: SignerWithAddress
  let staker: SignerWithAddress
  let foundation: SignerWithAddress
  let community: SignerWithAddress

  const RATE_1 = BigNumber.from('1238')
  const RATE_2 = BigNumber.from('1009')
  const RATE_3 = BigNumber.from('533')
  const STAKE_AMOUNT_1 = parseEther('1749')
  const STAKE_AMOUNT_2 = parseEther('100')
  const STAKE_AMOUNT_3 = parseEther('777')
  const PASSED_DAYS_1 = 35
  const PASSED_DAYS_2 = 74
  const PASSED_DAYS_3 = 160

  this.beforeEach(async () => {
    const [a1, a2, a3, a4] = await ethers.getSigners()
    owner = a1
    staker = a2
    foundation = a3
    community = a4

    // Deploy token
    const tokenFactory = (await ethers.getContractFactory('UpgradableDiversify_V1')) as UpgradableDiversifyV1__factory
    divToken = (await upgrades.deployProxy(tokenFactory, [
      [owner.address, staker.address],
      [1000000000, 170000],
      foundation.address,
      community.address,
    ])) as UpgradableDiversifyV1

    // Deploy staking
    const stakingFactory = (await ethers.getContractFactory('Staking')) as Staking__factory
    staking = await stakingFactory.deploy(divToken.address, RATE_1)
  })

  describe('views', function () {
    this.beforeEach(async () => {
      await divToken.increaseAllowance(staking.address, parseEther('20000'))
      await staking.fillContract(parseEther('20000'))
      await divToken.connect(staker).increaseAllowance(staking.address, STAKE_AMOUNT_1)
      await staking.connect(staker).stakeTokens(STAKE_AMOUNT_1)
      await increaseTimeAndMine(daysToSeconds(PASSED_DAYS_1))
      await staking.changeRate(RATE_2)
    })

    it('token', async function () {
      expect(await staking.token()).to.be.equal(divToken.address)
    })

    it('totalSupplyReward', async function () {
      expect(await staking.totalSupplyReward()).to.be.equal(calculateReceivedAmount(parseEther('20000')))
    })

    it('totalStakedTokens', async function () {
      expect(await staking.connect(staker).stakedAmount()).to.be.equal(calculateReceivedAmount(STAKE_AMOUNT_1))
    })

    it('rateTimestamps', async function () {
      let currentTimestamp = BigNumber.from(await getCurrentBlockTime())
      let deployTimestamp = currentTimestamp.sub(daysToSeconds(PASSED_DAYS_1)).sub(5)
      expect(await staking.rateTimestamps()).to.be.eql([deployTimestamp, currentTimestamp])
    })

    it('rateValues', async function () {
      expect(await staking.rateValues()).to.be.eql([RATE_1, RATE_2])
    })

    it('stakedAmount', async function () {
      expect(await staking.connect(staker).stakedAmount()).to.be.equal(calculateReceivedAmount(STAKE_AMOUNT_1))
    })

    it('rewardAmount', async function () {
      const reward = calculateStakingReward(calculateReceivedAmount(STAKE_AMOUNT_1), 0, PASSED_DAYS_1, RATE_1)
      expect(await staking.connect(staker).rewardAmount()).to.be.least(reward)
    })

    it('timestampStake', async function () {
      let currentTimestamp = BigNumber.from(await getCurrentBlockTime())
      let stakingTimestamp = currentTimestamp.sub(daysToSeconds(PASSED_DAYS_1)).sub(1)
      expect(await staking.connect(staker).timestampStake()).to.be.equal(stakingTimestamp)
    })
  })

  describe('fillContract', function () {
    it('should revert when amount is zero', async function () {
      await expect(staking.fillContract(parseEther('0'))).to.be.revertedWith('Amount cant be zero')
    })

    it('should revert when allowance is not set', async function () {
      await expect(staking.fillContract(STAKE_AMOUNT_1)).to.be.revertedWith('Insufficient allowance')
    })

    it('should revert when allowance is smaller than amount', async function () {
      await divToken.increaseAllowance(staking.address, parseEther('99'))
      await expect(staking.fillContract(STAKE_AMOUNT_1)).to.be.revertedWith('Insufficient allowance')
    })

    it('should emit the amount', async function () {
      await divToken.increaseAllowance(staking.address, STAKE_AMOUNT_1)
      await expect(staking.fillContract(STAKE_AMOUNT_1))
        .to.be.emit(staking, 'contractFilled')
        .withArgs(calculateReceivedAmount(STAKE_AMOUNT_1))
    })
  })

  describe('changeRate', function () {
    it('should record the timestamps and values', async function () {
      //get random blockTimes and values and call changeRate
      let blockTimes: number[] = [await getCurrentBlockTime()]
      let values: BigNumber[] = [RATE_1]

      for (let i = 0; i < 10; i++) {
        await increaseTimeAndMine(daysToSeconds(Math.floor(Math.random() * 100)))
        let value = BigNumber.from(Math.floor(Math.random() * 30 * 10 ** 2))
        // console.log('value in for loop', BigInt(value._hex))

        await staking.changeRate(value)
        values.push(value)
        blockTimes.push(await getCurrentBlockTime())
      }

      let timestampsContract = await staking.rateTimestamps()
      let valuesContract = await staking.rateValues()
      for (let i = 0; i < timestampsContract.length; i++) {
        expect(timestampsContract[i].toNumber()).to.equal(blockTimes[i])
        expect(valuesContract[i]).to.equal(values[i])
      }
    })

    it('should emit the new rate', async function () {
      await expect(staking.changeRate(RATE_2)).to.be.emit(staking, 'rateChanged').withArgs(RATE_2)
    })
  })

  describe('stakeTokens', function () {
    describe('revert statements and variable updates and emit', function () {
      this.beforeEach(async () => {
        await divToken.increaseAllowance(staking.address, parseEther('20000'))
        await staking.fillContract(parseEther('20000'))
      })

      it('should revert when amount is zero', async function () {
        await expect(staking.stakeTokens(0)).to.be.revertedWith('Amount cant be zero')
      })

      it('should revert when allowance is not set', async function () {
        await expect(staking.stakeTokens(parseEther('1749'))).to.be.revertedWith('Insufficient allowance')
      })

      it('should revert when allowance is smaller than amount', async function () {
        await divToken.increaseAllowance(staking.address, parseEther('99'))
        await expect(staking.fillContract(parseEther('1749'))).to.be.revertedWith('Insufficient allowance')
      })

      it('should update _stakedAmount', async function () {
        await divToken.connect(staker).increaseAllowance(staking.address, parseEther('1749'))
        await staking.connect(staker).stakeTokens(parseEther('1749'))
        expect(await staking.connect(staker).stakedAmount()).to.be.equal(calculateReceivedAmount(parseEther('1749')))
      })

      it('should update _timestampStake', async function () {
        await divToken.connect(staker).increaseAllowance(staking.address, parseEther('1749'))
        await staking.connect(staker).stakeTokens(parseEther('1749'))
        expect((await staking.connect(staker).timestampStake()).toNumber()).to.be.equal(await getCurrentBlockTime())
      })

      it('should emit the amount', async function () {
        await divToken.connect(staker).increaseAllowance(staking.address, parseEther('1749'))
        await expect(staking.connect(staker).stakeTokens(parseEther('1749')))
          .to.be.emit(staking, 'tokensStaked')
          .withArgs(staker.address, calculateReceivedAmount(parseEther('1749')))
      })
    })

    describe('_compound within stakeTokens', function () {
      this.beforeEach(async () => {
        await network.provider.send('evm_mine')
        await ethers.provider.send('evm_setAutomine', [false])
        await divToken.increaseAllowance(staking.address, parseEther('20000'))
        await staking.fillContract(parseEther('20000'))
        await network.provider.send('evm_mine')
      })

      this.afterAll(async () => {
        await ethers.provider.send('evm_setAutomine', [true])
      })

      it('should compound when called multiple times', async function () {
        const TIMESTAMP_1 = await getCurrentBlockTime()
        //Stake 1 (The time in the contract Method is getCurrentBlockTime after mining)
        await divToken.connect(staker).increaseAllowance(staking.address, STAKE_AMOUNT_1)
        await staking.connect(staker).stakeTokens(STAKE_AMOUNT_1)
        await network.provider.send('evm_mine') //this function pushes exactly one second / unit of time
        await increaseTimeAndMine(daysToSeconds(PASSED_DAYS_1) - 1)
        //Stake 2
        await divToken.connect(staker).increaseAllowance(staking.address, STAKE_AMOUNT_2)
        await staking.connect(staker).stakeTokens(STAKE_AMOUNT_2)
        await network.provider.send('evm_mine')
        await increaseTimeAndMine(daysToSeconds(PASSED_DAYS_2) - 1)
        //Stake 3
        await divToken.connect(staker).increaseAllowance(staking.address, STAKE_AMOUNT_3)
        await staking.connect(staker).stakeTokens(STAKE_AMOUNT_3)
        await network.provider.send('evm_mine')
        let currentStake = calculateReceivedAmount(STAKE_AMOUNT_1)
        let reward1 = calculateStakingReward(
          currentStake,
          TIMESTAMP_1,
          TIMESTAMP_1 + daysToSeconds(PASSED_DAYS_1),
          RATE_1
        )
        currentStake = currentStake.add(reward1).add(calculateReceivedAmount(STAKE_AMOUNT_2))
        let reward2 = calculateStakingReward(
          currentStake,
          TIMESTAMP_1 + daysToSeconds(PASSED_DAYS_1),
          TIMESTAMP_1 + daysToSeconds(PASSED_DAYS_1) + daysToSeconds(PASSED_DAYS_2),
          RATE_1
        )
        currentStake = currentStake.add(reward2).add(calculateReceivedAmount(STAKE_AMOUNT_3))
        expect(await staking.connect(staker).stakedAmount()).to.be.least(currentStake)
      })

      it('should compound when rate changes', async function () {
        const TIMESTAMP_1 = await getCurrentBlockTime()
        //Stake 1
        await divToken.connect(staker).increaseAllowance(staking.address, STAKE_AMOUNT_1)
        await staking.connect(staker).stakeTokens(STAKE_AMOUNT_1)
        await network.provider.send('evm_mine') //this function pushes exactly one second / unit of time
        await increaseTimeAndMine(daysToSeconds(PASSED_DAYS_1) - 1)

        await staking.changeRate(RATE_2)
        await network.provider.send('evm_mine')
        await increaseTimeAndMine(daysToSeconds(PASSED_DAYS_2) - 1)

        await staking.changeRate(RATE_3)
        await network.provider.send('evm_mine')
        await increaseTimeAndMine(daysToSeconds(PASSED_DAYS_3) - 1)

        //Stake 2
        await divToken.connect(staker).increaseAllowance(staking.address, STAKE_AMOUNT_2)
        await staking.connect(staker).stakeTokens(STAKE_AMOUNT_2)
        await network.provider.send('evm_mine')
        let currentStake = calculateReceivedAmount(STAKE_AMOUNT_1)
        let reward1 = calculateStakingReward(
          currentStake,
          TIMESTAMP_1,
          TIMESTAMP_1 + daysToSeconds(PASSED_DAYS_1),
          RATE_1
        )
        currentStake = currentStake.add(reward1)
        let reward2 = calculateStakingReward(
          calculateReceivedAmount(STAKE_AMOUNT_1),
          TIMESTAMP_1 + daysToSeconds(PASSED_DAYS_1),
          TIMESTAMP_1 + daysToSeconds(PASSED_DAYS_1) + daysToSeconds(PASSED_DAYS_2),
          RATE_2
        )
        currentStake = currentStake.add(reward2)
        let reward3 = calculateStakingReward(
          calculateReceivedAmount(STAKE_AMOUNT_1),
          TIMESTAMP_1 + daysToSeconds(PASSED_DAYS_1) + daysToSeconds(PASSED_DAYS_2),
          TIMESTAMP_1 + daysToSeconds(PASSED_DAYS_1) + daysToSeconds(PASSED_DAYS_2) + daysToSeconds(PASSED_DAYS_3),
          RATE_3
        )
        currentStake = currentStake.add(reward3).add(calculateReceivedAmount(STAKE_AMOUNT_2))
        expect(await staking.connect(staker).stakedAmount()).to.be.least(currentStake)
      })
    })
  })

  describe('compound', function () {
    describe('revert statements', async function () {
      this.beforeEach(async () => {
        await divToken.increaseAllowance(staking.address, parseEther('20000'))
        await staking.fillContract(parseEther('20000'))
      })

      it('should revert when caller does not stake', async function () {
        await expect(staking.compound()).to.be.revertedWith('Caller stakes no tokens')
      })

      it('should revert when too little time has passed', async function () {
        await divToken.connect(staker).increaseAllowance(staking.address, STAKE_AMOUNT_1)
        await staking.connect(staker).stakeTokens(STAKE_AMOUNT_1)
        await expect(staking.connect(staker).compound()).to.be.revertedWith('Compounding only every 10 minutes')
      })

      it('should revert when reward is greater than _totalSupplyReward', async function () {
        await divToken.connect(staker).increaseAllowance(staking.address, parseEther('170000'))
        await staking.connect(staker).stakeTokens(parseEther('170000'))
        await increaseTimeAndMine(daysToSeconds(365))
        await expect(staking.connect(staker).compound()).to.be.revertedWith('Contract has not enough tokens left')
      })
    })

    describe('_compound within compound', function () {
      describe('_totalStakedTokens update', function () {
        this.beforeEach(async () => {
          await network.provider.send('evm_mine')
          await ethers.provider.send('evm_setAutomine', [false])

          await divToken.increaseAllowance(staking.address, parseEther('20000'))
          await staking.fillContract(parseEther('20000'))

          await divToken.connect(staker).increaseAllowance(staking.address, STAKE_AMOUNT_1)
          await staking.connect(staker).stakeTokens(STAKE_AMOUNT_1)

          await network.provider.send('evm_mine')
        })

        it('should compute the correct reward when rate does not change', async function () {
          await increaseTimeAndMine(daysToSeconds(PASSED_DAYS_1) - 1)
          await staking.connect(staker).compound()
          await network.provider.send('evm_mine')
          expect(await staking.connect(staker).stakedAmount()).to.be.least(
            calculateReceivedAmount(STAKE_AMOUNT_1).add(
              calculateStakingReward(calculateReceivedAmount(STAKE_AMOUNT_1), 0, daysToSeconds(PASSED_DAYS_1), RATE_1)
            )
          )
        })

        it('should compute the correct reward when rate does change', async function () {
          await increaseTimeAndMine(daysToSeconds(PASSED_DAYS_1) - 1)
          await staking.changeRate(RATE_2)
          await network.provider.send('evm_mine')

          await increaseTimeAndMine(daysToSeconds(PASSED_DAYS_2) - 1)
          await staking.connect(staker).compound()
          await network.provider.send('evm_mine')

          expect(await staking.connect(staker).stakedAmount()).to.be.least(
            calculateReceivedAmount(STAKE_AMOUNT_1)
              .add(
                calculateStakingReward(calculateReceivedAmount(STAKE_AMOUNT_1), 0, daysToSeconds(PASSED_DAYS_1), RATE_1)
              )
              .add(
                calculateStakingReward(calculateReceivedAmount(STAKE_AMOUNT_1), 0, daysToSeconds(PASSED_DAYS_2), RATE_2)
              )
          )
        })
      })

      describe('Variable updates', function () {
        this.beforeEach(async () => {
          await network.provider.send('evm_mine')
          await ethers.provider.send('evm_setAutomine', [false])

          await divToken.increaseAllowance(staking.address, parseEther('20000'))
          await staking.fillContract(parseEther('20000'))

          await divToken.connect(staker).increaseAllowance(staking.address, STAKE_AMOUNT_1)
          await staking.connect(staker).stakeTokens(STAKE_AMOUNT_1)
          await network.provider.send('evm_mine')

          await increaseTimeAndMine(daysToSeconds(PASSED_DAYS_1) - 1)
          await staking.connect(staker).compound()
          await network.provider.send('evm_mine')
        })

        this.afterAll(async () => {
          await ethers.provider.send('evm_setAutomine', [true])
        })

        it('should update _totalSupplyReward', async function () {
          expect(await staking.totalSupplyReward()).to.be.most(
            calculateReceivedAmount(parseEther('20000')).sub(
              calculateStakingReward(calculateReceivedAmount(STAKE_AMOUNT_1), 0, daysToSeconds(PASSED_DAYS_1), RATE_1)
            )
          )
        })

        it('should update _stakedAmount[_msgSender()]', async function () {
          expect(await staking.totalStakedTokens()).to.be.least(
            calculateReceivedAmount(calculateReceivedAmount(STAKE_AMOUNT_1)).add(
              calculateStakingReward(calculateReceivedAmount(STAKE_AMOUNT_1), 0, daysToSeconds(PASSED_DAYS_1), RATE_1)
            )
          )
        })

        it('should update _stakedAmount[_msgSender()]', async function () {
          expect(await staking.connect(staker).stakedAmount()).to.be.least(
            calculateReceivedAmount(STAKE_AMOUNT_1).add(
              calculateStakingReward(calculateReceivedAmount(STAKE_AMOUNT_1), 0, daysToSeconds(PASSED_DAYS_1), RATE_1)
            )
          )
        })

        it('should update _timestampStake[_msgSender()]', async function () {
          expect(await staking.connect(staker).timestampStake()).to.be.equal(await getCurrentBlockTime())
        })
      })
    })
  })

  describe('withdrawTokens', function () {
    this.beforeEach(async () => {
      await divToken.increaseAllowance(staking.address, parseEther('20000'))
      await staking.fillContract(parseEther('20000'))

      await divToken.connect(staker).increaseAllowance(staking.address, STAKE_AMOUNT_1)
      await staking.connect(staker).stakeTokens(STAKE_AMOUNT_1)
    })

    it('should revert when no tokens are staked', async function () {
      await expect(staking.withdrawTokens(0)).to.be.revertedWith('No tokens to withdraw')
    })

    it('should revert when withdraw amount is too big', async function () {
      await expect(staking.connect(staker).withdrawTokens(parseEther('2000'))).to.be.revertedWith(
        'Not enough tokens to withdraw'
      )
    })

    it('should update _stakedAmount[_msgSender()] when all tokens are withdrawn', async function () {
      await staking.connect(staker).withdrawTokens(0)
      expect(await staking.connect(staker).stakedAmount()).to.be.equal(0)
    })

    it('should update _stakedAmount[_msgSender()] when not all tokens are withdrawn', async function () {
      const TOKENS_TO_WITHDRAW = parseEther('1000')
      expect(await staking.connect(staker).stakedAmount()).to.be.at.least(
        calculateReceivedAmount(STAKE_AMOUNT_1).sub(TOKENS_TO_WITHDRAW)
      )
    })

    it('should transfere tokens from contract to caller', async function () {
      const DIV_BALANCE_STAKING_CONTRACT_BEFORE = await divToken.balanceOf(staking.address)
      const DIV_BALANCE_STAKER_BEFORE = await divToken.balanceOf(staker.address)
      await staking.connect(staker).withdrawTokens(0)
      const DIV_BALANCE_STAKING_CONTRACT_AFTER = await divToken.balanceOf(staking.address)
      const DIV_BALANCE_STAKER_AFTER = await divToken.balanceOf(staker.address)

      expect(
        calculateReceivedAmount(DIV_BALANCE_STAKING_CONTRACT_BEFORE.sub(DIV_BALANCE_STAKING_CONTRACT_AFTER))
      ).to.equal(DIV_BALANCE_STAKER_AFTER.sub(DIV_BALANCE_STAKER_BEFORE))
    })

    it('should update _totalStakedTokens', async function () {
      const TOTALSTAKEDTOKENS_BEFORE = await staking.totalStakedTokens()
      await staking.connect(staker).withdrawTokens(0)
      const TOTALSTAKEDTOKENS_AFTER = await staking.totalStakedTokens()

      expect(TOTALSTAKEDTOKENS_BEFORE.sub(TOTALSTAKEDTOKENS_AFTER)).to.be.equal(calculateReceivedAmount(STAKE_AMOUNT_1))
    })

    it('should emit the address and withdraw amount', async function () {
      await expect(staking.connect(staker).withdrawTokens(0))
        .to.be.emit(staking, 'tokensWithdrawn')
        .withArgs(
          staker.address,
          calculateReceivedAmount(STAKE_AMOUNT_1).add(
            calculateStakingReward(calculateReceivedAmount(STAKE_AMOUNT_1), 0, 1, RATE_1)
          )
        )
    })
  })

  describe('retrieveTokens', function () {
    it('should be restricted to owner', async function () {
      await expect(staking.connect(staker).retrieveTokens(staker.address, divToken.address)).to.be.reverted
    })

    it('should retrieve DIV', async function () {
      await divToken.increaseAllowance(staking.address, parseEther('20000'))
      await staking.fillContract(parseEther('20000'))

      const DIV_BALANCE_BEFORE = await divToken.balanceOf(owner.address)
      await staking.retrieveTokens(owner.address, divToken.address)
      const DIV_BALANCE_AFTER = await divToken.balanceOf(owner.address)

      expect(DIV_BALANCE_AFTER.sub(DIV_BALANCE_BEFORE)).to.equal(
        calculateReceivedAmount(calculateReceivedAmount(parseEther('20000')))
      )
    })

    it('should retrieve alien Token', async function () {
      const initialAmount = 300000
      const alienTokenFactory = (await ethers.getContractFactory(
        'UpgradableDiversify_V1'
      )) as UpgradableDiversifyV1__factory
      let alienToken = (await upgrades.deployProxy(alienTokenFactory, [
        [owner.address, staker.address],
        [45000000, initialAmount],
        foundation.address,
        community.address,
      ])) as UpgradableDiversifyV1

      await alienToken.connect(staker).transfer(staking.address, parseEther(initialAmount.toString()))
      await staking.retrieveTokens(staker.address, alienToken.address)

      expect(await alienToken.balanceOf(staker.address)).to.be.equal(
        calculateReceivedAmount(calculateReceivedAmount(parseEther(initialAmount.toString())))
      )
    })
  })
})
