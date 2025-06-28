import { Given, Then, When } from "@cucumber/cucumber";
import {
  AccountBalanceQuery,
  AccountId,
  Client,
  PrivateKey,
  RequestType,
  TopicCreateTransaction,
  TopicInfoQuery,
  TopicMessageQuery,
  TopicMessageSubmitTransaction,
  KeyList,
  PublicKey,
} from "@hashgraph/sdk";
import { accounts } from "../../src/config";
import assert from "node:assert";
import ConsensusSubmitMessage = RequestType.ConsensusSubmitMessage;

// Pre-configured client for test network (testnet)
const client = Client.forTestnet();

//Set the operator with the account ID and private key

Given(
  /^a first account with more than (\d+) hbars$/,
  async function (expectedBalance: number) {
    const acc = accounts[0];
    const accountId1: AccountId = AccountId.fromString(acc.id);
    this.accountId1 = accountId1;
    const privKey1: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
    this.privKey1 = privKey1;
    client.setOperator(this.accountId1, privKey1);

    const query = new AccountBalanceQuery().setAccountId(accountId1);
    const balance = await query.execute(client);
    assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance);
  }
);

When(
  /^A topic is created with the memo "([^"]*)" with the first account as the submit key$/,
  async function (memo: string) {
    const transaction = new TopicCreateTransaction()
      .setTopicMemo(memo)
      .setSubmitKey(this.privKey1.publicKey);

    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const newTopicId = receipt.topicId;

    this.newTopicId = newTopicId;
  }
);

When(
  /^The message "([^"]*)" is published to the topic$/,
  async function (message: string) {
    const txTopicMessageSubmit = await new TopicMessageSubmitTransaction()
      .setTopicId(this.newTopicId)
      .setMessage(message)
      .freezeWith(client);

    const TopicMessageSubmit = await txTopicMessageSubmit.execute(client);
  }
);

Then(
  /^The message "([^"]*)" is received by the topic and can be printed to the console$/,
  async function (message: string) {
    await new Promise((resolve) => setTimeout(resolve, 4000));

    new TopicMessageQuery().setTopicId(this.newTopicId).subscribe(
      client,
      (topicMessage) => {
        const receivedMessage = topicMessage?.contents.toString();
        assert.strictEqual(
          receivedMessage,
          message,
          "The received message does not match the expected message."
        );
      },
      (error) => console.log(`Error: ${error.toString()}`)
    );
  }
);

Given(
  /^A second account with more than (\d+) hbars$/,
  async function (expectedBalance: number) {
    const acc = accounts[1];
    const accountId2: AccountId = AccountId.fromString(acc.id);
    this.accountId2 = accountId2;
    const privKey2: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
    this.privKey2 = privKey2;
    client.setOperator(this.accountId2, privKey2);

    const query = new AccountBalanceQuery().setAccountId(accountId2);
    const balance = await query.execute(client);
    assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance);
  }
);

Given(
  /^A (\d+) of (\d+) threshold key with the first and second account$/,
  async function (thresholdValue: number, totalKeys: number) {
    const publicKeyList = [];
    publicKeyList.push(this.privKey1.publicKey);
    publicKeyList.push(this.privKey2.publicKey);

    const thresholdKey = new KeyList(publicKeyList, thresholdValue);
    this.thresholdKey = thresholdKey;

    assert.strictEqual(publicKeyList.length, totalKeys);
  }
);

When(
  /^A topic is created with the memo "([^"]*)" with the threshold key as the submit key$/,
  async function (memo: string) {
    const transaction = new TopicCreateTransaction()
      .setTopicMemo(memo)
      .setSubmitKey(this.thresholdKey);

    const txResponse = await transaction.execute(client);

    const receipt = await txResponse.getReceipt(client);

    const newTopicId = receipt.topicId;

    this.newTopicId = newTopicId;
  }
);
