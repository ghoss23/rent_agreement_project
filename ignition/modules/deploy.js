// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules"); // define the deployement module 

const RENT_AMOUNT = 1_000_000_000n;
const DURATION_MONTHS  = 12 ; 

module.exports = buildModule("RentAgreement" ,(m)=> {
  const landlordAddress = m.getParameter("landlordAdress","0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  const rentAmount = m.getParameter("rentAmount", RENT_AMOUNT);
  const durationMonths = m.getParameter ("durationMonths",DURATION_MONTHS); // name of the variables should be the same as the smart contract

  const rentAgreement = m.contract("RentAgreement", [landlordAddress, rentAmount,durationMonths]);

  return { rentAgreement };

})