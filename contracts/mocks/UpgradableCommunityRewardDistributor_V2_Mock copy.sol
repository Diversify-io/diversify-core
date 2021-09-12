// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import 'hardhat/console.sol';
import '../distributors/UpgradableCommunityRewardDistributor_V1.sol';

// MOCK TOKEN FOR UNIT TESTING
contract UpgradableCommunityRewardDistributor_V2_Mock is UpgradableCommunityRewardDistributor_V1 {
    /**
     * @return the duration being held in seconds
     */
    function Amount() public view returns (uint256) {
        return _token.balanceOf(address(this));
    }
}
