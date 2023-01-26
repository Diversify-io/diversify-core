// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
import '../token/UpgradableDiversify_V1.sol';

// MOCK TOKEN FOR UNIT TESTING
contract UpgradableDiversify_V2_Mock is UpgradableDiversify_V1 {
    function exampleFunction() public {
        _mint(msg.sender, 500);
    }
}
