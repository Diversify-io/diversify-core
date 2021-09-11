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

    // ERC20 basic token contract being held
    IERC20UpgradeableBurnable private _token;

    // Balance sheet of the invested weis
    mapping(address => uint256) private _balances;

    // Tracks the state of the seedsale
    State private _state;

    //  Start date of seedsale
    uint256 private _startDate;

    // the duration of the seed sale in days
    uint256 private immutable _duration;

    // beneficiary of tokens (weis) after the sale ends
    address private immutable _beneficiary;

    // How many token units a buyer gets per wei
    uint256 private _rate;

    // Supply of seed round in momos
    uint256 private _totalSupply;

    // The total supply in wei
    uint256 private _weiTotalSupply;

    // Amount of wei raised
    uint256 private _weiRaised;

    // Amount of wei to raise
    uint256 private _weiGoal;

    // Locking period of tokens in days if sale was successful
    uint256 private _lockingPeriod;

    /*
     * Event seedsale start logging
     * @param rate How many token units a buyer gets per wei
     * @param weiGoal amount of wei to reach for success
     * @param totalSupply of momos in the round
     * @param duration the duration of the seed sale in days
     * @param lockingPeriod Locking period of tokens in days if sale was successful
     */
    event Started(uint256 rate, uint256 weiGoal, uint256 totalSupply, uint256 duration, uint256 lockingPeriod);

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
     * @param rate_ How many momos a buyer gets per wei
     * @param weiGoal_ The goal in wei to reach for round success
     * @param token_ The div token
     */
    function start(
        uint256 rate_,
        uint256 weiGoal_,
        IERC20UpgradeableBurnable token_
    ) public onlyOwner {
        require(address(token_) != address(0), 'Token must be set');
        require(token_.balanceOf(address(this)) > 0);
        require(_state == State.Setup, 'Seed already started');
        require(rate_ > 0);
        require(weiGoal_ > 0);

        _token = token_;
        _rate = rate_;
        _state = State.Active;
        _startDate = block.timestamp;
        _totalSupply = _token.balanceOf(address(this));
        _weiTotalSupply = _totalSupply / _rate;
        _weiGoal = weiGoal_;

        emit Started(_rate, _weiGoal, _totalSupply, _duration, _lockingPeriod);
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
     * @dev token purchase
     */
    function buyTokens() public payable {
        uint256 weiAmount = msg.value;
        require(_state == State.Active);
        require(block.timestamp < _startDate + _duration, 'End duration reached');
        require(_msgSender() != address(0));
        require(weiAmount != 0);
        require(_weiRaised + weiAmount <= _weiTotalSupply);

        // calculate token amount for event
        uint256 tokens = _getMomoAmount(weiAmount);

        // update state
        _weiRaised += weiAmount;

        _balances[_msgSender()] = _balances[_msgSender()] + msg.value;
        emit TokenPurchase(_msgSender(), weiAmount, tokens);
    }

    /**
     * Closes the sale, when enduration reached
     */
    function close() public onlyOwner {
        require(_state == State.Active);
        require(block.timestamp >= _startDate + _duration, 'End duration not reached');

        if (_weiRaised >= _weiGoal) {
            _state = State.Closed;
            emit Closed();
            retrieveETH(payable(beneficiary()));
            // Burn remaining tokens
            uint256 momosSold = _getMomoAmount(_weiRaised);
            _token.burn(totalSupply() - momosSold);
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
        require(_state == State.Closed, 'Sale is still open');
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
     * @param _weiAmount Value in wei to momos
     * @return Number of token (momo's) one receives for the _weiAmount
     */
    function _getMomoAmount(uint256 _weiAmount) internal view returns (uint256) {
        return _weiAmount * rate();
    }
}
