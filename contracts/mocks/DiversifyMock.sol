// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import 'hardhat/console.sol';
import '../token/UpgradableDiversify_V1.sol';

// MOCK TOKEN FOR UNIT TESTING
contract Diversify_Mock is UpgradableDiversify_V1 {
    function exampleFunction() public {
        _mint(msg.sender, 500);
    }
}
