import { BigNumber } from 'ethers'
import { network } from 'hardhat'

/*
 * Calculates the amount a sender receives with respecting foundation and burn function
 */
export const calculateReceivedAmount = (amountSent: BigNumber): BigNumber =>
  amountSent
    .sub(calculateBurnAmount(amountSent))
    .sub(calculateFoundationAmount(amountSent))
    .sub(calculateCommunityAmount(amountSent))

/*
 * Calculates the amount that goes to the foundation
 */
export const calculateFoundationAmount = (amountSent: BigNumber): BigNumber =>
  amountSent.mul(0.25 * 10 ** 2).div(10 ** 4)

/*
 * Calculates the amount that goes to the foundation
 */
export const calculateCommunityAmount = (amountSent: BigNumber): BigNumber => amountSent.mul(1.0 * 10 ** 2).div(10 ** 4)

/*
 * Calculates the amount that will be burned
 */
export const calculateBurnAmount = (amountSent: BigNumber): BigNumber => amountSent.mul(1.0 * 10 ** 2).div(10 ** 4)

export const calculateStakingReward = (
  stake: BigNumber,
  intervalStart: number,
  intervalEnd: number,
  rate: BigNumber
): BigNumber => {
  return stake
    .mul(intervalEnd - intervalStart)
    .mul(rate)
    .div(10 ** 4 * 31536000)
}

/*
 * This method works like increaseTime, but takes the exact timestamp that you want in the next block, and increases the time accordingly
 */
export const setTimeAndMine = async (exactTimeStamp: number) => {
  await network.provider.send('evm_setNextBlockTimestamp', [exactTimeStamp])
  await network.provider.send('evm_mine')
}
