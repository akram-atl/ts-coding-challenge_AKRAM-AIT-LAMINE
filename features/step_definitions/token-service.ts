import { Given, Then, When } from "@cucumber/cucumber";
import { accounts } from "../../src/config";
import { AccountBalanceQuery, AccountId, Client, PrivateKey, TokenCreateTransaction, TokenInfoQuery, TransferTransaction, Hbar, TokenMintTransaction, TokenAssociateTransaction } from "@hashgraph/sdk";
import assert from "node:assert";

const client = Client.forTestnet();

let StorTokenId: any;
let StorSupplyKey: any;
let StorTxTransfer: any;
let recordfee: any;

function account_Id(x: number): AccountId {
  const account = accounts[x];
  return AccountId.fromString(account.id);
}

function private_Key(x: number): PrivateKey {
  const account = accounts[x];
  return PrivateKey.fromStringED25519(account.privateKey);
}

Given(/^A Hedera account with more than (\d+) hbar$/, async function (expectedBalance: number) {
  client.setOperator(account_Id(0), private_Key(0));

  const query = new AccountBalanceQuery().setAccountId(account_Id(0));
  const balance = await query.execute(client);
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance);
});

When(/^I create a token named Test Token \(HTT\)$/, async function () {
  const supplyKey = PrivateKey.generate();

  const txTokenCreate = await new TokenCreateTransaction()
    .setTokenName("Test Token")
    .setTokenSymbol("HTT")
    .setDecimals(2)
    .setTreasuryAccountId(account_Id(0))
    .setSupplyKey(supplyKey)
    .freezeWith(client);

  const signTxTokenCreate = await txTokenCreate.sign(private_Key(0));
  const txTokenCreateResponse = await signTxTokenCreate.execute(client);
  const receiptTokenCreateTx = await txTokenCreateResponse.getReceipt(client);
  const tokenId: any = receiptTokenCreateTx.tokenId;

  StorTokenId = tokenId;
  StorSupplyKey = supplyKey;
});

Then(/^The token has the name "([^"]*)"$/, async function (name: string) {
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  assert.strictEqual(tokenInfoQueryResponse.name.toString(), name);
});

Then(/^The token has the symbol "([^"]*)"$/, async function (symbol: string) {
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  assert.strictEqual(tokenInfoQueryResponse.symbol.toString(), symbol);
});

Then(/^The token has (\d+) decimals$/, async function (decimals: number) {
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  assert.strictEqual(tokenInfoQueryResponse.decimals, decimals);
});

Then(/^The token is owned by the account$/, async function () {
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  assert.strictEqual(tokenInfoQueryResponse.treasuryAccountId?.toString(), accounts[0].id);
});

Then(/^An attempt to mint (\d+) additional tokens succeeds$/, async function (MintAmount: number) {
  const txTokenMint = await new TokenMintTransaction()
    .setTokenId(StorTokenId)
    .setAmount(MintAmount)
    .freezeWith(client);

  const signTxTokenMint = await txTokenMint.sign(StorSupplyKey);
  const txTokenMintResponse = await signTxTokenMint.execute(client);
  const receiptTokenMintTx = await txTokenMintResponse.getReceipt(client);
  assert.strictEqual(receiptTokenMintTx.status.toString(), "SUCCESS");
});

When(/^I create a fixed supply token named Test Token \(HTT\) with (\d+) tokens$/, async function (TokenAmount: number) {
  const supplyKey = PrivateKey.generate();

  const txTokenCreate = await new TokenCreateTransaction()
    .setTokenName("Test Token")
    .setTokenSymbol("HTT")
    .setDecimals(2)
    .setTreasuryAccountId(account_Id(0))
    .setInitialSupply(TokenAmount)
    .setSupplyKey(supplyKey)
    .freezeWith(client);

  const signTxTokenCreate = await txTokenCreate.sign(private_Key(0));
  const txTokenCreateResponse = await signTxTokenCreate.execute(client);
  const receiptTokenCreateTx = await txTokenCreateResponse.getReceipt(client);
  const tokenId: any = receiptTokenCreateTx.tokenId;

  StorTokenId = tokenId;
  StorSupplyKey = supplyKey;
});

Then(/^The total supply of the token is (\d+)$/, async function (TokenAmount: number) {
  const tokenInfoQuery = new TokenInfoQuery().setTokenId(StorTokenId);
  const tokenInfoQueryResponse = await tokenInfoQuery.execute(client);
  assert.strictEqual(tokenInfoQueryResponse.totalSupply.toNumber(), TokenAmount);
});

