pragma solidity ^0.8.0;

import './RetrieveTokensFeature.sol';
import '../IERC20Cutted.sol';

contract FreezeTokenWallet is RetrieveTokensFeature {
    IERC20Cutted public token;

    // Define receiver wallet, address

    bool public started;
    uint256 public startDate;
    uint256 public startBalance;
    uint256 public duration;
    uint256 public interval;
    uint256 public retrievedTokens;

    modifier notStarted() {
        require(!started);
        _;
    }

    function setStartDate(uint256 newStartDate) public onlyOwner notStarted {
        startDate = newStartDate;
    }

    function setDuration(uint256 newDuration) public onlyOwner notStarted {
        duration = newDuration * 1 days;
    }

    function setInterval(uint256 newInterval) public onlyOwner notStarted {
        interval = newInterval * 1 days;
    }

    function setToken(address newToken) public onlyOwner notStarted {
        token = IERC20Cutted(newToken);
    }

    function start() public onlyOwner notStarted {
        startBalance = token.balanceOf(address(this));
        started = true;
    }

    function retrieveWalletTokens(address to) public onlyOwner {
        require(started && block.timestamp >= startDate);
        if (block.timestamp >= startDate + duration) {
            token.transfer(to, token.balanceOf(address(this)));
        } else {
            uint256 parts = duration / interval;
            uint256 tokensByPart = startBalance / parts;
            uint256 timeSinceStart = block.timestamp - startDate;
            uint256 pastParts = timeSinceStart / interval;
            uint256 tokensToRetrieveSinceStart = pastParts * tokensByPart;
            uint256 tokensToRetrieve = tokensToRetrieveSinceStart - retrievedTokens;
            require(tokensToRetrieve > 0, 'No tokens available for retrieving at this moment.');
            retrievedTokens = retrievedTokens + tokensToRetrieve;
            token.transfer(to, tokensToRetrieve);
        }
    }

    function retrieveTokens(address to, address anotherToken) public override onlyOwner {
        require(address(token) != anotherToken, 'You should only use this method to withdraw extraneous tokens.');
        super.retrieveTokens(to, anotherToken);
    }
}
