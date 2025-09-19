const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = require("ethers"); // need to import this library in v6 and instaed of ethers.utils.parseEther

describe("RentAgreement", function () {
  let rentAgreement;
  let owner;
  let tenant;

  before(async function () {
    [owner, tenant] = await ethers.getSigners();

    const RentAgreement = await ethers.getContractFactory("RentAgreement");
    rentAgreement = await RentAgreement.deploy(owner.address,parseEther("1"), 12);
    //await rentAgreement.deployed();
  });

  before("should allow the landlord to set the tenant", async function () {
    await rentAgreement.connect(owner).setTenant(tenant.address);
    const setTenantAddress = await rentAgreement.tenant();
    expect(setTenantAddress).to.equal(tenant.address);
    console.log(setTenantAddress);
  });

  it ("should pay first rent ", async function () {
    const rentAmount = parseEther("1");
    await rentAgreement.connect(tenant).payRent({ value: rentAmount });
    const latestBlock = await ethers.provider.getBlock("latest");
    const now = latestBlock.timestamp
    const expectedRentPaidUntil = now + 30 * 24 * 60 * 60;
    const rentPaidUntil = await rentAgreement.rentPaidUntil();

  })


  it("should allow tenant to pay next rent", async function () {
    const rentAmount = parseEther("1");
    const penaltyAmount = (rentAmount * 10n) / 100n; // previous typing in v5: const penaltyAmount = rentAmount.mul(10).div(100);
    
    //console.log("Sending totalAmount:", totalAmount.toString());
    // Increase time by 8 days
    await ethers.provider.send("evm_increaseTime", [8 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine",[]);

    const latestBlock = await ethers.provider.getBlock("latest");
    const now = latestBlock.timestamp
    const expectedRentPaidUntil = now + 30 * 24 * 60 * 60;

    const rentPaidUntil = await rentAgreement.rentPaidUntil();
    console.log(rentPaidUntil);

    const amountToPay = now > rentPaidUntil ? rentAmount + penaltyAmount : rentAmount;
    console.log(now)
    await rentAgreement.connect(tenant).payRent({ value: amountToPay });

    const newPaidUntil = await rentAgreement.rentPaidUntil();
    

    
  });

  it("should allow the landlord to withdraw rent", async function () {
    await rentAgreement.connect(tenant).payRent({ value: parseEther("1") });

    const initialBalance = await ethers.provider.getBalance(owner.address);
    await rentAgreement.connect(owner).withdrawRent();
    const newBalance = await ethers.provider.getBalance(owner.address);

    expect(newBalance).to.be.above(initialBalance);
  });
  
  it("should handle request termination correctly", async function () {
    await rentAgreement.connect(tenant).requestTermination();
    const isTerminationRequested = await rentAgreement.terminationRequested();
    expect(isTerminationRequested).to.be.true;

    

  });


});
