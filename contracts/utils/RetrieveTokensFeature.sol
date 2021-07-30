// SPDX-License-Identifier: MIT
import '@openzeppelin/contracts/utils/Context.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

/**
 * A wallet like contract that allows owner to collect all tokens that the contract holds
 */
contract RetrieveTokensFeature is Context, Ownable {
    using SafeERC20 for IERC20;

    function retrieveTokens(address to, address anotherToken) public virtual onlyOwner {
        IERC20 alienToken = IERC20(anotherToken);
        alienToken.safeTransfer(to, alienToken.balanceOf(address(this)));
    }

    function retrieveETH(address payable to) public virtual onlyOwner {
        to.transfer(address(this).balance);
    }
}
