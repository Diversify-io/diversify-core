// SPDX-License-Identifier: MIT
/**
 * @title RefundVault
 * @dev This contract is used for storing funds while a crowdsale
 * is in progress. Supports refunding the money if crowdsale fails,
 * and forwarding it if crowdsale is successful.
 */

import '@openzeppelin/contracts/access/Ownable.sol';

contract RefundVault is Ownable {
    enum State {
        Active,
        Refunding,
        Closed
    }

    mapping(address => uint256) public deposited;
    address payable public wallet;
    State public state;

    event Closed();
    event RefundsEnabled();
    event Refunded(address indexed beneficiary, uint256 weiAmount);

    /**
     * @param _wallet Vault address
     */
    constructor(address payable _wallet) {
        require(_wallet != address(0));
        wallet = _wallet;
        state = State.Active;
    }

    /**
     * @param investor Investor address
     */
    function deposit(address investor) public payable onlyOwner {
        require(state == State.Active);
        deposited[investor] = deposited[investor] + msg.value;
    }

    function close() public onlyOwner {
        require(state == State.Active);
        state = State.Closed;
        emit Closed();
        wallet.transfer(address(this).balance);
    }

    function enableRefunds() public onlyOwner {
        require(state == State.Active);
        state = State.Refunding;
        emit RefundsEnabled();
    }

    /**
     * @param investor Investor address
     */
    function refund(address payable investor) public {
        require(state == State.Refunding);
        uint256 depositedValue = deposited[investor];
        deposited[investor] = 0;
        investor.transfer(depositedValue);
        emit Refunded(investor, depositedValue);
    }
}
