// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RentAgreement{
    address payable public landlord;
    address public tenant;
    uint public rentAmount;
    uint public startTimeStamp;
    uint public durationMonths;
    uint public rentPaidUntil;
    bool public isTerminated;
    uint public constant penalityRate = 10;
    uint public constant gracePeriodDay = 7 days;
    bool public terminationRequested = false;
    address public terminationRequester;

    event RentPaid (address tenenat, uint amount, uint paidUntil, uint penalty);
    event TerminationRequested (address requester);
    event agreementTerminated(address termintor);

    modifier onlyLandlord () {
        require (msg.sender == landlord,"you are not the landlord of the proprety");
        _;
    }

    modifier onlyTenant () {
        require (msg.sender == tenant,"you are not the tenant of the proprety");
        _;
    }

    modifier notTerminated () {
        require (!isTerminated,"contract not terminated yet");
        _;
    }

    modifier notTerminationRequester () {
        require (msg.sender != terminationRequester,"Requester cannot approve termination");
        _;
    }



    constructor (address _landlord, uint256 _rentAmount, uint _durationMonths){
        require(_landlord != address(0) ,"Invalid address of the landlord");
        landlord = payable(_landlord);
        rentAmount = _rentAmount;
        durationMonths = _durationMonths;
        startTimeStamp = block.timestamp;
    }
    
    function setTenant (address _tenant) external onlyLandlord notTerminated {
        require (tenant == address(0), "tenant already set");
        tenant = _tenant;
    }

    function payRent () external payable onlyTenant notTerminated {
        require (!terminationRequested, "the contract is pending closure");
        require (block.timestamp < startTimeStamp + (durationMonths * 30 days), "contract is expired");
        uint currentMonth = (block.timestamp - startTimeStamp)/30 days;
        uint paymentDueDate = startTimeStamp + (currentMonth*30 days) + (gracePeriodDay*1 days);
        uint penality = 0;

        if (block.timestamp > paymentDueDate) {
          penality = (rentAmount * penalityRate)/100;  
        }

        require (msg.value == rentAmount + penality, "Incorrect Amount, penalty may apply");
        rentPaidUntil = block.timestamp + 30 days;

        emit RentPaid(msg.sender,msg.value,rentPaidUntil,penality);
    }

    function withdrawRent () external onlyLandlord {
        require (!terminationRequested, "the contract is pending closure");
        uint amount = address(this).balance;
        require (amount > 0 , " No funds to withdraw");
        landlord.transfer(amount);
    }
    
    function requestTermination () external notTerminated {
        require (msg.sender == landlord || msg.sender == tenant , "only landlord or tenant request termination");
        require (!terminationRequested, " termination already requested");
        terminationRequested = true;
        terminationRequester = msg.sender;
        emit TerminationRequested(msg.sender);

    }

    function approveTermination () external notTerminated notTerminationRequester {
        require (terminationRequested, "No termination requested");
        terminationRequested = true;
        emit agreementTerminated(msg.sender);
        transferBalanceToLnadlord();
    }

    function transferBalanceToLnadlord () private {
        uint balance = address(this).balance;
        (bool sent,) = landlord.call{value: balance}("");
        require (sent, "failed to transfer ether");

    }

}