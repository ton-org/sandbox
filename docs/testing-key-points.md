## Testing flow

This page describes testing of distributor smart contract. The goal of contract is to distribute some ton among users.
Code of contract located [here](https://github.com/ton-community/onboarding-sandbox/blob/main/sandbox-examples/contracts/distributor.fc). 
Code of contract wrapper located [here](https://github.com/ton-community/onboarding-sandbox/blob/main/sandbox-examples/wrappers/Distributor.ts). 

### Positive testing

First of all let's make sure our contract is deployed.
Note that we are using `toHaveTransaction` from `@ton/test-utils` to make sure result have transaction that matches pattern.

```typescript
it('should deploy', async () => {
  const result = await distributor.sendDeploy(owner.getSender(), toNano('0.05'));

  expect(result.transactions).toHaveTransaction({
    from: owner.address,
    to: distributor.address,
    deploy: true,
    success: true
  });
});
```

Let's check that our getters are working.
Note that we are using `toEqualAddress` from `@ton/test-utils`. Under the hood it uses `Address.equals` to compare addresses.

```typescript
it('should get owner', async () => {
  const ownerFromContract = await distributor.getOwner();

  expect(ownerFromContract).toEqualAddress(owner.address);
});

it('should get shares dict', async () => {
  const shares = await distributor.getShares();

  expect(shares.keys().length).toEqual(0);
});
```

To share our coins we need to add some users to shares dict
```typescript
it('should add firstUser', async () => {
  const result = await distributor.sendAddUser(owner.getSender(), {
    value: toNano('0.05'),
    userAddress: firstUser.address,
  });

  expect(result.transactions).toHaveTransaction({
    from: owner.address,
    to: distributor.address,
    success: true,
  });

  const shares = await distributor.getShares();

  expect(shares.keys()[0]).toEqualAddress(firstUser.address);
});
```

After all preparations we now can finally share coins to users.
```typescript
it('should share coins to one user', async () => {
  const result = await distributor.sendShareCoins(owner.getSender(), {
    value: toNano('10'),
  });

  expect(result.transactions).toHaveTransaction({
    from: owner.address,
    to: distributor.address,
    outMessagesCount: 1,
    success: true
  });
  expect(result.transactions).toHaveTransaction({
    from: distributor.address,
    to: firstUser.address,
    op: 0x0,
    success: true
  });
});
```

Additionally, lets validate that our contract share coins to multiple users correctly. 
Function `findTransactionRequired` from `@ton/test-utils` will throw error if tx is not found. Also, it has silent version `findTransaction`.

```typescript
    it('should add secondUser', async () => {
  const result = await distributor.sendAddUser(owner.getSender(), {
    value: toNano('0.05'),
    userAddress: secondUser.address
  });

  expect(result.transactions).toHaveTransaction({
    from: owner.address,
    to: distributor.address,
    success: true
  });

  const shares = await distributor.getShares();

  expect(
    shares.keys().some((addr) => secondUser.address.equals(addr))
  ).toBeTruthy();
});


it('should share coins to 2 users', async () => {
  const result = await distributor.sendShareCoins(owner.getSender(), {
    value: toNano('10')
  });

  expect(result.transactions).toHaveTransaction({
    from: owner.address,
    to: distributor.address,
    success: true,
    outMessagesCount: 2
  });
  expect(result.transactions).toHaveTransaction({
    from: distributor.address,
    to: firstUser.address,
    op: 0x0,
    success: true
  });
  expect(result.transactions).toHaveTransaction({
    from: distributor.address,
    to: secondUser.address,
    op: 0x0,
    success: true
  });
  
  const firstUserTransaction = findTransactionRequired(result.transactions, { to: firstUser.address });
  const secondUserTransaction = findTransactionRequired(result.transactions, { to: secondUser.address });

  expect(flattenTransaction(firstUserTransaction).value).toEqual(flattenTransaction(secondUserTransaction).value);
});
```

By this simple steps positive flow was validated. But what if someone other than the owner tries to add user to shares? Negative testing comes in place.

## Negative testing

Below we make sure that no one except admin can call `add_user`. Function `randomAddress` from `@ton/test-utils` is useful for random address generation.

```typescript
it('should not add user as not owner', async () => {
  const notOwner = await blockchain.treasury(`not-owner`);

  const result = await distributor.sendAddUser(notOwner.getSender(), {
    value: toNano('0.5'),
    userAddress: randomAddress(),
  });

  expect(result.transactions).toHaveTransaction({
    from: notOwner.address,
    to: distributor.address,
    success: false,
    exitCode: ExitCode.MUST_BE_OWNER,
  });
});
```

We should put impure specifier in function below because it throws an exception. 
If impure is not specified compiler will delete this function call. This can lead to security issues so do not forget to test it!

```func
() throw_unless_owner(slice address) impure inline {
    throw_unless(err::must_be_owner, equal_slice_bits(address, storage::owner));
}
```

Be sure to set max limits of dynamic data structures in your func code.
If the limit is not set, then more than 255 out actions can be performed, and the action phase will fail with 33 exit code.

```typescript
it('should add 255 users', async () => {
  for (let i = 0; i < 255; ++i) {
    const userWallet = await blockchain.treasury(`${i}`);
    const result = await distributor.sendAddUser(owner.getSender(), {
      value: toNano('0.5'),
      userAddress: userWallet.address
    });
    expect(result.transactions).toHaveTransaction({
      from: owner.address,
      to: distributor.address,
      success: true
    });
  }
});

it('should not add one more user', async () => {
  const userWallet = await blockchain.treasury(`256`);
  const result = await distributor.sendAddUser(owner.getSender(), {
    value: toNano('0.5'),
    userAddress: userWallet.address
  });
  expect(result.transactions).toHaveTransaction({
    from: owner.address,
    to: distributor.address,
    success: false,
    exitCode: ExitCode.SHARES_SIZE_EXCEEDED_LIMIT
  });
});
```

Always test edge cases too. In this case we test 255 out actions. Function `filterTransactions` from `@ton/test-utils` provides nice interface for filtering transactions.

```typescript
it('should share money to 255 users', async () => {
  const result = await distributor.sendShareCoins(owner.getSender(), {
    value: toNano('1000')
  });

  expect(result.transactions).toHaveTransaction({
    from: owner.address,
    to: distributor.address,
    success: true
  });

  printTransactionFees(result.transactions);

  const transferTransaction = filterTransactions(result.transactions, { op: 0x0 });
  expect(transferTransaction.length).toEqual(255);
});
```

Function `printTransactionFees` is useful for debugging costs of transactions. It provides output like this:
```
┌─────────┬─────────────┬────────────────┬────────────────┬────────────────┬────────────────┬───────────────┬────────────┬────────────────┬──────────┬────────────┐
│ (index) │ op          │ valueIn        │ valueOut       │ totalFees      │ inForwardFee   │ outForwardFee │ outActions │ computeFee     │ exitCode │ actionCode │
├─────────┼─────────────┼────────────────┼────────────────┼────────────────┼────────────────┼───────────────┼────────────┼────────────────┼──────────┼────────────┤
│ 0       │ 'N/A'       │ 'N/A'          │ '1000 TON'     │ '0.004007 TON' │ 'N/A'          │ '0.001 TON'   │ 1          │ '0.001937 TON' │ 0        │ 0          │
│ 1       │ '0x45ab564' │ '1000 TON'     │ '998.8485 TON' │ '1.051473 TON' │ '0.000667 TON' │ '0.255 TON'   │ 255        │ '0.966474 TON' │ 0        │ 0          │
│ 2       │ '0x0'       │ '3.917053 TON' │ '0 TON'        │ '0.00031 TON'  │ '0.000667 TON' │ 'N/A'         │ 0          │ '0.000309 TON' │ 0        │ 0          │
│ 3       │ '0x0'       │ '3.917053 TON' │ '0 TON'        │ '0.00031 TON'  │ '0.000667 TON' │ 'N/A'         │ 0          │ '0.000309 TON' │ 0        │ 0          │
│ 4       │ '0x0'       │ '3.917053 TON' │ '0 TON'        │ '0.00031 TON'  │ '0.000667 TON' │ 'N/A'         │ 0          │ '0.000309 TON' │ 0        │ 0          │
│ 5       │ '0x0'       │ '3.917053 TON' │ '0 TON'        │ '0.00031 TON'  │ '0.000667 TON' │ 'N/A'         │ 0          │ '0.000309 TON' │ 0        │ 0          │
│ 6       │ '0x0'       │ '3.917053 TON' │ '0 TON'        │ '0.00031 TON'  │ '0.000667 TON' │ 'N/A'         │ 0          │ '0.000309 TON' │ 0        │ 0          │
...
```



