var BNDESToken      = artifacts.require("./BNDESToken.sol");
var BNDESRegistry   = artifacts.require("./BNDESRegistry.sol");
var expectThrow     = require('./helper.js');

var cnpjClient              = 1111;
var cnpjAnotherClient       = 2222;
var cnpjDonor               = 3333;
var cnpjAnotherDonor        = 4444;

var amountBooked            = 10000;

var subCreditoCliente       = 12345670001;
var subCreditoAnotherClient = 12345670002;

contract('BNDESToken', function (accounts) {

  var bndesAddr                = accounts[0];
  var clientAddr               = accounts[1];
  var donorAddr                = accounts[2];
  var anotherDonorAddr         = accounts[3];
  var anotherClientAddr        = accounts[4];
  var changeClientAddr         = accounts[5];
  var changeDonorAddr  = accounts[6];
  

  it("[SETUP] should call the owner of BNDESRegistry instance", async () => {
    bndesRegistryInstance = await BNDESRegistry.new();
    
    let ownerAddress = await bndesRegistryInstance.owner.call();
   
    assert.notEqual(ownerAddress, "0x0", "Address should not be 0x0");
    assert.notEqual(ownerAddress, undefined, "Address should not be undefined");

  });    
  
  it("[SETUP] should run a BNDESRegistry simple transaction", async () => {
    
    await bndesRegistryInstance.setResponsibleForDisbursement(bndesAddr);    
    
  });    
  
  it("[SETUP] should create a BNDESToken instance and run a simple call", async () => {

    bndesTokenInstance = await BNDESToken.new(bndesRegistryInstance.address, 2);
    let decimals = await bndesTokenInstance.getDecimals.call();
    
    assert.equal(decimals, 2, "The decimals number should be 2");    

  });      

   it("[SETUP] should set a reference to BNDESToken in the BNDESRegistry", async () => {
   
    await bndesRegistryInstance.setTokenAddress( bndesTokenInstance.address );    

  });     

  it("[REGISTRY] should create a DONOR BNDESToken registration", async () => {

    let idProofHash = "e96c7ffef33869246069ebcb32bc72a59fb488c4893c9eb9b3306de7ba74f6d8"
    await bndesTokenInstance.registryLegalEntity( cnpjDonor, 0, idProofHash, { from: donorAddr } );    
    let cnpjReturned = await bndesRegistryInstance.getCNPJ(donorAddr);
    assert.equal(cnpjReturned, cnpjDonor, "The retrieved CNPJ should be " + cnpjDonor );    

  });   

  it("[REGISTRY] should check BNDESRegistry DONOR validation", async () => {

    let validatedDonor = await bndesRegistryInstance.isValidatedDonor( donorAddr );
    assert.equal(validatedDonor, false, "The DONOR should NOT be valid " + donorAddr );    

  });  

   it("[REGISTRY] should validate a DONOR BNDESRegistry registration", async () => {

    let idProofHash = "e96c7ffef33869246069ebcb32bc72a59fb488c4893c9eb9b3306de7ba74f6d8"
    await bndesRegistryInstance.validateRegistryLegalEntity( donorAddr, idProofHash );    
    let validatedDonor = await bndesRegistryInstance.isValidatedDonor( donorAddr );
    assert.equal(validatedDonor, true, "The DONOR should be valid " + donorAddr );    

  });  

  it("[REGISTRY] should create a another DONOR BNDESToken registration", async () => {

    let idProofHash = "1620e4f0e0f6bd1d9a52488244d95778e2663ff3eebf795917ded6954c4d3bd2"
    await bndesTokenInstance.registryLegalEntity( cnpjAnotherDonor, 0, idProofHash, { from: anotherDonorAddr } );    
    let cnpjReturned = await bndesRegistryInstance.getCNPJ(anotherDonorAddr);
    assert.equal(cnpjReturned, cnpjAnotherDonor, "The retrieved CNPJ should be " + cnpjAnotherDonor );    
    await bndesRegistryInstance.validateRegistryLegalEntity( anotherDonorAddr, idProofHash );    
    let validatedDonor = await bndesRegistryInstance.isValidatedDonor( anotherDonorAddr );
    assert.equal(validatedDonor, true, "The another DONOR should be valid " + anotherDonorAddr );        

  });     

  
   it("[REGISTRY] should create a CLIENT BNDESToken registration", async () => {

    let idProofHash = "35c3ad1f0a2e1c105effb946a06ddc53abcee2b92ffb97043325818290f0e99f"
    await bndesTokenInstance.registryLegalEntity( cnpjClient, subCreditoCliente, idProofHash, { from: clientAddr } );    
    let cnpjReturned = await bndesRegistryInstance.getCNPJ(clientAddr);
    assert.equal(cnpjReturned, cnpjClient, "The retrieved CNPJ should be " + cnpjClient );    

  });   

   it("[REGISTRY] should check BNDESRegistry CLIENT validation", async () => {

    let validatedClient = await bndesRegistryInstance.isValidatedClient( clientAddr );
    assert.equal(validatedClient, false, "The CLIENT should NOT be valid " + clientAddr );    

  });  

   it("[REGISTRY] should validate a CLIENT BNDESRegistry registration", async () => {

    let idProofHash = "35c3ad1f0a2e1c105effb946a06ddc53abcee2b92ffb97043325818290f0e99f"
    await bndesRegistryInstance.validateRegistryLegalEntity( clientAddr, idProofHash );    
    let validatedClient = await bndesRegistryInstance.isValidatedClient( clientAddr );
    assert.equal(validatedClient, true, "The CLIENT should be valid " + clientAddr );    

  });  

  it("[REGISTRY] should create a another CLIENT BNDESToken registration", async () => {

    let idProofHash = "bc214ab54cbba561cf48b12e7d16c73da596d29400f8f736a5133106f305292f"
    await bndesTokenInstance.registryLegalEntity( cnpjAnotherClient, subCreditoAnotherClient, idProofHash, { from: anotherClientAddr } );    
    let cnpjReturned = await bndesRegistryInstance.getCNPJ(anotherClientAddr);
    assert.equal(cnpjReturned, cnpjAnotherClient, "The retrieved CNPJ should be " + cnpjAnotherClient );    
    await bndesRegistryInstance.validateRegistryLegalEntity( anotherClientAddr, idProofHash );    
    let validatedClient = await bndesRegistryInstance.isValidatedClient( anotherClientAddr );
    assert.equal(validatedClient, true, "The another CLIENT should be valid " + anotherClientAddr );        

  });       

  it("[FLOW - BASIC] should book a BNDESToken donation", async () => {    
    
    await bndesTokenInstance.bookDonation( amountBooked , { from: donorAddr } );        
    let amountReturned = await bndesTokenInstance.bookedBalanceOf(donorAddr);
    assert.equal(amountReturned, amountBooked, "The DONOR should have a booked balance of " + amountBooked + " but found " + amountReturned);    
    
  });  

  it("[FLOW - BASIC] should confirm a BNDESToken donation", async () => {
    
    await bndesTokenInstance.confirmDonation( donorAddr, amountBooked );        
    let amountReturned = await bndesTokenInstance.bookedBalanceOf(donorAddr);
    let amountConfirmed = await bndesTokenInstance.confirmedBalanceOf(bndesAddr);
    assert.equal(amountReturned, 0, "The BNDES should have confirmed a donation of " + amountBooked );        
    assert.equal(amountConfirmed, amountBooked, "The BNDES should have confirmed a donation of " + amountBooked );        
        
  });  

  it("[FLOW - BASIC] should make a BNDESToken disbursement", async () => {

    await bndesTokenInstance.makeDisbursement( clientAddr, amountBooked );            
    let bndesBalance  = await bndesTokenInstance.confirmedBalanceOf( bndesAddr   );
    let clientBalance = await bndesTokenInstance.confirmedBalanceOf( clientAddr );
    assert.equal(bndesBalance, 0,             "The BNDES should have a zero balance.");
    assert.equal(clientBalance, amountBooked, "The CLIENT should have received a " + amountBooked );        
        
  });  

  it("[FLOW - BASIC] should request a BNDESToken redemption and settle it", async () => {
    let disbOneOK = await bndesTokenInstance.redeem( amountBooked, { from: clientAddr } );
    if ( disbOneOK ) {
      let hashOneForClient = "c0158aa06cdca979a42065b343d0d1c91fdf15e78ed5533324ab5e5f29d95b56";
      let hashTwoForClient = "6d9b3ee0014141b751ed927dcc86eee200a521a48e56d986efd9e2df277ad21f";
      await bndesTokenInstance.notifyRedemptionSettlement( hashOneForClient, hashTwoForClient );
    }
    else {
      assert.fail('Redeem of disbursement for CLIENT has failed!');
    }    
        
  });  
 
  it("[FLOW - COMPLETE] should run the entire flow of BNDESToken with 3 donations from 2 donors for 2 clients", async () => {    
    
    let donationTenFromDonor           = 10;
    let donationFiveFromDonor          = 5;
    let donationTwentyFromAnotherDonor = 20;
    let totalDonationBooked            = donationTenFromDonor + donationFiveFromDonor + donationTwentyFromAnotherDonor;
    await bndesTokenInstance.bookDonation( donationTenFromDonor           , { from: donorAddr } );    
    await bndesTokenInstance.bookDonation( donationTwentyFromAnotherDonor , { from: anotherDonorAddr } );
    await bndesTokenInstance.bookDonation( donationFiveFromDonor          , { from: donorAddr } );
    let amountReturned = await bndesTokenInstance.getBookedTotalSupply.call();
    assert.equal(amountReturned, totalDonationBooked, "The total booked donated should be " + totalDonationBooked + " but found " + amountReturned);    
    await bndesTokenInstance.confirmDonation( donorAddr, ( donationTenFromDonor + donationFiveFromDonor) );        
    await bndesTokenInstance.confirmDonation( anotherDonorAddr, donationTwentyFromAnotherDonor );        
    let disbursementOne = donationTenFromDonor + donationTwentyFromAnotherDonor;
    let disbursementTwo = donationFiveFromDonor;
    await bndesTokenInstance.makeDisbursement( clientAddr, disbursementOne );
    await bndesTokenInstance.makeDisbursement( anotherClientAddr, disbursementTwo );

    let disbOneOK = await bndesTokenInstance.redeem( disbursementOne, { from: clientAddr } );
    if ( disbOneOK ) {
      let hashOneForClient = "c0158aa06cdca979a42065b343d0d1c91fdf15e78ed5533324ab5e5f29d95b56";
      let hashTwoForClient = "6d9b3ee0014141b751ed927dcc86eee200a521a48e56d986efd9e2df277ad21f";
      await bndesTokenInstance.notifyRedemptionSettlement( hashOneForClient, hashTwoForClient );
    }
    else {
      assert.fail('Redeem of disbursement for CLIENT has failed!');
    }
    let disbTwoOK = await bndesTokenInstance.redeem( disbursementTwo, { from: anotherClientAddr } );
    if ( disbTwoOK ) {
      let hashOneForAnotherClient = "389de4a1ced8f1fc1b055672704aab962d7315b6272a988ba65e960fe51bd606";
      let hashTwoForAnotherClient = "9cae52dc9cd276161f55ccb96e363762c24ad908f293ec0e2d736467f6334823";
      await bndesTokenInstance.notifyRedemptionSettlement( hashOneForAnotherClient, hashTwoForAnotherClient );
    }
    else {
      assert.fail('Redeem of disbursement for another CLIENT has failed!');
    }

    let finalBookedSupply = await bndesTokenInstance.getBookedTotalSupply.call();
    assert.equal(finalBookedSupply, 0, "The total booked donated should be " + 0 + " but found " + finalBookedSupply);
    let finalConfirmedSupply = await bndesTokenInstance.getConfirmedTotalSupply.call();
    assert.equal(finalConfirmedSupply, 0, "The total confirmed donated should be " + 0 + " but found " + finalConfirmedSupply);
    
  });    

   it("[REGISTRY] should enable and change BNDESRegistry CLIENT address", async () => {

    await bndesRegistryInstance.enableChangeAccount( clientAddr );    
    let idProofHash = "35c3ad1f0a2e1c105effb946a06ddc53abcee2b92ffb97043325818290f0e99f";
    await bndesTokenInstance.changeAccountLegalEntity( cnpjClient, subCreditoCliente, idProofHash, { from: changeClientAddr } );    
    let cnpjReturned = await bndesRegistryInstance.getCNPJ(changeClientAddr);
    assert.equal(cnpjReturned, cnpjClient, "The retrieved CNPJ should be " + cnpjClient );    

  });

   it("[REGISTRY] should enable and change BNDESRegistry DONOR address and keep its sum of donations", async () => {

    let donationOne = 1;
    let donationTwo = 2;    
    let idProofHash = "b227cbb8356f83e06292f1a4951728ef446bf190507bd0b42a9fb85ce59a32e3";
    await bndesTokenInstance.bookDonation( donationOne , { from: donorAddr } );    
    await bndesRegistryInstance.enableChangeAccount( donorAddr );        
    await bndesTokenInstance.changeAccountLegalEntity( cnpjDonor, 0, idProofHash, { from: changeDonorAddr } );    
    await bndesRegistryInstance.validateRegistryLegalEntity( changeDonorAddr, idProofHash );    
    await bndesTokenInstance.bookDonation( donationTwo , { from: changeDonorAddr } );
    await bndesTokenInstance.confirmDonation( changeDonorAddr, (donationOne + donationTwo) );  

  });  

  
  /*
  it("should run a BNDESToken simple transaction", async () => {
    
    //await bndesTokenInstance.redeem(bndesTokenInstance.address, 0);    
    
    
  });  
 */ 
  
  
  
});

