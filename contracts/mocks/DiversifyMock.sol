// SPDX-License-Identifier: MIT
// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;
import 'hardhat/console.sol';
import '../token/UpgradableDiversify_V1.sol';

// MOCK TOKEN FOR UNIT TESTING
contract Diversify_Mock is UpgradableDiversify_V1 {
    function exampleFunction() public {
        _mint(msg.sender, 500);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }
}
