// SPDX-License-Identifier: MIT
// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.4;
import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

// This is the main building block for smart contracts.
contract DiversifyToken is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    uint256 private constant BURN_STOP_SUPPLY = 100000000 * 10**18;

    function initialize() public initializer {
        __ERC20_init("Diversify", "DIV");
        __Ownable_init();
        _mint(msg.sender, 1000000000 * 10**decimals());
    }

    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal override {
        (uint256 tTransferAmount, uint256 tBurn) = _getTValues(value);
        console.log(tBurn);
        _burn(from, tBurn);
        super._transfer(from, to, tTransferAmount);
    }

    function _getTValues(uint256 tAmount)
        private
        view
        returns (uint256, uint256)
    {
        uint256 tTransferAmount = tAmount;
        uint256 tBurn = 0;
        if (totalSupply() > BURN_STOP_SUPPLY) {
            tBurn = tAmount / 100;
            if (totalSupply() < BURN_STOP_SUPPLY + tBurn) {
                tBurn = totalSupply() - BURN_STOP_SUPPLY;
            }
            tTransferAmount = tTransferAmount - tBurn;
        }
        return (tTransferAmount, tBurn);
    }
}
