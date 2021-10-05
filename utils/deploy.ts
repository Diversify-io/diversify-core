import { ContractFactory, Overrides } from 'ethers'
import fs from 'fs'
import hre, { ethers, upgrades } from 'hardhat'
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
  return `../contract-addresses${hre.network.name === 'hardhat' ? 'dev' : ''}.json`
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
  console.log(`Deploying ${name}...`)
  const deployment = await contract.deploy(...args)
  await deployment.deployed()
  saveContractAddress(hre.network.name, name, deployment.address)
  console.log(`Deployed ${name} at: ${deployment.address}`)
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
  console.log(`Deploying proxy for ${name}...`)
  const deployment = await upgrades.deployProxy(contract, args)
  await deployment.deployed()
  saveContractAddress(hre.network.name, name, deployment.address)
  console.log(`Deployed proxy for ${name} at: ${deployment.address}`)
  return deployment
}

/**
 * Type safe ownership transfer with logging
 * @param name
 * @param contract
 * @param newOwner
 */
const transferOwnership = async <T extends Ownable>(name: string, contract: T, newOwner: string) => {
  console.log(`Transfering ownership of ${name}...`)
  await contract.transferOwnership(newOwner)
  saveContractAddress(hre.network.name, name, contract.address, newOwner)
  console.log(`Transferred ownership of ${name} to:`, newOwner)
}

export {
  getSavedContractAddresses,
  saveContractAddress,
  getContractFactory,
  deployContract,
  deployProxy,
  transferOwnership,
}
