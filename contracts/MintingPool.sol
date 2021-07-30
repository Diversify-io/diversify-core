import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

/**
 *
 */
contract MintingPool is Initializable, ContextUpgradeable, OwnableUpgradeable {
    using SafeERC20 for IERC20;

    // ERC20 basic token contract being held
    IERC20 private _token;

    function initialize(IERC20 token_) public initializer {
        __Ownable_init();
        _token = token_;
    }

    function retrieveTokens(address to, address anotherToken) public onlyOwner {
        require(address(_token) != anotherToken, 'You should only use this method to withdraw extraneous tokens.');
        IERC20 alienToken = IERC20(anotherToken);
        alienToken.safeTransfer(to, alienToken.balanceOf(address(this)));
    }

    function retrieveETH(address payable to) public onlyOwner {
        to.transfer(address(this).balance);
    }
}
