// SPDX-License-Identifier: MIT

pragma solidity =0.8.4;
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '../interfaces/IERC20UpgradeableBurnable.sol';

/**
 * @title Contract for the ERC20 Diversify token
 * @author Diversify.io
 * @notice This contract handles the implementation fo the Diversify token
 */
contract UpgradableDiversify_V1 is Initializable, ERC20Upgradeable, OwnableUpgradeable, IERC20UpgradeableBurnable {
    event FoundationWalletChanged(address indexed previousWallet, address indexed newWallet);
    event FoundationRateChanged(uint256 previousRate, uint256 newRate);

    // Immutable burn stop supply
    uint256 private constant BURN_STOP_SUPPLY = 100000000 * 10**18;

    // the address of the foundation wallet
    address private _foundationWallet;

    // the rate that goes to the foundation
    uint256 private _foundationRate;

    // total burned amount
    uint256 private _amountBurned;

    // total amount transfered to foundation
    uint256 private _amountFounded;

    /**
     * Initialize
     */
    function initialize(
        address[] memory addresses,
        uint256[] memory amounts,
        address fWallet
    ) public initializer {
        __ERC20_init('Diversify', 'DIV');
        __Ownable_init();

        // loop through the addresses array and send tokens to each address
        // the corresponding amount to sent is taken from the amounts array
        for (uint8 i = 0; i < addresses.length; i++) {
            _mint(addresses[i], amounts[i] * 10**18);
        }

        // Set foundation rate (25 basis points = 0.25 pct)
        _foundationRate = 25;
        _foundationWallet = fWallet;
    }

    /**
     * @dev Destroys `amount` tokens from the caller.
     *
     * See {ERC20-_burn}.
     */
    function burn(uint256 amount) public virtual override returns (bool) {
        _burn(_msgSender(), amount);
        return true;
    }

    /**
     * @dev Destroys `amount` tokens from `account`, deducting from the caller's
     * allowance.
     *
     * See {ERC20-_burn} and {ERC20-allowance}.
     *
     * Requirements:
     *
     * - the caller must have allowance for ``accounts``'s tokens of at least
     * `amount`.
     */
    function burnFrom(address account, uint256 amount) public virtual override returns (bool) {
        uint256 currentAllowance = allowance(account, _msgSender());
        require(currentAllowance >= amount, 'ERC20: burn amount exceeds allowance');
        unchecked {
            _approve(account, _msgSender(), currentAllowance - amount);
        }
        _burn(account, amount);
        return true;
    }

    /**
     * @dev Returns the address of the foundation wallet.
     */
    function foundationWallet() public view returns (address) {
        return _foundationWallet;
    }

    /**
     * @dev Returns the rate of the foundation.
     */
    function foundationRate() public view returns (uint256) {
        return _foundationRate;
    }

    /**
     * @dev Returns the amount of tokens, transfered to the foundation
     */
    function amountFounded() public view returns (uint256) {
        return _amountFounded;
    }

    /**
     * @dev Returns the amount of burned tokens
     */
    function amountBurned() public view returns (uint256) {
        return _amountBurned;
    }

    /**
     * @dev Sets the address of the foundation wallet.
     */
    function setFoundationWallet(address newWallet) public onlyOwner {
        address oldWallet = _foundationWallet;
        _foundationWallet = newWallet;
        emit FoundationWalletChanged(oldWallet, newWallet);
    }

    /**
     * @dev Sets the foundation rate, maximal allowance of 250 basis points (2.5 pct)
     */
    function setFoundationRate(uint256 newRate) public onlyOwner {
        require(newRate > 0 && newRate <= 250);
        uint256 oldRate = _foundationRate;
        _foundationRate = newRate;
        emit FoundationRateChanged(oldRate, newRate);
    }

    /**
     * @dev Returns the burn stop supply.
     */
    function burnStopSupply() public pure returns (uint256) {
        return BURN_STOP_SUPPLY;
    }

    /**
     * Extend transfer with limit burn and governance wallet
     */
    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal override {
        uint256 tFound = (value * _foundationRate) / 10**4;
        uint256 tBurn = 0;
        if (totalSupply() != BURN_STOP_SUPPLY) {
            tBurn = value / 100;
            // Reduce burn amount to burn limit
            if (totalSupply() < BURN_STOP_SUPPLY + value) {
                tBurn = totalSupply() - BURN_STOP_SUPPLY;
            }
            _burn(from, tBurn);
        }
        super._transfer(from, _foundationWallet, tFound);
        super._transfer(from, to, value - tFound - tBurn);
        _amountFounded += tFound;
    }

    /**
     * Extend burn with  burn limit
     */
    function _burn(address account, uint256 amount) internal override {
        require(!(totalSupply() < BURN_STOP_SUPPLY + amount), 'burn overreaches burn stop supply');
        super._burn(account, amount);
        _amountBurned += amount;
    }
}
