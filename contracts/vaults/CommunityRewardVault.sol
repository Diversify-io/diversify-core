// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../utils/UpgradableRetrieveTokensFeature.sol';

/**
 *
 */
contract CommunityRewardVault is UpgradableRetrieveTokensFeature {
    using SafeERC20 for IERC20;

    // ERC20 basic token contract being held
    IERC20 private _token;

    /**
     * Initalize the vault
     */
    function initialize(IERC20 token_) public initializer {
        _token = token_;
    }

    /**
     * @dev retrieve wrongly assigned tokens
     */
    function retrieveTokens(address to, address anotherToken) public override onlyOwner {
        require(address(_token) != anotherToken, 'You should only use this method to withdraw extraneous tokens.');
        super.retrieveTokens(to, anotherToken);
    }
}
