import { Given, Then, When } from "@cucumber/cucumber";
import {
  AccountBalanceQuery,
  AccountId,
  Client,
  PrivateKey, RequestType,
  TopicCreateTransaction, TopicInfoQuery,
  TopicMessageQuery, TopicMessageSubmitTransaction, KeyList,
  PublicKey
} from "@hashgraph/sdk";
import { accounts } from "../../src/config";
import assert from "node:assert";
import ConsensusSubmitMessage = RequestType.ConsensusSubmitMessage;

// Pre-configured client for test network (testnet)
const client = Client.forTestnet()
// stored values
let StoreTopicid:any;
let StoreTxTopicMessageSubmit : any;
//Set the operator with the account ID and private key

Given(/^a first account with more than (\d+) hbars$/, async function (expectedBalance: number) {
  const acc = accounts[0]
  const account: AccountId = AccountId.fromString(acc.id);
  this.account = account
  const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  this.privKey = privKey
  client.setOperator(this.account, privKey);

  //Create the query request
  const query = new AccountBalanceQuery().setAccountId(account);
  const balance = await query.execute(client)
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance,)
});

When(/^A topic is created with the memo "([^"]*)" with the first account as the submit key$/, async function (memo: string) {
  const acc = accounts[0]
  const account: AccountId = AccountId.fromString(acc.id);
  const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  client.setOperator(this.account, privKey);

  const publicKey1 = privKey.publicKey;

  //Create the transaction
  const transaction = new TopicCreateTransaction()
  .setTopicMemo(memo)
  .setSubmitKey(publicKey1);

  //Sign with the client operator private key and submit the transaction to a Hedera network
  const txResponse = await transaction.execute(client);
  //Request the receipt of the transaction
  const receipt = await txResponse.getReceipt(client);
  //Get the topic ID
  const newTopicId = receipt.topicId;
  //store Topicid
  StoreTopicid = newTopicId ;

});

When(/^The message "([^"]*)" is published to the topic$/, async function (message: string) {
  const acc = accounts[0]
  const account: AccountId = AccountId.fromString(acc.id);
  this.account = account
  const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  this.privKey = privKey
  client.setOperator(this.account, privKey);

  const txTopicMessageSubmit = await new TopicMessageSubmitTransaction()
  .setTopicId(StoreTopicid) 
  .setMessage(message)
  .freezeWith(client);
  const signTxTokenCreate = await txTopicMessageSubmit.sign(privKey);
  const txTokenCreateResponse = await signTxTokenCreate.execute(client); 

  StoreTxTopicMessageSubmit=txTopicMessageSubmit;

});

Then(/^The message "([^"]*)" is received by the topic and can be printed to the console$/, async function (message: string) {
    const receivedMessage = StoreTxTopicMessageSubmit.getMessage().toString();
    assert.strictEqual(receivedMessage, message, "The received message does not match the expected message.");
  });



Given(/^A second account with more than (\d+) hbars$/, async function (expectedBalance: number) {
    const acc = accounts[1]; 
    const account: AccountId = AccountId.fromString(acc.id);
    this.account = account;
    const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
    this.privKey = privKey;
    client.setOperator(this.account, privKey);
  
   
    const query = new AccountBalanceQuery().setAccountId(account);
    const balance = await query.execute(client);
    assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance,);
});
  
Given(/^A (\d+) of (\d+) threshold key with the first and second account$/, async function (thresholdValue: number, totalKeys: number) {
 
  const acc_1 = accounts[0];
  const privateKey1 = PrivateKey.fromStringED25519(acc_1.privateKey);
  const acc_2 = accounts[1];
  const privateKey2 = PrivateKey.fromStringED25519(acc_2.privateKey);
// get public key from privat key
  const publicKey1 = privateKey1.publicKey;
  const publicKey2 = privateKey2.publicKey;

  const publicKeyList = []
  publicKeyList.push(publicKey1)
  publicKeyList.push(publicKey2)

  const thresholdKey = new KeyList(publicKeyList, thresholdValue);

  assert.strictEqual(publicKeyList.length, totalKeys);
});

When(/^A topic is created with the memo "([^"]*)" with the threshold key as the submit key$/, async function (memo: string) {
  
  const acc_1 = accounts[0];
  const privateKey1 = PrivateKey.fromStringED25519(acc_1.privateKey);
  const acc_2 = accounts[1];
  const privateKey2 = PrivateKey.fromStringED25519(acc_2.privateKey);
  
  const publicKey1 = privateKey1.publicKey;
  const publicKey2 = privateKey2.publicKey;

  const publicKeyList = []
  publicKeyList.push(publicKey1)
  publicKeyList.push(publicKey2)

  const thresholdKey = new KeyList(publicKeyList);

  //Create the transaction
  const transaction = new TopicCreateTransaction()
  .setTopicMemo(memo)
  .setSubmitKey(thresholdKey);
  
  //Sign with the client operator private key and submit the transaction to a Hedera network
  const txResponse = await transaction.execute(client);
  
  //Request the receipt of the transaction
  const receipt = await txResponse.getReceipt(client);
  
  //Get the topic ID
  const newTopicId = receipt.topicId;
  //store Topicid
   StoreTopicid = newTopicId ;

});
