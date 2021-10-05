# Diversify

[![Lint](https://github.com/Diversify-io/diversify-core/actions/workflows/lint.yml/badge.svg)](https://github.com/Diversify-io/diversify-core/actions/workflows/lint.yml) [![Test with Hardhat](https://github.com/Diversify-io/diversify-core/actions/workflows/tests.yml/badge.svg)](https://github.com/Diversify-io/diversify-core/actions/workflows/tests.yml) [![Coverage](https://github.com/Diversify-io/diversify-core/actions/workflows/codecov.yml/badge.svg)](https://github.com/Diversify-io/diversify-core/actions/workflows/codecov.yml) [![codecov](https://codecov.io/gh/Diversify-io/diversify-core/branch/main/graph/badge.svg?token=0M3ZTZJQMV)](https://codecov.io/gh/Diversify-io/diversify-core) ![GitHub package.json version](https://img.shields.io/github/package-json/v/Diversify-io/diversify-core)

![Banner](img/logo.jpeg)

Smart contracts implemented in Solidity for Diversify.

## Introduction

The Diversify Token (DIV) is an ERC20 token on the Ethereum Blockchain. It has a deflationary, democratic and diversified character.

The total issuance of the token is 1,000,000,000 DIV. With its diversified underlying asset, the token price is backed and a deflationary structure is implemented by an 1% burning rate with every transaction. The burning stops as soon as a total of 100 000 000 DIV tokens is reached.
Additionally, 0.25% of every transaction are sent to the Diversify Foundation Wallet. These funds will be used to invest in shares of renewable energy companies and charity. The foundation rate of 0.25% is part of the upgradable contract, which stands for the convertibility of the contract after the initial deployment. A minimum and maximum for this rate is irreversibly defined between 0% to 2.5%. This enables the Diversify community to have a vote about how high this rate should be. There are three token offerings – a Seed Sale, a Strategic Sale and a Global Sale.

## Architecture

The following uml provides a high level overview on the contracts.

![UML](img/uml-diversify.svg)

## Development

### Local environment

```sh
npx hardhat node
```

### Mainnet forking

```sh
npx hardhat node --fork <https://eth-mainnet.alchemyapi.io/v2/API_KEY>
```

<https://hardhat.org/guides/mainnet-forking.html#mainnet-forking>

### Build

```sh
yarn build
```

#### Size Contracts

```sh
yarn build:size
```

### Testing

```sh
yarn test
```

#### Single files

```sh
yarn test test/DiversifyToken.spec.js
```

Mocha & Chai with Waffle matchers (these are really useful).

<https://ethereum-waffle.readthedocs.io/en/latest/matchers.html>

#### Running Tests on VSCode

<https://hardhat.org/guides/vscode-tests.html#running-tests-on-visual-studio-code>

### Console

```sh
yarn console

npx hardhat --network localhost console
```

<https://hardhat.org/guides/hardhat-console.html>

### Coverage

```sh
yarn test:coverage
```

<https://hardhat.org/plugins/solidity-coverage.html#tasks>

### Gas Usage

```sh
yarn test:gas
```

<https://github.com/cgewecke/hardhat-gas-reporter>

### Lint

```sh
yarn lint
```

### UML

```sh
yarn uml
```

### Watch

```sh
npx hardhat watch compile
```

## Deployment

### HardHat

```sh
npx hardhat node
```

### Mainnet

```sh
yarn mainnet:deploy
```

```sh
yarn mainnet:verify
```

```sh
hardhat tenderly:verify --network mainnet ContractName=Address
```

```sh
hardhat tenderly:push --network mainnet ContractName=Address
```

### Rinkeby

```sh
yarn rinkeby:deploy
```

```sh
yarn rinkeby:verify
```

```sh
hardhat tenderly:verify --network rinkeby ContractName=Address
```

## Community

[![Twitter Follow](https://img.shields.io/twitter/follow/diversify_io?label=Diversify&style=social)](https://twitter.com/diversify_io) [![Chat on Telegram](https://img.shields.io/badge/Telegram-brightgreen.svg?logo=telegram&color=%234b4e52)](https://t.me/diversify_offical)

## License

All code in this repository is licensed under [MIT](./LICENSE).
