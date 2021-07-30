// SPDX-License-Identifier: MIT
// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;
import 'hardhat/console.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './RefundVault.sol';

contract Crowdsale is Ownable {
    // The token being sold
    ERC20Upgradeable public token;

    // Address where funds are collected
    address payable public wallet;

    // How many token units a buyer gets per wei
    uint256 public rate;

    // Amount of coins to sell in momos
    uint256 public goal;

    // Amount of wei raised
    uint256 public weiRaised;

    // is Crowdsale finished
    bool public isFinalized = false;

    uint256 public openingTime;

    uint256 public closingTime;

    // refund vault used to hold funds while crowdsale is running
    RefundVault public vault;

    /**
     * Event for finalize crouwdsale
     */
    event Finalized();

    /*
     * Event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     * @param _openingTime Crowdsale opening time
     * @param _closingTime Crowdsale closing time
     */
    event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

    /**
     * @param _rate Number of token units a buyer gets per wei
     * @param _wallet Address where collected funds will be forwarded to
     * @param _token Address of the token being sold
     * @param _goal Max amount of wei to be contributed
     */
    constructor(
        uint256 _rate,
        address payable _wallet,
        ERC20Upgradeable _token,
        uint256 _goal,
        uint256 _openingTime,
        uint256 _closingTime
    ) {
        require(_rate > 0);
        require(_wallet != address(0));
        require(address(_token) != address(0));
        require(_goal > 0);
        require(_openingTime >= block.timestamp);
        require(_closingTime >= _openingTime);

        rate = _rate;
        wallet = _wallet;
        token = _token;
        goal = _goal;
        openingTime = _openingTime;
        closingTime = _closingTime;
        vault = new RefundVault(wallet);
    }

    /**
     * @dev low level token purchase ***DO NOT OVERRIDE***
     * @param _beneficiary Address performing the token purchase
     */
    function buyTokens(address _beneficiary) public payable {
        uint256 weiAmount = msg.value;

        require(block.timestamp >= openingTime && block.timestamp <= closingTime);
        require(_beneficiary != address(0));
        require(weiAmount != 0);
        require(weiRaised + weiAmount <= goal);

        // calculate token amount to be created
        uint256 tokens = _getTokenAmount(weiAmount);

        // update state
        weiRaised = weiRaised + weiAmount;

        token.transfer(_beneficiary, tokens);
        emit TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);

        vault.deposit(msg.sender);
    }

    // -----------------------------------------
    // Internal interface (extensible)
    // -----------------------------------------

    /**
     * @dev Override to extend the way in which ether is converted to tokens.
     * @param _weiAmount Value in wei to be converted into tokens
     * @return Number of tokens that can be purchased with the specified _weiAmount
     */
    function _getTokenAmount(uint256 _weiAmount) internal view returns (uint256) {
        return _weiAmount + rate;
    }

    /**
     * @dev Must be called after crowdsale ends, to do some extra finalization
     * work. Calls the contract's finalization function.
     */
    function finalize() public onlyOwner {
        require(!isFinalized);
        require(hasClosed());

        if (goalReached()) {
            vault.close();
        } else {
            vault.enableRefunds();
        }

        emit Finalized();

        isFinalized = true;
    }

    /**
     * @dev Investors can claim refunds here if crowdsale is unsuccessful
     */
    function claimRefund() public {
        require(isFinalized);
        require(!goalReached());
        vault.refund(payable(msg.sender));
    }

    /**
     * @dev Checks whether the period in which the crowdsale is open has already elapsed.
     * @return Whether crowdsale period has elapsed
     */
    function hasClosed() public view returns (bool) {
        // solium-disable-next-line security/no-block-members
        return block.timestamp > closingTime;
    }

    /**
     * @dev Checks whether the goal has been reached.
     * @return Whether the goal was reached
     */
    function goalReached() public view returns (bool) {
        return weiRaised >= goal;
    }
}
