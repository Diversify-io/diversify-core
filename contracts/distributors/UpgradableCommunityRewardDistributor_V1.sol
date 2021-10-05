// SPDX-License-Identifier: MIT

pragma solidity =0.8.4;
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../utils/UpgradableRetrieveTokensFeature.sol';

/**
 * Upgradable Contract that will be used in futuere for the community rewards
 */
contract UpgradableCommunityRewardDistributor_V1 is UpgradableRetrieveTokensFeature {
    using SafeERC20 for IERC20;

    // ERC20 basic token contract being held
    IERC20 internal _token;

    /**
     * Initalize the vault
     */
    function initialize() public initializer {
        __RetrieveToken_init();
    }

    /**
     * @dev set the token to hold
     */
    function setToken(IERC20 token_) public onlyOwner {
        require(address(token_) == address(0), 'contract already added');
        _token = token_;
    }

    /**
     * @dev retrieve wrongly assigned tokens
     */
    function retrieveTokens(address to, address anotherToken) public override onlyOwner {
        require(address(_token) != address(0), 'Token must be set');
        require(address(_token) != anotherToken, 'You should only use this method to withdraw extraneous tokens.');
        super.retrieveTokens(to, anotherToken);
    }
}
