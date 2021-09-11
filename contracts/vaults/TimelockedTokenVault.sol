// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '../utils/RetrieveTokensFeature.sol';

/**
 * Contract that acts as a freeze (timelocked) vault to an immuntable beneficiary.
 */
contract TimelockedTokenVault is RetrieveTokensFeature {
    using SafeERC20 for IERC20;

    // ERC20 basic token contract being held
    IERC20 internal _token;

    // beneficiary of tokens after they are released
    address internal immutable _beneficiary;

    // startDate of the lock
    uint256 internal immutable _startDate;

    // the duration of the lock / end date
    uint256 internal immutable _duration;

    // initial start balance
    uint256 internal _startBalance;

    // indiacted wheter vault started or not
    bool internal _started;

    // the amount of tokens already retrieved
    uint256 internal _retrievedTokens;

    /*
     * Event for logging the collection
     * @param beneficiary who get the refund
     * @param token amount collected
     */
    event Collected(address indexed beneficiary, uint256 amount);

    /**
     * @dev Initalizes a new instanc of the TimelockedIntervaldDistributed Vault
     */
    constructor(
        address beneficiary_,
        uint256 startDate_,
        uint256 duration_
    ) {
        require(startDate_ + duration_ > block.timestamp, 'TokenTimelock: release time is before current time');
        _beneficiary = beneficiary_;
        _startDate = startDate_;
        _duration = duration_ * 1 days;
        _retrievedTokens = 0;
    }

    /**
     * @dev starts the vault
     */
    function start(IERC20 token_) public onlyOwner {
        require(!_started, 'Lock already started');
        require(address(token_) != address(0), 'Token must be set');
        _token = token_;
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
     * @return the start balance
     */
    function startBalance() public view returns (uint256) {
        return _startBalance;
    }

    /**
     * @return the state of the vault
     */
    function started() public view returns (bool) {
        return _started;
    }

    /**
     * @return the retrieved tokens
     */
    function retrievedTokens() public view returns (uint256) {
        return _retrievedTokens;
    }

    /**
     * @dev payout the freezed amount of token
     */
    function retrieveWalletTokens() public virtual onlyOwner {
        require(_started && block.timestamp >= _startDate, 'Lock not started');
        if (block.timestamp >= _startDate + _duration) {
            uint256 tokensToRetrieve = _token.balanceOf(address(this));
            _token.safeTransfer(beneficiary(), tokensToRetrieve);
            emit Collected(beneficiary(), tokensToRetrieve);
        }
    }

    /**
     * @dev retrieve wrongly assigned tokens
     */
    function retrieveTokens(address to, address anotherToken) public override onlyOwner {
        require(address(_token) != anotherToken, 'The withdraw is restriected to extraneous tokens.');
        super.retrieveTokens(to, anotherToken);
    }
}
