import { BigNumber } from 'ethers'

/*
 * Calculates the amount a sender receives with respecting foundation and burn function
 */
export const calculateReceivedAmount = (amountSent: BigNumber): BigNumber =>
  amountSent.sub(calculateBurnAmount(amountSent)).sub(calculateFoundationAmount(amountSent))

export const calculateFoundationAmount = (amountSent: BigNumber): BigNumber =>
  amountSent.mul(0.25 * 10 ** 2).div(10 ** 4)

export const calculateBurnAmount = (amountSent: BigNumber): BigNumber => amountSent.mul(1.0 * 10 ** 2).div(10 ** 4)
