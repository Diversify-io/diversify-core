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
    function initialize() public initializer {
        __ERC20_init("DiversifyToken", "DIV");
        __Ownable_init();
        _mint(msg.sender, 1000000000 * 10**decimals());
    }

    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal override {
        uint256 tokensToBurn = (value / 100);
        uint256 tokensToTransfer = value - tokensToBurn;
        _burn(from, tokensToBurn);
        super._transfer(from, to, tokensToTransfer);
    }
}
