# TON transaction emulator

This library allows you to emulate arbitrary smart contracts, send messages to them and run get methods on them as if they were deployed on a real network.

## Usage

To use this library, you need to obtain an instance of the `SmartContract` class. The easiest way to do this is to invoke the static method `fromStatic` of that class.

Here is an example:
```typescript
import { Cell, contractAddress } from "ton";
import { SmartContract } from "ton-tx-emulator";
import BN from "bn.js";

const createSmartContract => (code: Cell, data: Cell) => {
  const contract = SmartContract.fromState({
    address: contractAddress({
      workchain: 0,
      initialCode: code,
      initialData: data
    }),
    accountState: {
      type: 'active',
      code,
      data
    },
    balance: new BN(0)
  });
  
  return contract;
};
```

The `createSmartContract` function will create a smart contract using the given code and data cells and all the other parameters required for smart contract execution set to default values.

One could also create a smart contract with a calculated address but with `accountState: { type: 'uninit' }` and then emulate a message with a correct `StateInit` that would set the necessary code and data.

Another way to create a smart contract is to compile the code using a compiler package such as `@ton-community/func-js` and calculate the required data, like in this [unit test](/test/SmartContract.spec.ts#L18).

Yet another way to create smart contracts is used in another [unit test](/test/SmartContract.spec.ts#L72) - here an existing transaction on a faucet wallet is queried from the testnet together with the account state at the time, and then the message is emulated locally.

### Sending emulated messages

Once you have an instance of `SmartContract`, you can start sending messages to it. For example:

```typescript
const smc = SmartContract.fromState({
    address: contractAddress({
        workchain: 0,
        initialCode: code,
        initialData: data,
    }),
    accountState: {
        type: 'active',
        code,
        data,
    },
    balance: initBalance,
});

const result = await smc.sendMessage(new InternalMessage({
    to: smc.getAddress(),
    from: new Address(0, Buffer.alloc(32)),
    value: coins,
    bounce: true,
    body: new CommonMessageInfo({
        body: new CellMessage(new Cell())
    })
}));
```

The `result` object contains the following fields:
```typescript
export type SendMessageResult = {
    transaction: RawTransaction
    shardAccount: RawShardAccount
    transactionCell: Cell
    shardAccountCell: Cell
    logs: string
    vmLogs: string
    actionsCell: Cell
};
```
Note that the `RawTransaction` and `RawShardAccount` types are the same as in the `ton` library, but `RawShardAccount` cannot contain a `none` account.

Here is an excerpt from a unit test that demonstrates the usage of this result:
```typescript
expect(res.transaction.outMessages.length).toBe(1);

expect(res.transaction.outMessages[0].info.type).toBe('internal');
if (res.transaction.outMessages[0].info.type !== 'internal') return;

expect(res.transaction.outMessages[0].info.dest.equals(returnTo)).toBeTruthy();
expect(res.transaction.outMessages[0].info.value.coins.eq(coins)).toBeTruthy();
expect(res.shardAccount.account.storage.balance.coins.lt(initBalance)).toBeTruthy();
```

### Running get methods

You can run get methods on your contract with the desired stack (for example, to query the state of the contract after sending messages to it).

Here is an excerpt from a [unit test](/test/SmartContract.spec.ts#L137) that demonstrates the usage of get methods:
```typescript
const res = await smc.runGetMethod('add_and_multiply', [
    stackNumber(3),
    stackNumber(new BN(2)),
]);

expect(res.exitCode).toBe(0);

expect((res.stack[0] as StackEntryNumber).value.eqn(5)).toBeTruthy();
expect((res.stack[1] as StackEntryNumber).value.eqn(6)).toBeTruthy();
```

Here are all the stack types with their respective helper functions:
- `StackEntryCell` - `stackCell`
- `StackEntryCellSlice` - `stackCellSlice`
- `StackEntryNumber` - `stackNumber`
- `StackEntryTuple` - `stackTuple`
- `StackEntryNull` - `stackNull`