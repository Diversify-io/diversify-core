// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
import '../vaults/UpgradableTokenVault.sol';

// MOCK TOKEN FOR UNIT TESTING
contract UpgradableTokenVault_V2_Mock is UpgradableTokenVault {
    /**
     * @return the duration being held in seconds
     */
    function Amount() public view returns (uint256) {
        return _token.balanceOf(address(this));
    }
}
