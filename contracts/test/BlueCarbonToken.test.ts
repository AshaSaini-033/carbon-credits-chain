import { expect } from "chai";
import { ethers } from "hardhat";
import { BlueCarbonToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BlueCarbonToken", function () {
  let token: BlueCarbonToken;
  let owner: SignerWithAddress;
  let minter: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();
    
    const BlueCarbonToken = await ethers.getContractFactory("BlueCarbonToken");
    token = await BlueCarbonToken.deploy("Blue Carbon Credit", "BCC", owner.address);
    await token.waitForDeployment();
    
    // Grant minter role
    const MINTER_ROLE = await token.MINTER_ROLE();
    await token.grantRole(MINTER_ROLE, minter.address);
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await token.name()).to.equal("Blue Carbon Credit");
      expect(await token.symbol()).to.equal("BCC");
    });

    it("Should grant admin role to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint tokens", async function () {
      const amount = ethers.parseEther("100");
      const mrvCid = "QmTestCID123";
      
      await expect(token.connect(minter).mint(user1.address, amount, mrvCid))
        .to.emit(token, "TokensMinted")
        .withArgs(user1.address, amount, mrvCid);
      
      expect(await token.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should not allow non-minter to mint tokens", async function () {
      const amount = ethers.parseEther("100");
      
      await expect(token.connect(user1).mint(user2.address, amount, "test"))
        .to.be.revertedWith("AccessControl:");
    });
  });

  describe("Retirement", function () {
    beforeEach(async function () {
      // Mint some tokens to user1
      const amount = ethers.parseEther("100");
      await token.connect(minter).mint(user1.address, amount, "testCid");
    });

    it("Should allow token holder to retire tokens", async function () {
      const retireAmount = ethers.parseEther("50");
      const reason = "Corporate offsetting Q4 2024";
      
      await expect(token.connect(user1).retire(retireAmount, reason))
        .to.emit(token, "TokensRetired")
        .withArgs(user1.address, retireAmount, reason);
      
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
      expect(await token.totalRetired()).to.equal(retireAmount);
      expect(await token.retiredByAccount(user1.address)).to.equal(retireAmount);
    });

    it("Should not allow retiring more than balance", async function () {
      const retireAmount = ethers.parseEther("200");
      
      await expect(token.connect(user1).retire(retireAmount, "test"))
        .to.be.revertedWith("Insufficient balance");
    });

    it("Should track total retired tokens", async function () {
      const retireAmount1 = ethers.parseEther("30");
      const retireAmount2 = ethers.parseEther("20");
      
      // Mint to user2 as well
      await token.connect(minter).mint(user2.address, ethers.parseEther("50"), "testCid2");
      
      await token.connect(user1).retire(retireAmount1, "test1");
      await token.connect(user2).retire(retireAmount2, "test2");
      
      expect(await token.totalRetired()).to.equal(retireAmount1 + retireAmount2);
    });
  });

  describe("Pause functionality", function () {
    it("Should pause and unpause", async function () {
      await token.connect(owner).pause();
      
      // Should not be able to mint when paused
      await expect(token.connect(minter).mint(user1.address, 100, "test"))
        .to.be.revertedWith("Pausable: paused");
      
      await token.connect(owner).unpause();
      
      // Should work after unpause
      await expect(token.connect(minter).mint(user1.address, 100, "test"))
        .to.not.be.reverted;
    });
  });
});