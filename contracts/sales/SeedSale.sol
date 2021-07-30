// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '../utils/RetrieveTokensFeature.sol';

/**
 * Contract to handle timelocked interval based capital releases to an immuatable beneficiary
 */
contract SeedSaleVault is RetrieveTokensFeature {
    using SafeERC20 for IERC20;

    enum State {
        Setup,
        Active,
        Refunding,
        Closed
    }

    State private _state;

    // ERC20 basic token contract being held
    IERC20 private immutable _token;

    // Invested gweis
    mapping(address => uint256) private _balances;

    // How many token units a buyer gets per wei
    uint256 public _rate;

    // Amount of coins to sell in momos
    uint256 private _goal;

    // beneficiary of tokens after the sale ends
    address private immutable _beneficiary;

    // startDate of the lock
    uint256 private _startDate;

    // the duration of the lock / end date
    uint256 private immutable _duration;

    // Amount of wei raised
    uint256 private _weiRaised;

    event Started(uint256 rate, uint256 goal, uint256 _duration);
    event Closed();
    event RefundsEnabled();
    event Refunded(address indexed beneficiary, uint256 weiAmount);

    /**
     * Lorem
     */
    constructor(
        IERC20 token_,
        address beneficiary_,
        uint256 duration_
    ) {
        require(beneficiary_ != address(0));
        require(duration_ > 0);
        _token = token_;
        _beneficiary = beneficiary_;
        _duration = duration_ * 1 days;
        _state = State.Setup;
    }

    /**
     * @dev starts the vault
     */
    function start(uint256 rate_) public onlyOwner {
        require(_state == State.Setup, 'Seed already started');
        _rate = rate_;
        _state = State.Active;
        _startDate = block.timestamp;
        _goal = _token.balanceOf(address(this));
        emit Started(_rate, _goal, _duration);
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
     * @return the rate how many momos one get per gwei
     */
    function rate() public view returns (uint256) {
        return _rate;
    }

    /**
     * @return the balance of div tokens of the given address
     */
    function balanceOf(address address_) public view returns (uint256) {
        return _balances[address_];
    }

    /**
     * @param investor Investor address
     */
    function deposit(address investor) public payable onlyOwner {
        require(_state == State.Active);
        _balances[investor] = _balances[investor] + msg.value;
    }

    function close() public onlyOwner {
        require(
            _state == State.Active && block.timestamp >= _startDate + _duration,
            'Not started or timelock end not reached'
        );
        emit Closed();
        retrieveETH(payable(beneficiary()));
    }

    function enableRefunds() public onlyOwner {
        require(_state == State.Active);
        _state = State.Refunding;
        emit RefundsEnabled();
    }

    /**
     * @param investor Investor address
     */
    function refund(address payable investor) public {
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
        require(
            _state == State.Closed && block.timestamp >= _startDate + _duration,
            'Not started or timelock end not reached'
        );
        // how to calculate prices '
        _token.safeTransfer(_msgSender(), _balances[_msgSender()]);
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
        require(
            _state == State.Closed && block.timestamp >= _startDate + _duration,
            'Not started or timelock end not reached'
        );
        require(to == beneficiary(), 'You can only transfer tokens to the beneficiary');
        super.retrieveETH(to);
    }
}
