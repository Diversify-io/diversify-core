pragma solidity ^0.8.0;

import './RetrieveTokensFeature.sol';
import './StagedCrowdsale.sol';
import './IERC20Cutted.sol';

contract CommonSale is StagedCrowdsale, RetrieveTokensFeature {
    IERC20Cutted public token;
    uint256 public price; // amount of tokens per 1 ETH
    uint256 public invested;
    uint256 public percentRate = 100;
    address payable public wallet;
    bool public isPause = false;
    mapping(address => bool) public whitelist;

    mapping(uint256 => mapping(address => uint256)) public balances;

    mapping(uint256 => bool) public whitelistedMilestones;

    function setMilestoneWithWhitelist(uint256 index) public onlyOwner {
        whitelistedMilestones[index] = true;
    }

    function unsetMilestoneWithWhitelist(uint256 index) public onlyOwner {
        whitelistedMilestones[index] = false;
    }

    function addToWhiteList(address target) public onlyOwner {
        require(!whitelist[target], 'Already in whitelist');
        whitelist[target] = true;
    }

    function addToWhiteListMultiple(address[] memory targets) public onlyOwner {
        for (uint256 i = 0; i < targets.length; i++) {
            if (!whitelist[targets[i]]) whitelist[targets[i]] = true;
        }
    }

    function pause() public onlyOwner {
        isPause = true;
    }

    function unpause() public onlyOwner {
        isPause = false;
    }

    function setToken(address newTokenAddress) public onlyOwner {
        token = IERC20Cutted(newTokenAddress);
    }

    function setPercentRate(uint256 newPercentRate) public onlyOwner {
        percentRate = newPercentRate;
    }

    function setWallet(address payable newWallet) public onlyOwner {
        wallet = newWallet;
    }

    function setPrice(uint256 newPrice) public onlyOwner {
        price = newPrice;
    }

    function updateInvested(uint256 value) internal {
        invested = invested + (value);
    }

    function internalFallback() internal returns (uint256) {
        require(!isPause, 'Contract paused');

        uint256 milestoneIndex = currentMilestone();
        Milestone storage milestone = milestones[milestoneIndex];
        uint256 limitedInvestValue = msg.value;

        // limit the minimum amount for one transaction (ETH)
        require(limitedInvestValue >= milestone.minInvestedLimit, 'The amount is too small');

        // check if the milestone requires user to be whitelisted
        if (whitelistedMilestones[milestoneIndex]) {
            require(whitelist[_msgSender()], 'The address must be whitelisted!');
        }

        // limit the maximum amount that one user can spend during the current milestone (ETH)
        uint256 maxAllowableValue = milestone.maxInvestedLimit - balances[milestoneIndex][_msgSender()];
        if (limitedInvestValue > maxAllowableValue) {
            limitedInvestValue = maxAllowableValue;
        }
        require(limitedInvestValue > 0, 'Investment limit exceeded!');

        // apply a bonus if any (10SET)
        uint256 tokensWithoutBonus = (limitedInvestValue * price) / (1 ether);
        uint256 tokensWithBonus = tokensWithoutBonus;
        if (milestone.bonus > 0) {
            tokensWithBonus = tokensWithoutBonus + ((tokensWithoutBonus * (milestone.bonus)) / (percentRate));
        }

        // limit the number of tokens that user can buy according to the hardcap of the current milestone (10SET)
        if (milestone.tokensSold + (tokensWithBonus) > milestone.hardcapInTokens) {
            tokensWithBonus = milestone.hardcapInTokens - (milestone.tokensSold);
            if (milestone.bonus > 0) {
                tokensWithoutBonus = (tokensWithBonus * (percentRate)) / (percentRate + milestone.bonus);
            }
        }

        // calculate the resulting amount of ETH that user will spend and calculate the change if any
        uint256 tokenBasedLimitedInvestValue = (tokensWithoutBonus * (1 ether)) / (price);
        uint256 change = msg.value - tokenBasedLimitedInvestValue;

        // update stats
        invested = invested + (tokenBasedLimitedInvestValue);
        milestone.tokensSold = milestone.tokensSold + (tokensWithBonus);
        balances[milestoneIndex][_msgSender()] =
            balances[milestoneIndex][_msgSender()] +
            (tokenBasedLimitedInvestValue);

        wallet.transfer(tokenBasedLimitedInvestValue);

        // we multiply the amount to send by 100 / 98 to compensate the buyer 2% fee charged on each transaction
        token.transfer(_msgSender(), (tokensWithBonus * (100)) / (98));

        if (change > 0) {
            payable(_msgSender()).transfer(change);
        }

        return tokensWithBonus;
    }

    receive() external payable {
        internalFallback();
    }
}
