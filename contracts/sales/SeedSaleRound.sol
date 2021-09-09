// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '../utils/RetrieveTokensFeature.sol';
import '../interfaces/IERC20UpgradeableBurnable.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

/**
 * Contract to handle a seed sale of diversify
 */
contract SeedSaleRound is RetrieveTokensFeature {
    // The State of the seed sale
    enum State {
        Setup,
        Active,
        Refunding,
        Closed
    }

    // beneficiary of tokens (weis) after the sale ends
    address private immutable _beneficiary;

    // the duration of the seed sale in days
    uint256 private immutable _duration;

    // Tracks the state of the seedsale
    State private _state;

    // Balance sheet of the invested weis
    mapping(address => uint256) private _balances;

    // ERC20 basic token contract being held
    IERC20UpgradeableBurnable private _token;

    // How many token units a buyer gets per wei
    uint256 private _rate;

    // Amount of wei to reach
    uint256 private _goal;

    //  Start date of seedsale
    uint256 private _startDate;

    // Initial supply of seed round
    uint256 private _totalSupply;

    // Amount of wei raised
    uint256 private _weiRaised;

    // Locking period of tokens in days if sale was successful
    uint256 private _lockingPeriod;

    /*
     * Event seedsale start logging
     * @param rate How many token units a buyer gets per wei
     * @param goal amount of wei to reach
     * @param totalSupply of the round
     * @param duration the duration of the seed sale in days
     * @param lockingPeriod Locking period of tokens in days if sale was successful
     */
    event Started(uint256 rate, uint256 goal, uint256 totalSupply, uint256 duration, uint256 lockingPeriod);

    /*
     * Event for seedsale closed logging
     */
    event Closed();

    /*
     * Event for refunds enabled
     */
    event RefundsEnabled();

    /*
     * Event for logging the refund
     * @param beneficiary who get the refund
     * @param weiAmount weis refunded
     */
    event Refunded(address indexed beneficiary, uint256 weiAmount);

    /*
     * Event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokenPurchase(address indexed purchaser, uint256 value, uint256 amount);

    /**
     * Create a new instance of the seed sale
     * @param beneficiary_ beneficiary of tokens (weis) after the sale ends
     * @param duration_ the duration of the seed sale in days
     * @param lockingPeriod_ Locking period of tokens in days if sale was successful
     */
    constructor(
        address beneficiary_,
        uint256 duration_,
        uint256 lockingPeriod_
    ) {
        // note: we allow a zero lockingPeriod by design
        require(beneficiary_ != address(0));
        require(duration_ > 0);

        _beneficiary = beneficiary_;
        _duration = duration_ * 1 days;
        _state = State.Setup;
        _lockingPeriod = lockingPeriod_ * 1 days;
    }

    /**
     * @dev starts the sale
     * @param rate_ How many token units a buyer gets per wei
     * @param token_ The div token
     */
    function start(uint256 rate_, IERC20UpgradeableBurnable token_) public onlyOwner {
        require(address(token_) != address(0), 'Token must be set');
        require(token_.balanceOf(address(this)) > 0);
        require(_state == State.Setup, 'Seed already started');
        require(_rate > 0);

        _token = token_;
        _rate = rate_;
        _state = State.Active;
        _startDate = block.timestamp;
        _totalSupply = _token.balanceOf(address(this));
        _goal = _totalSupply / _rate;

        emit Started(_rate, _goal, _totalSupply, _duration, _lockingPeriod);
    }

    /**
     * @return the token being held.
     */
    function token() public view returns (IERC20UpgradeableBurnable) {
        return _token;
    }

    /**
     * @return the beneficiary of the tokens.
     */
    function beneficiary() public view returns (address) {
        return _beneficiary;
    }

    /**
     * @return the rate how many momos one get per gwei
     */
    function rate() public view returns (uint256) {
        return _rate;
    }

    /**
     * @return the amount of the seed round
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @return the balance of div tokens for the given address
     */
    function balanceOf(address address_) public view returns (uint256) {
        return _balances[address_];
    }

    /**
     * @dev low level token purchase ***DO NOT OVERRIDE***
     */
    function buyTokens() public payable {
        uint256 weiAmount = msg.value;
        require(_state == State.Active);
        require(block.timestamp < _startDate + _duration, 'End duration reached');
        require(_msgSender() != address(0));
        require(weiAmount != 0);
        require(_weiRaised + weiAmount <= _goal);

        // calculate token amount for event
        uint256 tokens = _getMomoAmount(weiAmount);

        // update state
        _weiRaised = _weiRaised + weiAmount;

        _balances[_msgSender()] = _balances[_msgSender()] + msg.value;
        emit TokenPurchase(_msgSender(), weiAmount, tokens);
    }

    /**
     * Closes the sale, when enduration reached
     */
    function close() public onlyOwner {
        require(_state == State.Active);
        require(block.timestamp >= _startDate + _duration, 'End duration not reached');

        if (_weiRaised >= _totalSupply) {
            _state = State.Closed;
            emit Closed();
            retrieveETH(payable(beneficiary()));
        } else {
            _state = State.Refunding;
            emit RefundsEnabled();
        }
    }

    /**
     * @dev Investors can claim refunds here if crowdsale is unsuccessful
     */
    function claimRefund(address payable investor) public {
        require(_state == State.Refunding);
        uint256 balanceValue = _balances[investor];
        _balances[investor] = 0;
        investor.transfer(balanceValue);
        emit Refunded(investor, balanceValue);
    }

    /**
     * @dev payout the freezed amount of token
     */
    function retrieveFreezedTokens() public {
        require(_state == State.Closed, 'Not closed');
        require(block.timestamp >= (_startDate + _duration + _lockingPeriod), 'Seed locking period not ended');
        uint256 momoAmount = _getMomoAmount(_balances[_msgSender()]);
        _balances[_msgSender()] = 0;
        _token.transfer(_msgSender(), momoAmount);
    }

    /**
     * @dev retrieve wrongly assigned tokens
     */
    function retrieveTokens(address to, address anotherToken) public override onlyOwner {
        require(address(_token) != anotherToken, 'You should only use this method to withdraw extraneous tokens.');
        require(to == beneficiary(), 'You can only transfer tokens to the beneficiary');
        super.retrieveTokens(to, anotherToken);
    }

    /**
     * @dev retrieve wrongly assigned tokens
     */
    function retrieveETH(address payable to) public override onlyOwner {
        require(_state == State.Closed, 'Not started or timelock end not reached');
        require(to == beneficiary(), 'You can only transfer tokens to the beneficiary');
        super.retrieveETH(to);
    }

    /**
     * @param _weiAmount Value in wei to be converted into tokens
     * @return Number of tokens (momo's) that can be purchased with the specified _weiAmount
     */
    function _getMomoAmount(uint256 _weiAmount) internal view returns (uint256) {
        return _weiAmount * rate();
    }
}
