import { ContractFactory, Overrides } from 'ethers'
import fs from 'fs'
import hre, { ethers, upgrades } from 'hardhat'
import path from 'path'

type ContractAdresses = {
  [network: string]: {
    [contract: string]: {
      address: string
      owner?: string
    }
  }
}

function getSavedContractAddresses(): ContractAdresses {
  let json
  try {
    json = fs.readFileSync(path.join(__dirname, '../contract-addresses.json'), 'utf-8')
  } catch (err) {
    json = '{}'
  }
  const addrs: ContractAdresses = JSON.parse(json)
  return addrs
}

function saveContractAddress(network: string, contract: string, address: string, owner?: string) {
  const addrs = getSavedContractAddresses()
  addrs[network] = addrs[network] || {}
  addrs[network][contract] = {
    address: address,
    owner: owner,
  }
  fs.writeFileSync(path.join(__dirname, '../contract-addresses.json'), JSON.stringify(addrs, null, '    '))
}

const getContractFactory = async <T extends ContractFactory>(contractName: string) =>
  (await ethers.getContractFactory(contractName)) as T

const deployContract = async <T extends ContractFactory>(
  name: string,
  contract: T,
  ...args: Parameters<T['deploy']>
): Promise<ReturnType<T['deploy']>> => {
  const deployment = await contract.deploy(...args)
  await deployment.deployed()

  saveContractAddress(hre.network.name, name, deployment.address)
  return deployment
}

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T
type InitalizeArgs<T extends ContractFactory> = Parameters<ThenArg<ReturnType<T['deploy']>>['initialize']>

const deployProxy = async <T extends ContractFactory>(
  name: string,
  contract: T,
  ...args: InitalizeArgs<T> extends { overrides?: Overrides & { from?: string | Promise<string> } }
    ? [undefined?]
    : InitalizeArgs<T>
): Promise<ReturnType<T['deploy']>> => {
  const deployment = await upgrades.deployProxy(contract, args)
  await deployment.deployed()
  saveContractAddress(hre.network.name, name, deployment.address)
  return deployment
}

export { getSavedContractAddresses, saveContractAddress, getContractFactory, deployContract, deployProxy }
