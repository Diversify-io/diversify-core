// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import './RetrieveTokensFeature.sol';

/**
 * Contract to handle timelocked interval based capital releases to an immuatable beneficiary
 */
contract FreezeTokenWallet is RetrieveTokensFeature {
    using SafeERC20 for IERC20;

    // mapping(address => uint256) private _balances; - list to track who invested -> how much ether? with gether -> get balance of

    // uint256 price or how many tokens for one ether

    // payout as soon as locking period end (after crowdsale end)

    // payout all eths -> onlyOwner to beneficary wallet -> company wallet

    // don't forget to provide refund and criterias

    // ERC20 basic token contract being held
    IERC20 private immutable _token;

    // beneficiary of tokens after they are released
    address private immutable _beneficiary;

    // startDate of the lock
    uint256 private immutable _startDate;

    // the duration of the lock / end date
    uint256 private immutable _duration;

    // the interval
    uint256 private immutable _interval;

    // the retrieved tokens
    uint256 private _retrievedTokens = 0;

    // initial start balance
    uint256 private _startBalance;

    // indiacted wheter vault started or not
    bool private _started;

    /**
     * Lorem
     */
    constructor(
        IERC20 token_,
        address beneficiary_,
        uint256 duration_,
        uint256 interval_,
        uint256 startDate_
    ) {
        require(startDate_ + duration_ > block.timestamp, 'TokenTimelock: release time is before current time');
        _token = token_;
        _beneficiary = beneficiary_;
        _startDate = startDate_;
        _duration = duration_ * 1 days;
        _interval = interval_ * 1 days;
    }

    /**
     * @dev starts the vault
     */
    function start() public onlyOwner {
        require(!_started, 'Lock already started');
        _startBalance = _token.balanceOf(address(this));
        _started = true;
    }

    /**
     * @return the token being held.
     */
    function token() public view returns (IERC20) {
        return _token;
    }

    /**
     * @return the beneficiary of the tokens.
     */
    function beneficiary() public view returns (address) {
        return _beneficiary;
    }

    /**
     * @return the retrieved tokens
     */
    function retrievedTokens() public view returns (uint256) {
        return _retrievedTokens;
    }

    /**
     * @return the start balance
     */
    function startBalance() public view returns (uint256) {
        return _startBalance;
    }

    /**
     * @dev payout the freezed amount of token
     */
    function retrieveWalletTokens() public onlyOwner {
        require(_started && block.timestamp >= _startDate, 'Lock not started yet');
        if (block.timestamp >= _startDate + _duration) {
            _token.safeTransfer(beneficiary(), _token.balanceOf(address(this)));
        } else {
            uint256 parts = _duration / _interval;
            uint256 tokensByPart = _startBalance / parts;
            uint256 timeSinceStart = block.timestamp - _startDate;
            uint256 pastParts = timeSinceStart / _interval;
            uint256 tokensToRetrieveSinceStart = pastParts * tokensByPart;
            uint256 tokensToRetrieve = tokensToRetrieveSinceStart - _retrievedTokens;
            require(tokensToRetrieve > 0, 'No tokens available for retrieving at this moment.');
            _retrievedTokens = _retrievedTokens + tokensToRetrieve;
            _token.safeTransfer(beneficiary(), tokensToRetrieve);
        }
    }

    /**
     * @dev retrieve wrongly assigned tokens
     */
    function retrieveTokens(address to, address anotherToken) public override onlyOwner {
        require(address(_token) != anotherToken, 'You should only use this method to withdraw extraneous tokens.');
        super.retrieveTokens(to, anotherToken);
    }
}
