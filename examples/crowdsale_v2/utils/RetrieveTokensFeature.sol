import '@openzeppelin/contracts/utils/Context.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '../IERC20Cutted.sol';

contract RetrieveTokensFeature is Context, Ownable {
    function retrieveTokens(address to, address anotherToken) public virtual onlyOwner {
        IERC20Cutted alienToken = IERC20Cutted(anotherToken);
        alienToken.transfer(to, alienToken.balanceOf(address(this)));
    }

    function retriveETH(address payable to) public virtual onlyOwner {
        to.transfer(address(this).balance);
    }
}
