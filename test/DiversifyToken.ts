import { expect } from "chai";
import { BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
describe("Token contract", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const [owner] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("DiversifyToken");
    const hardhatToken = await upgrades.deployProxy(Token);
    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });
});

describe("Transactions", function () {
  it("Should transfer tokens between accounts and burn", async function () {
    const [owner, addr1, addr2] = await ethers.getSigners();
    const amount = 1000;
    const burnAmount = amount / 100;
    const Token = await ethers.getContractFactory("DiversifyToken");
    const divToken = await upgrades.deployProxy(Token);

    const totalSupply: BigNumber = await divToken.totalSupply();
    // Transfer amount tokens from owner to addr1
    await divToken.transfer(addr1.address, amount);
    expect(await divToken.balanceOf(addr1.address)).to.equal(amount - burnAmount);
    expect(await divToken.totalSupply()).to.equal(totalSupply.sub(BigNumber.from(burnAmount.toString())));
  });
});
