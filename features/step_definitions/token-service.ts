import { Given, Then, When } from "@cucumber/cucumber";
import { accounts } from "../../src/config";
import { AccountBalanceQuery, AccountId, Client, PrivateKey, TokenCreateTransaction, TokenInfoQuery, TransferTransaction ,
  Hbar, TokenMintTransaction,TokenAssociateTransaction,
  TokenAirdropTransaction
} from "@hashgraph/sdk";
import assert from "node:assert";

const client = Client.forTestnet()

let StorTokenId : any;
let StorSupplyKey : any;
let StorTxTransfer : any ;
let recordfee : any;

Given(/^A Hedera account with more than (\d+) hbar$/, async function (expectedBalance: number) {
  const account = accounts[0]
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(account.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

//Create the query request
  const query = new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID);
  const balance = await query.execute(client)
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance);
});
When(/^I create a token named Test Token \(HTT\)$/, async function () {
  const account = accounts[0]
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(account.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

  // Generate supply key
  const supplyKey = PrivateKey.generate();


  const txTokenCreate = await new TokenCreateTransaction()
  .setTokenName("Test Token")
  .setTokenSymbol("HTT")
  .setDecimals(2)
  .setTreasuryAccountId(MY_ACCOUNT_ID)
  .setSupplyKey(supplyKey)
  .freezeWith(client);

  //Sign the transaction with the token treasury account private key
  const signTxTokenCreate =  await txTokenCreate.sign(MY_PRIVATE_KEY);
  //Sign the transaction with the client operator private key and submit to a Hedera network
  const txTokenCreateResponse = await signTxTokenCreate.execute(client);
  //Get the receipt of the transaction
  const receiptTokenCreateTx = await txTokenCreateResponse.getReceipt(client);
  //Get the token ID from the receipt
  const tokenId :any = receiptTokenCreateTx.tokenId;

  StorTokenId = tokenId ;

  //Get the transaction consensus status
  const statusTokenCreateTx = receiptTokenCreateTx.status;
  //Get the Transaction ID
  const txTokenCreateId = txTokenCreateResponse.transactionId.toString();

  console.log("\x1b[33m Token Creation :\x1b[0m");
  console.log("\x1b[1m Receipt status                 : \x1b[0m","\x1b[32m"+statusTokenCreateTx.toString()+"\x1b[0m");
  console.log("\x1b[1m Token ID                       : \x1b[0m", tokenId.toString());
  //console.log("Transaction ID           :", txTokenCreateId);
  //console.log("Hashscan URL             :", "https://hashscan.io/testnet/tx/" + txTokenCreateId);

  //console.log("Supply Key:", supplyKey.toStringRaw()); 
   StorSupplyKey=supplyKey;
});
Then(/^The token has the name "([^"]*)"$/, async function (name:string) {
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  console.log("\x1b[1m Token has the name            : \x1b[0m", tokenInfoQueryResponse.name.toString());
});
Then(/^The token has the symbol "([^"]*)"$/, async function (symbol:string) {
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  console.log("\x1b[1m Token has the symbol          : \x1b[0m", tokenInfoQueryResponse.symbol.toString());
});
Then(/^The token has (\d+) decimals$/, async function (decimals:number) {
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  console.log("\x1b[01m Token has                    : \x1b[0m", tokenInfoQueryResponse.decimals.toString()," decimals");
});
Then(/^The token is owned by the account$/, async function () {
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  console.log("\x1b[1m Token is owned by the account: \x1b[0m", tokenInfoQueryResponse.treasuryAccountId?.toString());
});
Then(/^An attempt to mint (\d+) additional tokens succeeds$/, async function (MintAmount:number) {
  const txTokenMint = await new TokenMintTransaction()
      .setTokenId(StorTokenId) //Fill in the token ID
      .setAmount(MintAmount)
      .freezeWith(client);

    //Sign with the supply private key of the token 
    const signTxTokenMint = await txTokenMint.sign(StorSupplyKey); //Fill in the supply private key
    //Submit the transaction to a Hedera network    
    const txTokenMintResponse = await signTxTokenMint.execute(client);
    //Request the receipt of the transaction
    const receiptTokenMintTx = await txTokenMintResponse.getReceipt(client);   
    //Get the transaction consensus status
    const statusTokenMintTx = receiptTokenMintTx.status;
    //Get the Transaction ID
    const txTokenMintId = txTokenMintResponse.transactionId.toString();

    console.log(" \x1b[33m mint 100 additional tokens : \x1b[0m");
    console.log(" \x1b[1m Receipt status           : \x1b[0m","\x1b[32m"+ statusTokenMintTx.toString()+"\x1b[0m");
    //console.log("Transaction ID           :", txTokenMintId);
    //console.log("Hashscan URL             :", "https://hashscan.io/testnet/tx/" + txTokenMintId);

});
When(/^I create a fixed supply token named Test Token \(HTT\) with (\d+) tokens$/, async function (TokenAmount : number) {
  const account = accounts[0]
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(account.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);
  const supplyKey = PrivateKey.generate();

  const txTokenCreate = await new TokenCreateTransaction()
  .setTokenName("Test Token")
  .setTokenSymbol("HTT")
  .setDecimals(2)
  .setTreasuryAccountId(MY_ACCOUNT_ID)
  .setInitialSupply(TokenAmount)
  .setSupplyKey(supplyKey)
  .freezeWith(client);

  //Sign the transaction with the token treasury account private key
  const signTxTokenCreate =  await txTokenCreate.sign(MY_PRIVATE_KEY);
  //Sign the transaction with the client operator private key and submit to a Hedera network
  const txTokenCreateResponse = await signTxTokenCreate.execute(client);
  //Get the receipt of the transaction
  const receiptTokenCreateTx = await txTokenCreateResponse.getReceipt(client);
  //Get the token ID from the receipt
  const tokenId :any = receiptTokenCreateTx.tokenId;

  StorTokenId = tokenId ;

  //Get the transaction consensus status
  const statusTokenCreateTx = receiptTokenCreateTx.status;
  //Get the Transaction ID
  const txTokenCreateId = txTokenCreateResponse.transactionId.toString();

  console.log("\x1b[33m Fixed supply Token Creation :\x1b[0m");
  console.log("\x1b[1m Receipt status                 : \x1b[0m","\x1b[32m"+statusTokenCreateTx.toString()+"\x1b[0m");
  console.log("\x1b[1m Token ID                       : \x1b[0m", tokenId.toString());
  //console.log("Transaction ID           :", txTokenCreateId);
  //console.log("Hashscan URL             :", "https://hashscan.io/testnet/tx/" + txTokenCreateId);

});
Then(/^The total supply of the token is (\d+)$/, async function (TokenAmount:number) {
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  console.log("\x1b[1m The total supply of the token is : \x1b[0m",tokenInfoQueryResponse.totalSupply.toString());

});
Then(/^An attempt to mint tokens fails$/, async function () {
  try {
  const txTokenMint = await new TokenMintTransaction()
      .setTokenId(StorTokenId) //Fill in the token ID
      .freezeWith(client);

    //Sign with the supply private key of the token 
    const signTxTokenMint = await txTokenMint.sign(StorSupplyKey); //Fill in the supply private key
    //Submit the transaction to a Hedera network    
    const txTokenMintResponse = await signTxTokenMint.execute(client);
    //Request the receipt of the transaction
    const receiptTokenMintTx = await txTokenMintResponse.getReceipt(client);  
    //Get the transaction consensus status
    const statusTokenMintTx = receiptTokenMintTx.status;
    //Get the Transaction ID
    const txTokenMintId = txTokenMintResponse.transactionId.toString();

  } catch {
    console.log("\x1b[33m Mint fixed supply tokens : \x1b[0m");
    console.log(" \x1b[1m Receipt status             : \x1b[0m","\x1b[31m FAILS \x1b[0m");
}
    
});
Given(/^A first hedera account with more than (\d+) hbar$/, async function (expectedBalance: number) {
  const account = accounts[1]
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(account.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

  //Create the query request
  const query = new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID);
  const balance = await query.execute(client)
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance)
});
Given(/^A second Hedera account$/, async function () {
  const account = accounts[2]
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(account.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);
});
Given(/^A token named Test Token \(HTT\) with (\d+) tokens$/, async function (TokenAmount:number) {
  const account = accounts[0]
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(account.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);


  const txTokenCreate = await new TokenCreateTransaction()
  .setTokenName("Test Token test ")
  .setTokenSymbol("HTT")
  .setDecimals(2)
  .setTreasuryAccountId(MY_ACCOUNT_ID)
  .setInitialSupply(TokenAmount)
  .freezeWith(client);

  //Sign the transaction with the token treasury account private key
  const signTxTokenCreate =  await txTokenCreate.sign(MY_PRIVATE_KEY);
  //Sign the transaction with the client operator private key and submit to a Hedera network
  const txTokenCreateResponse = await signTxTokenCreate.execute(client);
  //Get the receipt of the transaction
  const receiptTokenCreateTx = await txTokenCreateResponse.getReceipt(client);
  //Get the token ID from the receipt
  const tokenId :any = receiptTokenCreateTx.tokenId;
  StorTokenId = tokenId ;
  //Get the transaction consensus status
  const statusTokenCreateTx = receiptTokenCreateTx.status;
  //Get the Transaction ID
  const txTokenCreateId = txTokenCreateResponse.transactionId.toString();

  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);

console.log("\x1b[33m Token named \x1b[0m ", tokenInfoQueryResponse.name.toString(),"(",tokenInfoQueryResponse.symbol.toString(),")","\x1b[33m with \x1b[0m",tokenInfoQueryResponse.totalSupply.toString(),"\x1b[33m tokens \x1b[0m");

});
Given(/^The first account holds (\d+) HTT tokens$/,{ timeout: 10000 }, async function (TokenAmount:number) {
  const acc = accounts[0]
  const MY_ACCOUNT_ID = AccountId.fromString(acc.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(acc.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

  const acc_1 = accounts[1]
  const MY_ACCOUNT_1_ID = AccountId.fromString(acc_1.id);
  const MY_PRIVATE_1_KEY = PrivateKey.fromStringED25519(acc_1.privateKey);
  const acc_2 = accounts[2]
  const MY_ACCOUNT_2_ID = AccountId.fromString(acc_2.id);
  const MY_PRIVATE_2_KEY = PrivateKey.fromStringED25519(acc_2.privateKey);

  // CHECKING IF THE ACCOUNT IS ASSOCIATED WITH THE TOKEN
  const account1Info = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_2_ID).execute(client);
if (!account1Info.tokens?.get(StorTokenId)) {
  const txTokenAssociate1 = await new TokenAssociateTransaction()
  .setAccountId(MY_ACCOUNT_1_ID)
  .setTokenIds([StorTokenId]) //Fill in the token ID
  .freezeWith(client);
  //Sign with the private key of the account that is being associated to a token 
  const signTxTokenAssociate1 = await txTokenAssociate1.sign(MY_PRIVATE_1_KEY);
  //Submit the transaction to a Hedera network    
  const txTokenAssociateResponse1 = await signTxTokenAssociate1.execute(client);
  //Request the receipt of the transaction
  const receiptTokenAssociateTx1 = await txTokenAssociateResponse1.getReceipt(client);
  //Get the transaction consensus status
  const statusTokenAssociateTx1 = receiptTokenAssociateTx1.status;
  //Get the Transaction ID
  const txTokenAssociateId1 = txTokenAssociateResponse1.transactionId.toString();
}

  const account2Balance :any = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_2_ID).execute(client);
if(account2Balance.tokens?.get(StorTokenId) == null){
    const txTransfer = await new TransferTransaction()
    .addTokenTransfer(StorTokenId, MY_ACCOUNT_ID, -100) //Fill in the token ID 
    .addTokenTransfer(StorTokenId, MY_ACCOUNT_1_ID, 100) //Fill in the token ID and receiver account
    .freezeWith(client);
    //Sign with the sender account private key
    const signTxTransfer = await txTransfer.sign(MY_PRIVATE_KEY);
    //Sign with the client operator private key and submit to a Hedera network
    const txTransferResponse = await signTxTransfer.execute(client);
    //Request the receipt of the transaction
    const receiptTransferTx = await txTransferResponse.getReceipt(client);
    //Obtain the transaction consensus status
    const statusTransferTx = receiptTransferTx.status;
    //Get the Transaction ID
    const txTransferId = txTransferResponse.transactionId.toString();
  }

  const account1Balance :any = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_1_ID).execute(client);   
try{ 
    const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
    const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
    console.log("\x1b[34m  The First Account holds : \x1b[0m",account1Balance.tokens?.get(StorTokenId).toString(),"(",tokenInfoQueryResponse.symbol.toString(),")","\x1b[34m  Tokens \x1b[0m");
    // console.log("Receipt status           :", statusTransferTx.toString());
    //console.log("Transaction ID           :", txTransferId);
    //console.log("Hashscan URL             :", "https://hashscan.io/testnet/tx/" + txTransferId);
}
catch{
      const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
    const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
    console.error("\x1b[34m  The First Account holds : \x1b[0m 0 ","(",tokenInfoQueryResponse.symbol.toString(),")","\x1b[34m  Tokens \x1b[0m");
}

});
Given(/^The second account holds (\d+) HTT tokens$/,{ timeout: 10000 }, async function (TokenAmount:number) {
  const acc = accounts[0]
  const MY_ACCOUNT_ID = AccountId.fromString(acc.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(acc.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

  const acc_1 = accounts[1]
  const MY_ACCOUNT_1_ID = AccountId.fromString(acc_1.id);
  const MY_PRIVATE_1_KEY = PrivateKey.fromStringED25519(acc_1.privateKey);

  const acc_2 = accounts[2]
  const MY_ACCOUNT_2_ID = AccountId.fromString(acc_2.id);
  const MY_PRIVATE_2_KEY = PrivateKey.fromStringED25519(acc_2.privateKey);

  // CHECKING IF THE ACCOUNT IS ASSOCIATED WITH THE TOKEN
  const account2Info = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_2_ID).execute(client);
if (!account2Info.tokens?.get(StorTokenId)) {

  const txTokenAssociate1 = await new TokenAssociateTransaction()
  .setAccountId(MY_ACCOUNT_2_ID)
  .setTokenIds([StorTokenId]) //Fill in the token ID
  .freezeWith(client);
  //Sign with the private key of the account that is being associated to a token 
  const signTxTokenAssociate1 = await txTokenAssociate1.sign(MY_PRIVATE_2_KEY);
  //Submit the transaction to a Hedera network    
  const txTokenAssociateResponse1 = await signTxTokenAssociate1.execute(client);
  //Request the receipt of the transaction
  const receiptTokenAssociateTx1 = await txTokenAssociateResponse1.getReceipt(client);
  //Get the transaction consensus status
  const statusTokenAssociateTx1 = receiptTokenAssociateTx1.status;
  //Get the Transaction ID
  const txTokenAssociateId1 = txTokenAssociateResponse1.transactionId.toString();
}

  const account1Balance :any = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_1_ID).execute(client);
if(account1Balance.tokens?.get(StorTokenId) == null){
    const txTransfer = await new TransferTransaction()
    .addTokenTransfer(StorTokenId, MY_ACCOUNT_ID, -100) //Fill in the token ID 
    .addTokenTransfer(StorTokenId, MY_ACCOUNT_2_ID, 100) //Fill in the token ID and receiver account
    .freezeWith(client);
    //Sign with the sender account private key
    const signTxTransfer = await txTransfer.sign(MY_PRIVATE_KEY);
    //Sign with the client operator private key and submit to a Hedera network
    const txTransferResponse = await signTxTransfer.execute(client);
    //Request the receipt of the transaction
    const receiptTransferTx = await txTransferResponse.getReceipt(client);
    //Obtain the transaction consensus status
    const statusTransferTx = receiptTransferTx.status;
    //Get the Transaction ID
    const txTransferId = txTransferResponse.transactionId.toString();
 }
  const account2Balance :any = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_2_ID).execute(client);
try{ 
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  console.log("\x1b[34m  The Second Account holds : \x1b[0m",account2Balance.tokens?.get(StorTokenId).toString(),"(",tokenInfoQueryResponse.symbol.toString(),")","\x1b[34m  Tokens \x1b[0m");
  // console.log("Receipt status           :", statusTransferTx.toString());
  //console.log("Transaction ID           :", txTransferId);
  //console.log("Hashscan URL             :", "https://hashscan.io/testnet/tx/" + txTransferId);
}
catch{
    const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  console.error("\x1b[34m  The Second Account holds : \x1b[0m 0 ","(",tokenInfoQueryResponse.symbol.toString(),")","\x1b[34m  Tokens \x1b[0m");
}
  
});
When(/^The first account creates a transaction to transfer (\d+) HTT tokens to the second account$/, async function (TokenAmount:number) {
  const acc_1 = accounts[1]
  const MY_ACCOUNT_1_ID = AccountId.fromString(acc_1.id);
  const MY_PRIVATE_1_KEY = PrivateKey.fromStringED25519(acc_1.privateKey);
  client.setOperator(MY_ACCOUNT_1_ID, MY_PRIVATE_1_KEY);

  const acc_2 = accounts[2]
  const MY_ACCOUNT_2_ID = AccountId.fromString(acc_2.id);
  const MY_PRIVATE_2_KEY = PrivateKey.fromStringED25519(acc_2.privateKey);

  //Create the transfer transaction
  const txTransfer = await new TransferTransaction()
  .addTokenTransfer(StorTokenId, MY_ACCOUNT_1_ID, -10) //Fill in the token ID 
  .addTokenTransfer(StorTokenId,MY_ACCOUNT_2_ID, 10) //Fill in the token ID and receiver account
  .freezeWith(client);
  StorTxTransfer = txTransfer;
  console.log("\x1b[33m  The First account transfer to the Second account  10 (HTT) : \x1b[0m");
});
When(/^The first account submits the transaction$/, async function () {
  const acc_1 = accounts[1]
  const MY_PRIVATE_1_KEY = PrivateKey.fromStringED25519(acc_1.privateKey);

  //Sign with the sender account private key
  const signTxTransfer = await StorTxTransfer.sign(MY_PRIVATE_1_KEY);
  //Sign with the client operator private key and submit to a Hedera network
  const txTransferResponse = await signTxTransfer.execute(client);
  //Request the receipt of the transaction
  const receiptTransferTx = await txTransferResponse.getReceipt(client);
  //Obtain the transaction consensus status
  const statusTransferTx = receiptTransferTx.status;
  //Get the Transaction ID
  const txTransferId = txTransferResponse.transactionId.toString();

  // get the payer id
  const record = await txTransferResponse.getRecord(client);
  // stor the payer id
  recordfee=record;
});
When(/^The second account creates a transaction to transfer (\d+) HTT tokens to the first account$/, async function (TokenAmount:number) {
  const acc_1 = accounts[1]
  const MY_ACCOUNT_1_ID = AccountId.fromString(acc_1.id);
  const MY_PRIVATE_1_KEY = PrivateKey.fromStringED25519(acc_1.privateKey);
  client.setOperator(MY_ACCOUNT_1_ID, MY_PRIVATE_1_KEY);

  const acc_2 = accounts[2]
  const MY_ACCOUNT_2_ID = AccountId.fromString(acc_2.id);
  const MY_PRIVATE_2_KEY = PrivateKey.fromStringED25519(acc_2.privateKey);

  //Create the transfer transaction
  const txTransfer = await new TransferTransaction()
  .addTokenTransfer(StorTokenId, MY_ACCOUNT_2_ID, -10) //Fill in the token ID 
  .addTokenTransfer(StorTokenId,MY_ACCOUNT_1_ID, 10) //Fill in the token ID and receiver account
  .freezeWith(client);
  const first_signTxTransfer = await txTransfer.sign(MY_PRIVATE_2_KEY);

  StorTxTransfer = first_signTxTransfer;
  console.log("\x1b[33m The Second account transfer to the First account  10 (HTT) : \x1b[0m");
});
Then(/^The first account has paid for the transaction fee$/, async function () {
  console.log("\x1b[33m The First account has paid for the transaction fee :\x1b[0m");  
  console.log("\x1b[1m Fee payer ID : \x1b[0m", recordfee.transactionId.accountId.toString());
});
Given(/^A first hedera account with more than (\d+) hbar and (\d+) HTT tokens$/,{ timeout: 10000 }, async function (expectedBalance:number,TokenAmount:number) {
  const acc = accounts[0]
  const MY_ACCOUNT_ID = AccountId.fromString(acc.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(acc.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

  const acc_1 = accounts[1]
  const MY_ACCOUNT_1_ID = AccountId.fromString(acc_1.id);
  const MY_PRIVATE_1_KEY = PrivateKey.fromStringED25519(acc_1.privateKey);

  //Create the query request
  const query = new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID);
  const balance = await query.execute(client)
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance)

  const txTokenAssociate1 = await new TokenAssociateTransaction()
 .setAccountId(MY_ACCOUNT_1_ID)
 .setTokenIds([StorTokenId]) //Fill in the token ID
 .freezeWith(client);
 //Sign with the private key of the account that is being associated to a token 
 const signTxTokenAssociate1 = await txTokenAssociate1.sign(MY_PRIVATE_1_KEY);
 //Submit the transaction to a Hedera network    
 const txTokenAssociateResponse1 = await signTxTokenAssociate1.execute(client);
 //Request the receipt of the transaction
 const receiptTokenAssociateTx1 = await txTokenAssociateResponse1.getReceipt(client);
 //Get the transaction consensus status
 const statusTokenAssociateTx1 = receiptTokenAssociateTx1.status;
 //Get the Transaction ID
 const txTokenAssociateId1 = txTokenAssociateResponse1.transactionId.toString();

  const txTransfer = await new TransferTransaction()
  .addTokenTransfer(StorTokenId, MY_ACCOUNT_ID, -100) //Fill in the token ID 
  .addTokenTransfer(StorTokenId, MY_ACCOUNT_1_ID, 100) //Fill in the token ID and receiver account
  .freezeWith(client);
  //Sign with the sender account private key
  const signTxTransfer = await txTransfer.sign(MY_PRIVATE_KEY);
  //Sign with the client operator private key and submit to a Hedera network
  const txTransferResponse = await signTxTransfer.execute(client);
  //Request the receipt of the transaction
  const receiptTransferTx = await txTransferResponse.getReceipt(client);
  //Obtain the transaction consensus status
  const statusTransferTx = receiptTransferTx.status;
  //Get the Transaction ID
  const txTransferId = txTransferResponse.transactionId.toString();

  const account1Balance :any = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_1_ID).execute(client);   
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  console.log("\x1b[36m A First hedera account with \x1b[0m ", `${balance.hbars.toBigNumber().toNumber()} \x1b[36m ℏ \x1b[0m`,"\x1b[36m and \x1b[0m ", `${account1Balance.tokens?.get(StorTokenId).toString()} ` ,`${tokenInfoQueryResponse.symbol.toString()} \x1b[36m tokens \x1b[0m `)
});
Given(/^A second Hedera account with (\d+) hbar and (\d+) HTT tokens$/,{ timeout: 10000 }, async function (expectedBalance:number, TokenAmount:number) {
  const acc = accounts[0]
  const MY_ACCOUNT_ID = AccountId.fromString(acc.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(acc.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

  const acc_2 = accounts[2]
  const MY_ACCOUNT_2_ID = AccountId.fromString(acc_2.id);
  const MY_PRIVATE_2_KEY = PrivateKey.fromStringED25519(acc_2.privateKey);

  const txTokenAssociate1 = await new TokenAssociateTransaction()
.setAccountId(MY_ACCOUNT_2_ID)
.setTokenIds([StorTokenId]) //Fill in the token ID
.freezeWith(client);
//Sign with the private key of the account that is being associated to a token 
const signTxTokenAssociate1 = await txTokenAssociate1.sign(MY_PRIVATE_2_KEY);
//Submit the transaction to a Hedera network    
const txTokenAssociateResponse1 = await signTxTokenAssociate1.execute(client);
//Request the receipt of the transaction
const receiptTokenAssociateTx1 = await txTokenAssociateResponse1.getReceipt(client);
//Get the transaction consensus status
const statusTokenAssociateTx1 = receiptTokenAssociateTx1.status;
//Get the Transaction ID
const txTokenAssociateId1 = txTokenAssociateResponse1.transactionId.toString();

  const txTransfer = await new TransferTransaction()
  .addTokenTransfer(StorTokenId, MY_ACCOUNT_ID, -100) //Fill in the token ID 
  .addTokenTransfer(StorTokenId, MY_ACCOUNT_2_ID, 100) //Fill in the token ID and receiver account
  .freezeWith(client);
  //Sign with the sender account private key
  const signTxTransfer = await txTransfer.sign(MY_PRIVATE_KEY);
  //Sign with the client operator private key and submit to a Hedera network
  const txTransferResponse = await signTxTransfer.execute(client);
  //Request the receipt of the transaction
  const receiptTransferTx = await txTransferResponse.getReceipt(client);
  //Obtain the transaction consensus status
  const statusTransferTx = receiptTransferTx.status;
  //Get the Transaction ID
  const txTransferId = txTransferResponse.transactionId.toString();

  const account2Balance :any = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_2_ID).execute(client);   
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  console.log("\x1b[36m A Second hedera account with \x1b[0m",account2Balance.hbars?.toBigNumber().toString()," \x1b[36m ℏ  and \x1b[0m ", `${account2Balance.tokens?.get(StorTokenId).toString()} `,`${tokenInfoQueryResponse.symbol.toString()} \x1b[36m tokens \x1b[0m `);


});
Given(/^A third Hedera account with (\d+) hbar and (\d+) HTT tokens$/,{ timeout: 10000 }, async function (expectedBalance:number, TokenAmount:number) {
  const acc = accounts[0]
  const MY_ACCOUNT_ID = AccountId.fromString(acc.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(acc.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

  const acc_3 = accounts[3]
  const MY_ACCOUNT_3_ID = AccountId.fromString(acc_3.id);
  const MY_PRIVATE_3_KEY = PrivateKey.fromStringED25519(acc_3.privateKey);

  const txTokenAssociate1 = await new TokenAssociateTransaction()
.setAccountId(MY_ACCOUNT_3_ID)
.setTokenIds([StorTokenId]) //Fill in the token ID
.freezeWith(client);
//Sign with the private key of the account that is being associated to a token 
const signTxTokenAssociate1 = await txTokenAssociate1.sign(MY_PRIVATE_3_KEY);
//Submit the transaction to a Hedera network    
const txTokenAssociateResponse1 = await signTxTokenAssociate1.execute(client);
//Request the receipt of the transaction
const receiptTokenAssociateTx1 = await txTokenAssociateResponse1.getReceipt(client);
//Get the transaction consensus status
const statusTokenAssociateTx1 = receiptTokenAssociateTx1.status;
//Get the Transaction ID
const txTokenAssociateId1 = txTokenAssociateResponse1.transactionId.toString();

  const txTransfer = await new TransferTransaction()
  .addTokenTransfer(StorTokenId, MY_ACCOUNT_ID, -100) //Fill in the token ID 
  .addTokenTransfer(StorTokenId, MY_ACCOUNT_3_ID, 100) //Fill in the token ID and receiver account
  .freezeWith(client);
  //Sign with the sender account private key
  const signTxTransfer = await txTransfer.sign(MY_PRIVATE_KEY);
  //Sign with the client operator private key and submit to a Hedera network
  const txTransferResponse = await signTxTransfer.execute(client);
  //Request the receipt of the transaction
  const receiptTransferTx = await txTransferResponse.getReceipt(client);
  //Obtain the transaction consensus status
  const statusTransferTx = receiptTransferTx.status;
  //Get the Transaction ID
  const txTransferId = txTransferResponse.transactionId.toString();

  const account3Balance :any = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_3_ID).execute(client);   
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  console.log("\x1b[36m A Third hedera account with \x1b[0m",account3Balance.hbars?.toBigNumber().toString()," \x1b[36m ℏ  and \x1b[0m ", `${account3Balance.tokens?.get(StorTokenId).toString()} `,`${tokenInfoQueryResponse.symbol.toString()} \x1b[36m tokens \x1b[0m `);


});
Given(/^A fourth Hedera account with (\d+) hbar and (\d+) HTT tokens$/,{ timeout: 10000 }, async function (expectedBalance:number, TokenAmount:number) {
  const acc = accounts[0]
  const MY_ACCOUNT_ID = AccountId.fromString(acc.id);
  const MY_PRIVATE_KEY = PrivateKey.fromStringED25519(acc.privateKey);
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

  const acc_4 = accounts[4]
  const MY_ACCOUNT_4_ID = AccountId.fromString(acc_4.id);
  const MY_PRIVATE_4_KEY = PrivateKey.fromStringED25519(acc_4.privateKey);

  const txTokenAssociate1 = await new TokenAssociateTransaction()
.setAccountId(MY_ACCOUNT_4_ID)
.setTokenIds([StorTokenId]) //Fill in the token ID
.freezeWith(client);
//Sign with the private key of the account that is being associated to a token 
const signTxTokenAssociate1 = await txTokenAssociate1.sign(MY_PRIVATE_4_KEY);
//Submit the transaction to a Hedera network    
const txTokenAssociateResponse1 = await signTxTokenAssociate1.execute(client);
//Request the receipt of the transaction
const receiptTokenAssociateTx1 = await txTokenAssociateResponse1.getReceipt(client);
//Get the transaction consensus status
const statusTokenAssociateTx1 = receiptTokenAssociateTx1.status;
//Get the Transaction ID
const txTokenAssociateId1 = txTokenAssociateResponse1.transactionId.toString();

  const txTransfer = await new TransferTransaction()
  .addTokenTransfer(StorTokenId, MY_ACCOUNT_ID, -100) //Fill in the token ID 
  .addTokenTransfer(StorTokenId, MY_ACCOUNT_4_ID, 100) //Fill in the token ID and receiver account
  .freezeWith(client);
  //Sign with the sender account private key
  const signTxTransfer = await txTransfer.sign(MY_PRIVATE_KEY);
  //Sign with the client operator private key and submit to a Hedera network
  const txTransferResponse = await signTxTransfer.execute(client);
  //Request the receipt of the transaction
  const receiptTransferTx = await txTransferResponse.getReceipt(client);
  //Obtain the transaction consensus status
  const statusTransferTx = receiptTransferTx.status;
  //Get the Transaction ID
  const txTransferId = txTransferResponse.transactionId.toString();

  const account4Balance :any = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_4_ID).execute(client);   
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  console.log("\x1b[36m A Fourth hedera account with \x1b[0m",account4Balance.hbars?.toBigNumber().toString()," \x1b[36m ℏ  and \x1b[0m ", `${account4Balance.tokens?.get(StorTokenId).toString()} `,`${tokenInfoQueryResponse.symbol.toString()} \x1b[36m tokens \x1b[0m `);



});
When(/^A transaction is created to transfer (\d+) HTT tokens out of the first and second account and (\d+) HTT tokens into the third account and (\d+) HTT tokens into the fourth account$/,{ timeout: 10000 }, async function (TokenAmount1:number,TokenAmount2:number,TokenAmount3:number) {
  const acc_1 = accounts[1]
  const MY_ACCOUNT_1_ID = AccountId.fromString(acc_1.id);

  const acc_2 = accounts[2]
  const MY_ACCOUNT_2_ID = AccountId.fromString(acc_2.id);
  const MY_PRIVATE_2_KEY = PrivateKey.fromStringED25519(acc_2.privateKey);

  const acc_3 = accounts[3]
  const MY_ACCOUNT_3_ID = AccountId.fromString(acc_3.id);

  const acc_4 = accounts[4]
  const MY_ACCOUNT_4_ID = AccountId.fromString(acc_4.id);

  // Create the token multi party token transaction
  const txTransfer = await new TransferTransaction()
    .addTokenTransfer(StorTokenId, MY_ACCOUNT_1_ID, -10)
    .addTokenTransfer(StorTokenId, MY_ACCOUNT_3_ID, 5)
    .addTokenTransfer(StorTokenId, MY_ACCOUNT_2_ID, -10)
    .addTokenTransfer(StorTokenId, MY_ACCOUNT_4_ID, 15)
    .freezeWith(client);
      
  const first_SignedTx = await txTransfer.sign(MY_PRIVATE_2_KEY);
  StorTxTransfer = first_SignedTx;

  console.log("\x1b[33m transfer 10 HTT tokens out of the first and second account and 5 HTT tokens into the third account and 15 HTT tokens into the fourth account:\x1b[0m");

});
Then(/^The third account holds (\d+) HTT tokens$/, async function (TokenAmount:number) {
  const acc_3 = accounts[3]
  const MY_ACCOUNT_3_ID = AccountId.fromString(acc_3.id);
  const MY_PRIVATE_3_KEY = PrivateKey.fromStringED25519(acc_3.privateKey);

  const account3Balance :any = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_3_ID).execute(client);   
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  console.log("\x1b[34m  The First Account holds : \x1b[0m",account3Balance.tokens?.get(StorTokenId).toString(),"(",tokenInfoQueryResponse.symbol.toString(),")","\x1b[34m  Tokens \x1b[0m");

});
Then(/^The fourth account holds (\d+) HTT tokens$/, async function (TokenAmount:number) {
  const acc_4 = accounts[4]
  const MY_ACCOUNT_4_ID = AccountId.fromString(acc_4.id);
  const MY_PRIVATE_4_KEY = PrivateKey.fromStringED25519(acc_4.privateKey);

  const account4Balance :any = await new AccountBalanceQuery().setAccountId(MY_ACCOUNT_4_ID).execute(client);   
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  console.log("\x1b[34m  The First Account holds : \x1b[0m",account4Balance.tokens?.get(StorTokenId).toString(),"(",tokenInfoQueryResponse.symbol.toString(),")","\x1b[34m  Tokens \x1b[0m");


});
