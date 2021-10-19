import chalk from 'chalk'
import { Contract, ContractFactory, Overrides, utils } from 'ethers'
import fs from 'fs'
import hre, { config, ethers, upgrades } from 'hardhat'
import path from 'path'
import { Ownable } from '../types/Ownable.d'
type ThenArg<T> = T extends PromiseLike<infer U> ? U : T
type InitalizeArgs<T extends ContractFactory> = Parameters<ThenArg<ReturnType<T['deploy']>>['initialize']>

type ContractAdresses = {
  [network: string]: {
    [contract: string]: {
      address: string
      owner?: string
      args?: any[]
    }
  }
}

function getContractAdressesPath(): string {
  return `../contract-addresses${['hardhat', 'localhost'].includes(hre.network.name) ? '.dev' : ''}.json`
}

/**
 * Get the stored contract addresses
 * @returns
 */
function getSavedContractAddresses(): ContractAdresses {
  let json
  try {
    json = fs.readFileSync(path.join(__dirname, getContractAdressesPath()), 'utf-8')
  } catch (err) {
    json = '{}'
  }
  const addrs: ContractAdresses = JSON.parse(json)
  return addrs
}

/**
 * Save the contrac
 * @param network
 * @param contract
 * @param address
 * @param owner
 * @param args
 */
function saveContractAddress(network: string, contract: string, address: string, owner?: string, args?: any[]) {
  const addrs = getSavedContractAddresses()
  addrs[network] = addrs[network] || {}
  addrs[network][contract] = {
    ...addrs[network][contract],
    ...(address && { address: address }),
    ...(owner && { owner: owner }),
    ...(args && { args: args }),
  }
  fs.writeFileSync(path.join(__dirname, getContractAdressesPath()), JSON.stringify(addrs, null, '    '))
}

/**
 * getContractFactory
 * @param contractName
 * @returns
 */
const getContractFactory = async <T extends ContractFactory>(contractName: string) =>
  (await ethers.getContractFactory(contractName)) as T

/**
 * TypeSafe contract deployment
 * @param name
 * @param contract
 * @param args
 * @returns
 */
const deployContract = async <T extends ContractFactory>(
  name: string,
  contract: T,
  ...args: Parameters<T['deploy']>
): Promise<ReturnType<T['deploy']>> => {
  console.log(` 🛰  Deploying: ${name}`)
  const deployment = await contract.deploy(...args)
  await postDeploy(name, deployment, [...args])
  return deployment
}

/**
 * TypeSafe Proxy Deployment  with logging
 * @param name
 * @param contract
 * @param args
 * @returns
 */
const deployProxy = async <T extends ContractFactory>(
  name: string,
  contract: T,
  ...args: InitalizeArgs<T> extends { overrides?: Overrides & { from?: string | Promise<string> } }
    ? [undefined?]
    : InitalizeArgs<T>
): Promise<ReturnType<T['deploy']>> => {
  console.log(` 🛰  Deploying proxy: ${name}`)
  const deployment = await upgrades.deployProxy(contract, args)
  await postDeploy(name, deployment, [...args])
  return deployment
}

/**
 * Type safe ownership transfer with logging
 * @param name
 * @param contract
 * @param newOwner
 */
const transferOwnership = async <T extends Ownable>(name: string, contract: T, newOwner: string) => {
  console.log(` 👮 Transfering ownership: ${name}`)
  await contract.transferOwnership(newOwner)
  saveContractAddress(hre.network.name, name, contract.address, newOwner)
  console.log(' 🔐', chalk.cyan(name), 'ownership transferred to:', chalk.magenta(newOwner))
}

/**
 * Post deployment actions
 * @param name ContractName
 * @param deployment Contract deployment instance
 * @param args The contracts constructor passed arguments
 */
const postDeploy = async (name: string, deployment: Contract, args: any[]) => {
  await deployment.deployed()

  let extraGasInfo = ''
  if (deployment && deployment.deployTransaction) {
    const gasUsed = deployment.deployTransaction.gasLimit.mul(deployment.deployTransaction.gasPrice ?? 0)
    extraGasInfo = `${utils.formatEther(gasUsed)} ETH, tx hash ${deployment.deployTransaction.hash}`
    deployment
  }
  console.log(' 📄', chalk.cyan(name), 'deployed to:', chalk.magenta(deployment.address))
  console.log(' ⛽', chalk.grey(extraGasInfo))

  await etherscanVerify(name, deployment.address, args)

  saveContractAddress(hre.network.name, name, deployment.address, undefined, args)
}

/**
 * Verify task for tenderly
 * @param contractName
 * @param contractAddress
 * @returns
 */
const etherscanVerify = async (contractName: string, contractAddress: string, args: any[]) => {
  let tenderlyNetworks = ['kovan', 'goerli', 'mainnet', 'rinkeby', 'ropsten']
  let targetNetwork = process.env.HARDHAT_NETWORK || config.defaultNetwork

  if (tenderlyNetworks.includes(targetNetwork)) {
    console.log(chalk.blue(` 📁 Attempting tenderly verification of ${contractName} on ${targetNetwork}`))
    let verification = await hre.run('verify:verify', {
      address: contractAddress,
      constructorArguments: args,
    })
    return verification
  } else {
    console.log(chalk.grey(` 🧐 Contract verification not supported on ${targetNetwork}`))
  }
}

export {
  getSavedContractAddresses,
  saveContractAddress,
  getContractFactory,
  deployContract,
  deployProxy,
  transferOwnership,
}