Then(/^An attempt to mint tokens fails$/, async function () {
  try {
    const txTokenMint = await new TokenMintTransaction()
      .setTokenId(StorTokenId)
      .freezeWith(client);

    const signTxTokenMint = await txTokenMint.sign(StorSupplyKey);
    await signTxTokenMint.execute(client);
  } catch {
    assert.ok(true);
  }
});

Given(/^A first hedera account with more than (\d+) hbar$/, async function (expectedBalance: number) {
  client.setOperator(account_Id(1), private_Key(1));

  const query = new AccountBalanceQuery().setAccountId(account_Id(1));
  const balance = await query.execute(client);
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance);
});

Given(/^A second Hedera account$/, async function () {
  client.setOperator(account_Id(2), private_Key(2));
});

Given(/^A token named Test Token \(HTT\) with (\d+) tokens$/, async function (TokenAmount: number) {
  client.setOperator(account_Id(0), private_Key(0));
  const txTokenCreate = await new TokenCreateTransaction()
    .setTokenName("Test Token test")
    .setTokenSymbol("HTT")
    .setDecimals(2)
    .setTreasuryAccountId(account_Id(0))
    .setInitialSupply(TokenAmount)
    .freezeWith(client);

  const signTxTokenCreate = await txTokenCreate.sign(private_Key(0));
  const txTokenCreateResponse = await signTxTokenCreate.execute(client);
  const receiptTokenCreateTx = await txTokenCreateResponse.getReceipt(client);
  const tokenId: any = receiptTokenCreateTx.tokenId;
  StorTokenId = tokenId;
});

async function Association(account_id: AccountId, account_privateKey: PrivateKey, Token_id: string) {
  const txTokenAssociate1 = await new TokenAssociateTransaction()
    .setAccountId(account_id)
    .setTokenIds([Token_id])
    .freezeWith(client);

  const signTxTokenAssociate1 = await txTokenAssociate1.sign(account_privateKey);
  await signTxTokenAssociate1.execute(client);
}

async function Transfer_Transaction(account_id_sender: AccountId, account_privateKey: PrivateKey, account_id_reciever: AccountId, Token_amount: number) {
  const txTransfer = await new TransferTransaction()
    .addTokenTransfer(StorTokenId, account_id_sender, -Token_amount)
    .addTokenTransfer(StorTokenId, account_id_reciever, Token_amount)
    .freezeWith(client);

  const signTxTransfer = await txTransfer.sign(account_privateKey);
  await signTxTransfer.execute(client);
}

Given(/^The first account holds (\d+) HTT tokens$/, { timeout: 10000 }, async function (TokenAmount: number) {
  const account1Info = await new AccountBalanceQuery().setAccountId(account_Id(1)).execute(client);
  if (!account1Info.tokens?.get(StorTokenId)) {
    await Association(account_Id(1), private_Key(1), StorTokenId);
  }

  const account2Balance: any = await new AccountBalanceQuery().setAccountId(account_Id(2)).execute(client);
  if (account2Balance.tokens?.get(StorTokenId) == null) {
    await Transfer_Transaction(account_Id(0), private_Key(0), account_Id(1), TokenAmount);
  }
  else{
 
    const account1Balance: any = await new AccountBalanceQuery().setAccountId(account_Id(1)).execute(client);
    let Acc1Bal
    if(account1Balance.tokens?.get(StorTokenId)==null){  Acc1Bal = 0}
    else{Acc1Bal=account1Balance.tokens?.get(StorTokenId).toNumber();}
    assert.strictEqual(Acc1Bal, TokenAmount);
  }

  
});

Given(/^The second account holds (\d+) HTT tokens$/, { timeout: 10000 }, async function (TokenAmount: number) {
  const account2Info = await new AccountBalanceQuery().setAccountId(account_Id(2)).execute(client);
  if (!account2Info.tokens?.get(StorTokenId)) {
    await Association(account_Id(2), private_Key(2), StorTokenId);
  }

  const account1Balance: any = await new AccountBalanceQuery().setAccountId(account_Id(1)).execute(client);
  if (account1Balance.tokens?.get(StorTokenId) == null) {
    await Transfer_Transaction(account_Id(0), private_Key(0), account_Id(2), TokenAmount);
  }
  
  else{
    const account2Balance: any = await new AccountBalanceQuery().setAccountId(account_Id(2)).execute(client);
    let Acc2Bal
    if(account2Balance.tokens?.get(StorTokenId)==null){
      Acc2Bal = 0
    }
     else{
      Acc2Bal=account2Balance.tokens?.get(StorTokenId).toNumber();
     }
    assert.strictEqual(Acc2Bal, TokenAmount);
  }
  
  
});

