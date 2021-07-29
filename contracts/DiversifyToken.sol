// SPDX-License-Identifier: MIT
// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.0;
import 'hardhat/console.sol';
import '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

// This is the main building block for smart contracts.
contract DiversifyToken is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    event FoundationWalletTransfered(address indexed previousOwner, address indexed newOwner);

    uint256 private constant BURN_STOP_SUPPLY = 100000000 * 10**18;
    address private _foundationWallet;

    function initialize() public initializer {
        __ERC20_init('Diversify', 'DIV');
        __Ownable_init();
        _mint(msg.sender, 1000000000 * 10**decimals());
    }

    /**
     * Extend transfer with limit burn and governance wallet
     */
    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal override {
        (uint256 tTransferAmount, uint256 tBurn) = _getTValues(value);
        _burn(from, tBurn);
        super._transfer(from, to, tTransferAmount);
    }

    /**
     * Calculates the transfer and burnamount
     *
     * `tAmount` transaction amount
     */
    function _getTValues(uint256 tAmount) private view returns (uint256, uint256) {
        uint256 tTransferAmount = tAmount;
        uint256 tBurn = 0;
        uint256 tFound = 0;

        if (totalSupply() > BURN_STOP_SUPPLY) {
            tBurn = tAmount / 100;
            if (totalSupply() < BURN_STOP_SUPPLY + tBurn) {
                tBurn = totalSupply() - BURN_STOP_SUPPLY;
            }
            tTransferAmount = tTransferAmount - tBurn;
        }

        return (tTransferAmount, tBurn);
    }

    /**
     * @dev Returns the address of the foundation wallet.
     */
    function foundationWallet() public view returns (address) {
        return _foundationWallet;
    }

    function setFoundationWallet(address newFoundationWallet) public onlyOwner {
        address oldWallet = newFoundationWallet;
        _foundationWallet = newFoundationWallet;
        emit FoundationWalletTransfered(oldWallet, newFoundationWallet);
    }
}
