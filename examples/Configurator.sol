// SPDX-License-Identifier: MIT
/*
pragma solidity ^0.8.0;

import './token/Diversify_V1.sol';
import './vaults/CommunityRewardVault.sol';
import './vaults/PublicSaleVault.sol';
import './sales/SeedSaleRound.sol';
import './utils/TimelockedIntervalDistributedTokenWallet.sol';
import './utils/RetrieveTokensFeature.sol';

contract Configurator is RetrieveTokensFeature {
    uint256 private constant MAX = ~uint256(0);

    uint256 private constant COMPANY_RESERVE_AMOUNT = 21000000 * 1 ether;
    uint256 private constant TEAM_AMOUNT = 21000000 * 1 ether;
    uint256 private constant MARKETING_AMOUNT = 10500000 * 1 ether;
    uint256 private constant LIQUIDITY_RESERVE = 10500000 * 1 ether;
    uint256 private constant SALE_AMOUNT = uint256(147000000 * 1 ether * 100) / 98;

    address private constant OWNER_ADDRESS = address(0x68CE6F1A63CC76795a70Cf9b9ca3f23293547303);
    address private constant TEAM_WALLET_OWNER_ADDRESS = address(0x44C4A8d57B22597a2c0397A15CF1F32d8A4EA8F7);
    address private constant MARKETING_WALLET_ADDRESS = address(0x127D069DC8B964a813889D349eD3dA3f6D35383D);
    address private constant COMPANY_RESERVE_ADDRESS = address(0x7BD3b301f3537c75bf64B7468998d20045cfa48e);
    address private constant LIQUIDITY_WALLET_ADDRESS = address(0x91E84302594deFaD552938B6D0D56e9f39908f9F);
    address payable constant ETH_WALLET_ADDRESS = payable(0x68CE6F1A63CC76795a70Cf9b9ca3f23293547303);
    address private constant DEPLOYER_ADDRESS = address(0x6E9DC3D20B906Fd2B52eC685fE127170eD2165aB);

    uint256 private constant PRICE = 10000 * 1 ether; // 1 ETH = 10000 10SET

    uint256 private constant STAGE1_START_DATE = 1612116000; // Jan 31 2021 19:00:00 GMT+0100
    uint256 private constant STAGE1_END_DATE = 1612720800; // Feb 07 2021 19:00:00 GMT+0100
    uint256 private constant STAGE1_BONUS = 10;
    uint256 private constant STAGE1_MIN_INVESTMENT = 1 * 10**17; // 0.1 ETH
    uint256 private constant STAGE1_MAX_INVESTMENT = 40 * 1 ether; // 40 ETH
    uint256 private constant STAGE1_TOKEN_HARDCAP = 11000000 * 1 ether;

    uint256 private constant STAGE2_START_DATE = 1615140000; // Mar 07 2021 19:00:00 GMT+0100
    uint256 private constant STAGE2_END_DATE = 1615744800; // Mar 14 2021 19:00:00 GMT+0100
    uint256 private constant STAGE2_BONUS = 5;
    uint256 private constant STAGE2_MIN_INVESTMENT = 0.1 * 1 ether; // 0.1 ETH
    uint256 private constant STAGE2_MAX_INVESTMENT = 100 * 1 ether; // 100 ETH
    uint256 private constant STAGE2_TOKEN_HARDCAP = 52500000 * 1 ether;

    uint256 private constant STAGE3_START_DATE = 1615744800; // Mar 14 2021 19:00:00 GMT+0100
    uint256 private constant STAGE3_END_DATE = 253374588000; // Feb 14 9999 07:00:00 GMT+0100
    uint256 private constant STAGE3_BONUS = 0;
    uint256 private constant STAGE3_MIN_INVESTMENT = 0; // 0 ETH
    uint256 private constant STAGE3_MAX_INVESTMENT = MAX;
    uint256 private constant STAGE3_TOKEN_HARDCAP = 80000000 * 1 ether;

    address[] private addresses;
    uint256[] private amounts;

    Diversify_V1 public token;
    PublicSaleVault public freezeWallet;
    SeedSaleRound public commonSale;

    constructor() public {
        // create instances
        freezeWallet = new PublicSaleVault();
        commonSale = new SeedSaleRound();

        addresses.push(COMPANY_RESERVE_ADDRESS);
        amounts.push(COMPANY_RESERVE_AMOUNT);
        addresses.push(address(freezeWallet));
        amounts.push(TEAM_AMOUNT);
        addresses.push(MARKETING_WALLET_ADDRESS);
        amounts.push(MARKETING_AMOUNT);
        addresses.push(address(commonSale));
        amounts.push(SALE_AMOUNT);
        addresses.push(LIQUIDITY_WALLET_ADDRESS);
        amounts.push(0); // will receive the remaining tokens (should be slightly less than LIQUIDITY_RESERVE)

        token = new Diversify_V1(addresses, amounts);

        commonSale.setToken(address(token));
        commonSale.setPrice(PRICE);
        commonSale.setWallet(ETH_WALLET_ADDRESS);
        commonSale.addMilestone(
            STAGE1_START_DATE,
            STAGE1_END_DATE,
            STAGE1_BONUS,
            STAGE1_MIN_INVESTMENT,
            STAGE1_MAX_INVESTMENT,
            0,
            0,
            STAGE1_TOKEN_HARDCAP
        );
        commonSale.setMilestoneWithWhitelist(0);
        commonSale.addMilestone(
            STAGE2_START_DATE,
            STAGE2_END_DATE,
            STAGE2_BONUS,
            STAGE2_MIN_INVESTMENT,
            STAGE2_MAX_INVESTMENT,
            0,
            0,
            STAGE2_TOKEN_HARDCAP
        );
        commonSale.setMilestoneWithWhitelist(1);
        commonSale.addMilestone(
            STAGE3_START_DATE,
            STAGE3_END_DATE,
            STAGE3_BONUS,
            STAGE3_MIN_INVESTMENT,
            STAGE3_MAX_INVESTMENT,
            0,
            0,
            STAGE3_TOKEN_HARDCAP
        );

        freezeWallet.setToken(address(token));
        freezeWallet.setStartDate(STAGE1_START_DATE);
        freezeWallet.setDuration(900); // 2.5 years = 30 months = 900 days
        freezeWallet.setInterval(90); // 3 months = 90 days
        freezeWallet.start();

        token.transferOwnership(OWNER_ADDRESS);
        freezeWallet.transferOwnership(TEAM_WALLET_OWNER_ADDRESS);
        commonSale.transferOwnership(DEPLOYER_ADDRESS);
    }
}
*/