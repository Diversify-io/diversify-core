import chalk from 'chalk'
import { ContractFactory, Overrides } from 'ethers'
import fs from 'fs'
import hre, { config, ethers, tenderly, upgrades } from 'hardhat'
import path from 'path'
import { Ownable } from '../types/Ownable.d'
type ThenArg<T> = T extends PromiseLike<infer U> ? U : T
type InitalizeArgs<T extends ContractFactory> = Parameters<ThenArg<ReturnType<T['deploy']>>['initialize']>

type ContractAdresses = {
  [network: string]: {
    [contract: string]: {
      address: string
      owner?: string
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
 * Save the contract addresses
 * @returns
 */
function saveContractAddress(network: string, contract: string, address: string, owner?: string) {
  const addrs = getSavedContractAddresses()
  addrs[network] = addrs[network] || {}
  addrs[network][contract] = {
    address: address,
    owner: owner,
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
  await deployment.deployed()
  saveContractAddress(hre.network.name, name, deployment.address)
  console.log(' 📄', chalk.cyan(name), 'deployed to:', chalk.magenta(deployment.address))
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
  await deployment.deployed()
  saveContractAddress(hre.network.name, name, deployment.address)
  console.log(' 📄', chalk.cyan(name), 'deployed to:', chalk.magenta(deployment.address))
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
 * Verify task for tenderly
 * @param contractName
 * @param contractAddress
 * @returns
 */
const tenderlyVerify = async (contractName: string, contractAddress: string) => {
  let tenderlyNetworks = ['kovan', 'goerli', 'mainnet', 'rinkeby', 'ropsten', 'matic', 'mumbai', 'xDai', 'POA']
  let targetNetwork = process.env.HARDHAT_NETWORK || config.defaultNetwork

  if (tenderlyNetworks.includes(targetNetwork)) {
    console.log(chalk.blue(` 📁 Attempting tenderly verification of ${contractName} on ${targetNetwork}`))

    await tenderly.persistArtifacts({
      name: contractName,
      address: contractAddress,
    })

    let verification = await tenderly.verify({
      name: contractName,
      address: contractAddress,
      network: targetNetwork,
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
