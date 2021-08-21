// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import './TimelockedTokenVault.sol';

/**
 * Contract that extends the TimelockedTokenVault with the support to release the capital
 * based on a predefiend interval
 */
contract TimelockedIntervalReleasedTokenVault is TimelockedTokenVault {
    using SafeERC20 for IERC20;

    // the interval
    uint256 private immutable _interval;

    /**
     * @dev Initalizes a new instanc of the TimelockedIntervaldReleased Vault
     */
    constructor(
        address beneficiary_,
        uint256 startDate_,
        uint256 duration_,
        uint256 interval_
    ) TimelockedTokenVault(beneficiary_, startDate_, duration_) {
        _interval = interval_ * 1 days;
    }

    /**
     * @dev payout the freezed amount of token
     */
    function retrieveWalletTokens() public override onlyOwner {
        require(_started && block.timestamp >= _startDate, 'Lock not started');
        uint256 tokensToRetrieve = 0;
        if (block.timestamp >= _startDate + _duration) {
            tokensToRetrieve = _token.balanceOf(address(this));
        } else {
            uint256 parts = _duration / _interval;
            uint256 tokensByPart = _startBalance / parts;
            uint256 timeSinceStart = block.timestamp - _startDate;
            uint256 pastParts = timeSinceStart / _interval;
            uint256 tokensToRetrieveSinceStart = pastParts * tokensByPart;
            tokensToRetrieve = tokensToRetrieveSinceStart - _retrievedTokens;
        }
        require(tokensToRetrieve > 0, 'No tokens available for retrieving at this moment.');
        _retrievedTokens = _retrievedTokens + tokensToRetrieve;
        _token.safeTransfer(beneficiary(), tokensToRetrieve);
        emit Collected(beneficiary(), tokensToRetrieve);
    }
}
