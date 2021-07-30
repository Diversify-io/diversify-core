pragma solidity ^0.8.0;

import './CommonSale.sol';
import './TenSetToken.sol';
import './FreezeTokenWallet.sol';
import './RetrieveTokensFeature.sol';
import './TokenDistributor.sol';

/**
 * @dev Contract-helper for TenSetToken deployment and token distribution.
 *
 * 1. Company Reserve (10%): 21,000,000 10SET. The total freezing period is 48 months.
 *    Every 12 months, 25% of the initial amount will be unfrozen and ready for
 *    withdrawal using address 0x7BD3b301f3537c75bf64B7468998d20045cfa48e.
 *
 * 2. Team (10%): 21,000,000 10SET. The total freezing period is 30 months.
 *    Every 3 months, 10% of the initial amount will be unfrozen and ready for
 *    withdrawal using address 0x44C4A8d57B22597a2c0397A15CF1F32d8A4EA8F7.
 *
 * 3. Marketing (5%): 10,500,000 10SET.
 *    A half (5,250,000 10SET) will be transferred immediately to the address
 *    0x127D069DC8B964a813889D349eD3dA3f6D35383D.
 *    The remaining 5,250,000 10SET will be frozen for 12 months.
 *    Every 3 months, 25% of the initial amount will be unfrozen and ready for
 *    withdrawal using address 0x127D069DC8B964a813889D349eD3dA3f6D35383D.
 *
 * 4. Sales: 150,000,000 10SET (147,000,000 10SET plus compensation for the
 *    initial 2% transferring costs). These tokens will be distributed between
 *    the CommonSale contract and existing users who participated in the first phase of the sale.
 *
 * 5. Liquidity Reserve: 7,500,000 10SET (10,500,000 10SET minus tokens that
 *    went to compensation in paragraph 4). The entire amount will be unfrozen
 *    from the start and sent to the address 0x91E84302594deFaD552938B6D0D56e9f39908f9F.
 */
contract TokenReplacementConfigurator is RetrieveTokensFeature {
    using SafeMath for uint256;

    uint256 private constant COMPANY_RESERVE_AMOUNT = 21000000 * 1 ether;
    uint256 private constant TEAM_AMOUNT = 21000000 * 1 ether;
    uint256 private constant MARKETING_AMOUNT_1 = 5250000 * 1 ether;
    uint256 private constant MARKETING_AMOUNT_2 = 5250000 * 1 ether;
    uint256 private constant LIQUIDITY_RESERVE = 7500000 * 1 ether;

    address private constant OWNER_ADDRESS = address(0x68CE6F1A63CC76795a70Cf9b9ca3f23293547303);
    address private constant TEAM_WALLET_OWNER_ADDRESS = address(0x44C4A8d57B22597a2c0397A15CF1F32d8A4EA8F7);
    address private constant MARKETING_WALLET_ADDRESS = address(0x127D069DC8B964a813889D349eD3dA3f6D35383D);
    address private constant COMPANY_RESERVE_ADDRESS = address(0x7BD3b301f3537c75bf64B7468998d20045cfa48e);
    address private constant LIQUIDITY_WALLET_ADDRESS = address(0x91E84302594deFaD552938B6D0D56e9f39908f9F);
    address private constant DEPLOYER_ADDRESS = address(0x6E9DC3D20B906Fd2B52eC685fE127170eD2165aB);

    uint256 private constant STAGE1_START_DATE = 1612116000; // Jan 31 2021 19:00:00 GMT+0100

    TenSetToken public token;
    FreezeTokenWallet public companyReserveWallet;
    FreezeTokenWallet public teamWallet;
    FreezeTokenWallet public marketingWallet;
    TokenDistributor public tokenDistributor;

    constructor() public {
        address[] memory addresses = new address[](6);
        uint256[] memory amounts = new uint256[](5);

        companyReserveWallet = new FreezeTokenWallet();
        teamWallet = new FreezeTokenWallet();
        marketingWallet = new FreezeTokenWallet();
        tokenDistributor = new TokenDistributor();

        addresses[0] = address(companyReserveWallet);
        amounts[0] = COMPANY_RESERVE_AMOUNT;
        addresses[1] = address(teamWallet);
        amounts[1] = TEAM_AMOUNT;
        addresses[2] = MARKETING_WALLET_ADDRESS;
        amounts[2] = MARKETING_AMOUNT_1;
        addresses[3] = address(marketingWallet);
        amounts[3] = MARKETING_AMOUNT_2;
        addresses[4] = LIQUIDITY_WALLET_ADDRESS;
        amounts[4] = LIQUIDITY_RESERVE;
        // will receive the remaining tokens to distribute them between CommonSale contract
        // and existing users who participated in the first phase of the sale.
        addresses[5] = address(tokenDistributor);

        token = new TenSetToken(addresses, amounts);

        companyReserveWallet.setToken(address(token));
        companyReserveWallet.setStartDate(STAGE1_START_DATE);
        companyReserveWallet.setDuration(1440); // 4 years = 48 months = 1440 days
        companyReserveWallet.setInterval(360); // 12 months = 360 days
        companyReserveWallet.start();

        teamWallet.setToken(address(token));
        teamWallet.setStartDate(STAGE1_START_DATE);
        teamWallet.setDuration(900); // 2.5 years = 30 months = 900 days
        teamWallet.setInterval(90); // 3 months = 90 days
        teamWallet.start();

        marketingWallet.setToken(address(token));
        marketingWallet.setStartDate(STAGE1_START_DATE);
        marketingWallet.setDuration(360); // 1 year = 12 months = 360 days
        marketingWallet.setInterval(90); // 3 months = 90 days
        marketingWallet.start();

        tokenDistributor.setToken(address(token));

        token.transferOwnership(OWNER_ADDRESS);
        companyReserveWallet.transferOwnership(COMPANY_RESERVE_ADDRESS);
        teamWallet.transferOwnership(TEAM_WALLET_OWNER_ADDRESS);
        marketingWallet.transferOwnership(MARKETING_WALLET_ADDRESS);
        tokenDistributor.transferOwnership(DEPLOYER_ADDRESS);
    }
}
