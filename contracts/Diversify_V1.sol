// SPDX-License-Identifier: MIT
// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;
import 'hardhat/console.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

// This is the main building block for smart contracts.
contract Diversify_V1 is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    event FoundationWalletChanged(address indexed previousWallet, address indexed newWallet);
    event FoundationRateChanged(uint256 indexed previousRate, uint256 indexed newRate);

    uint256 private constant BURN_STOP_SUPPLY = 100000000 * 10**18;
    address private _foundationWallet;
    uint256 private _foundationRate;

    function initialize(address fWallet) public initializer {
        __ERC20_init('Diversify', 'DIV');
        __Ownable_init();
        _mint(msg.sender, 1000000000 * 10**decimals());
        _foundationRate = 0.25 * 100;
        _foundationWallet = fWallet;
    }

    /**
     * Extend transfer with limit burn and governance wallet
     */
    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal override {
        (uint256 tTransferAmount, uint256 tFound, uint256 tBurn) = _getTValues(value);
        _burn(from, tBurn);
        super._transfer(from, _foundationWallet, tFound);
        super._transfer(from, to, tTransferAmount);
    }

    /**
     * Calculates the transfer and burnamount
     *
     * `tAmount` transaction amount
     */
    function _getTValues(uint256 tAmount)
        private
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        uint256 tTransferAmount = tAmount;
        uint256 tBurn = 0;
        uint256 tFound = 0;

        if (totalSupply() > BURN_STOP_SUPPLY) {
            tBurn = tAmount / 100;
            if (totalSupply() < BURN_STOP_SUPPLY + tBurn) {
                tBurn = totalSupply() - BURN_STOP_SUPPLY;
            }
        }

        tFound = (tAmount * _foundationRate) / 10**4;
        tTransferAmount = tTransferAmount - tFound - tBurn;

        return (tTransferAmount, tFound, tBurn);
    }

    /**
     * @dev Returns the address of the foundation wallet.
     */
    function foundationWallet() public view returns (address) {
        return _foundationWallet;
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
     * @dev Returns the rate of the foundation.
     */
    function foundationRate() public view returns (uint256) {
        return _foundationRate;
    }

    /**
     * @dev Sets the address of the foundation wallet.
     */
    function setFoundationRate(uint256 newRate) public onlyOwner {
        uint256 oldRate = _foundationRate;
        _foundationRate = newRate;
        emit FoundationRateChanged(oldRate, newRate);
    }
}
