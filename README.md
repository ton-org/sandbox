# TON transaction emulator

This package allows you to emulate arbitrary smart contracts, send messages to them and run get methods on them as if they were deployed on a real network.

The key difference of this package from [ton-contract-executor](https://github.com/ton-community/ton-contract-executor) is the fact that the latter only emulates the compute phase of the contract - it does not know about any other phases and thus does not know anything about fees and balances (in a sense that it does not know whether a contract's balance will be enough to process all the out messages that it produces). On the other hand, this package emulates all the phases of a contract, and as a result, the emulation is much closer to what would happen in a real network.

## Installation

```
yarn add @ton-community/tx-emulator ton
```
or
```
npm i @ton-community/tx-emulator ton
```

## Usage

To use this package, you need to obtain an instance of the `SmartContract` class. The easiest way to do this is to invoke the static method `fromState` of that class.

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

Another way to create a smart contract is to compile the code using a compiler package such as `@ton-community/func-js` and calculate the required data, like in this [unit test](/test/SmartContract.spec.ts#L21).

Yet another way to create smart contracts is used in another [unit test](/test/SmartContract.spec.ts#L80) - here an existing transaction on a faucet wallet is queried from the testnet together with the account state at the time, and then the message is emulated locally.

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
Note that the `RawTransaction` and `RawShardAccount` types are the same as in the `ton` package, but `RawShardAccount` cannot contain a `none` account.

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

Here is an excerpt from a [unit test](/test/SmartContract.spec.ts#L184) that demonstrates the usage of get methods:
```typescript
const res = await smc.runGetMethod('add_and_multiply', [
    stackNumber(3),
    stackNumber(new BN(2)),
]);

expect(res.exitCode).toBe(0);

expect(res.stackSlice.readNumber()).toBe(5);
expect(res.stackSlice.readNumber()).toBe(6);
```

Here are all the stack types (provided by the `ton` package) with their respective helper functions:
- `StackCell` - `stackCell`
- `StackSlice` - `stackSlice`
- `StackInt` - `stackNumber`
- `StackTuple` - `stackTuple`
- `StackNull` - `stackNull`
- `StackNan` - `stackNan`
- `StackBuilder` - `stackBuilder`

### Network/Block configuration

By default, this package will use its [stored network configuration](src/config/defaultConfig.ts) to emulate messages. However, you can set any configuration you want using the `SmartContract.setConfig` method. You can use the helper `getConfigBoc` function to get the BOC of the needed configuration; by default it will return the configuration of the latest block on the mainnet.

## Contributors

Special thanks to [@dungeon-master-666](https://github.com/dungeon-master-666) for their C++ code of the emulator.

## License

This package is released under the [MIT License](LICENSE).
