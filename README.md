# Diversify

[![Lint](https://github.com/Diversify-io/diversify-core/actions/workflows/lint.yml/badge.svg)](https://github.com/Diversify-io/diversify-core/actions/workflows/lint.yml) [![Test with Hardhat](https://github.com/Diversify-io/diversify-core/actions/workflows/tests.yml/badge.svg)](https://github.com/Diversify-io/diversify-core/actions/workflows/tests.yml) [![Coverage](https://github.com/Diversify-io/diversify-core/actions/workflows/codecov.yml/badge.svg)](https://github.com/Diversify-io/diversify-core/actions/workflows/codecov.yml) [![codecov](https://codecov.io/gh/Diversify-io/diversify-core/branch/main/graph/badge.svg?token=0M3ZTZJQMV)](https://codecov.io/gh/Diversify-io/diversify-core) ![GitHub package.json version](https://img.shields.io/github/package-json/v/Diversify-io/diversify-core)

![Banner](img/logo.jpeg)

Smart contracts implemented in Solidity for Diversify.

## Introduction

The Diversify Token (DIV) is an ERC20 token on the Ethereum Blockchain. It has a deflationary, democratic and diversified character.

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

### Rinkeby

```sh
yarn rinkeby:deploy
```

### Localhost

```sh
yarn localhost:deploy
```

## Community

[![Twitter Follow](https://img.shields.io/twitter/follow/diversify_io?label=Diversify&style=social)](https://twitter.com/diversify_io) [![Chat on Telegram](https://img.shields.io/badge/Telegram-brightgreen.svg?logo=telegram&color=%234b4e52)](https://t.me/diversify_offical)

## License

All code in this repository is licensed under [MIT](./LICENSE).