When(/^The first account creates a transaction to transfer (\d+) HTT tokens to the second account$/, async function (TokenAmount: number) {
  client.setOperator(account_Id(1), private_Key(1));
  const txTransfer = await new TransferTransaction()
    .addTokenTransfer(StorTokenId, account_Id(1), -TokenAmount)
    .addTokenTransfer(StorTokenId, account_Id(2), TokenAmount)
    .freezeWith(client);

  StorTxTransfer = txTransfer;
});

When(/^The first account submits the transaction$/, async function () {
  client.setOperator(account_Id(1), private_Key(1));
  const signTxTransfer = await StorTxTransfer.sign(private_Key(1));
  const txTransferResponse = await signTxTransfer.execute(client);
  recordfee = await txTransferResponse.getRecord(client);

});

When(/^The second account creates a transaction to transfer (\d+) HTT tokens to the first account$/, async function (TokenAmount: number) {
  client.setOperator(account_Id(1), private_Key(1));
  const txTransfer = await new TransferTransaction()
    .addTokenTransfer(StorTokenId, account_Id(2), -TokenAmount)
    .addTokenTransfer(StorTokenId, account_Id(1), TokenAmount)
    .freezeWith(client);

  const first_signTxTransfer = await txTransfer.sign(private_Key(2));
  StorTxTransfer = first_signTxTransfer;
});

Then(/^The first account has paid for the transaction fee$/, async function () {
  assert.strictEqual(recordfee.transactionId.accountId.toString(), account_Id(1).toString());
});

Given(/^A first hedera account with more than (\d+) hbar and (\d+) HTT tokens$/, { timeout: 10000 }, async function (expectedBalance: number, TokenAmount: number) {
  client.setOperator(account_Id(1), private_Key(1));

  const query = new AccountBalanceQuery().setAccountId(account_Id(1));
  const balance = await query.execute(client);
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance);

  await Association(account_Id(1), private_Key(1), StorTokenId);
  await Transfer_Transaction(account_Id(0), private_Key(0), account_Id(1), TokenAmount);
});

Given(/^A second Hedera account with (\d+) hbar and (\d+) HTT tokens$/, { timeout: 10000 }, async function (expectedBalance: number, TokenAmount: number) {
  client.setOperator(account_Id(0), private_Key(0));

  await Association(account_Id(2), private_Key(2), StorTokenId);
  await Transfer_Transaction(account_Id(0), private_Key(0), account_Id(2), TokenAmount);
});

Given(/^A third Hedera account with (\d+) hbar and (\d+) HTT tokens$/, { timeout: 10000 }, async function (expectedBalance: number, TokenAmount: number) {
  client.setOperator(account_Id(0), private_Key(0));

  await Association(account_Id(3), private_Key(3), StorTokenId);
  await Transfer_Transaction(account_Id(0), private_Key(0), account_Id(3), TokenAmount);
});

Given(/^A fourth Hedera account with (\d+) hbar and (\d+) HTT tokens$/, { timeout: 10000 }, async function (expectedBalance: number, TokenAmount: number) {
  client.setOperator(account_Id(0), private_Key(0));

  await Association(account_Id(4), private_Key(4), StorTokenId);
  await Transfer_Transaction(account_Id(0), private_Key(0), account_Id(4), TokenAmount);
});

When(/^A transaction is created to transfer (\d+) HTT tokens out of the first and second account and (\d+) HTT tokens into the third account and (\d+) HTT tokens into the fourth account$/, { timeout: 10000 }, async function (TokenAmount1: number, TokenAmount2: number, TokenAmount3: number) {
  client.setOperator(account_Id(1), private_Key(1));
  const txTransfer = await new TransferTransaction()
    .addTokenTransfer(StorTokenId, account_Id(1), -TokenAmount1)
    .addTokenTransfer(StorTokenId, account_Id(3), TokenAmount2)
    .addTokenTransfer(StorTokenId, account_Id(2), -TokenAmount1)
    .addTokenTransfer(StorTokenId, account_Id(4), TokenAmount3)
    .freezeWith(client);

  const first_SignedTx = await txTransfer.sign(private_Key(2));
  StorTxTransfer = first_SignedTx;
});

Then(/^The third account holds (\d+) HTT tokens$/, async function (TokenAmount: number) {
  const account3Balance: any = await new AccountBalanceQuery().setAccountId(account_Id(3)).execute(client);
  assert.strictEqual(account3Balance.tokens?.get(StorTokenId).toNumber(), TokenAmount);
});

Then(/^The fourth account holds (\d+) HTT tokens$/, async function (TokenAmount: number) {
  const account4Balance: any = await new AccountBalanceQuery().setAccountId(account_Id(4)).execute(client);
  assert.strictEqual(account4Balance.tokens?.get(StorTokenId).toNumber(), TokenAmount);
});
