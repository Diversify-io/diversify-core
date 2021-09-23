// SPDX-License-Identifier: MIT

pragma solidity =0.8.4;
import 'hardhat/console.sol';
import '../distributors/UpgradablePublicSaleDistributor_V1.sol';

// MOCK TOKEN FOR UNIT TESTING
contract UpgradablePublicSaleDistributor_V2_Mock is UpgradablePublicSaleDistributor_V1 {
    /**
     * @return the duration being held in seconds
     */
    function Amount() public view returns (uint256) {
        return _token.balanceOf(address(this));
    }
}
