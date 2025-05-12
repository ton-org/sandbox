## Collect Metric API

The `@ton/sandbox` package provides a built-in way to collect detailed metrics during contract execution. This is useful for benchmarking gas usage, VM steps, message forwarding, and storage impact of smart contracts.

> ℹ️ See also: [Benchmark Contracts documentation](../README.md#benchmark-contracts)

### Example

```ts
import { beginCell, toNano } from '@ton/core';
import {
  Blockchain,
  createMetricStore,
  makeSnapshotMetric,
  ContractDatabase,
  defaultColor,
  makeGasReport,
  gasReportTable,
  SnapshotMetric,
  resetMetricStore,
} from '@ton/sandbox';

async function main() {
  const blockchain = await Blockchain.create();
  const [alice, bob] = await blockchain.createWallets(2);

  // describe knowledge contracts
  const contractDatabase = ContractDatabase.from({
    '0xd992502b94ea96e7b34e5d62ffb0c6fc73d78b3e61f11f0848fb3a1eb1afc912': 'TreasuryContract',
    TreasuryContract: {
      name: 'TreasuryContract',
      types: [
        { name: 'ping', header: 0x70696e67, fields: [] },
        { name: 'pong', header: 0x706f6e67, fields: [] },
      ],
      receivers: [
        { receiver: 'internal', message: { kind: 'typed', type: 'ping' } },
        { receiver: 'internal', message: { kind: 'typed', type: 'pong' } },
      ],
    },
  });

  // initialize metric store
  let store = createMetricStore();
  const list: SnapshotMetric[] = [];

  // first snapshot
  await alice.send({
    to: bob.address,
    value: toNano(1),
    body: beginCell().storeUint(0x70696e67, 32).endCell(), // "ping"
  });
  await bob.send({
    to: alice.address,
    value: toNano(1),
    body: beginCell().storeUint(0x706f6e67, 32).endCell(), // "pong"
  });
  list.push(makeSnapshotMetric(store, { contractDatabase, label: 'first' }));

  // second snapshot
  resetMetricStore();
  await alice.send({
    to: bob.address,
    value: toNano(1),
    body: beginCell().storeUint(0x70696e67, 32).endCell(), // "ping"
  });
  await bob.send({
    to: alice.address,
    value: toNano(1),
    body: beginCell().storeUint(0x706f6e67, 32).endCell(), // "pong"
  });
  list.push(makeSnapshotMetric(store, { contractDatabase }));
  // make report
  const delta = makeGasReport(list);
  console.log(gasReportTable(delta, defaultColor));
}

main().catch((error) => {
  console.log(error.message);
});
```

### How it works

* `const store = createMetricStore()` initializes an in-memory global metric storage (per test context or worker)
* The sandbox automatically collects metrics from each transaction triggered via the blockchain during test execution (via `collectMetric()`)
* `const snapshot = makeSnapshotMetric('comment', store)` produces a de-duplicated, timestamped snapshot of collected metrics

### Snapshot Structure

```ts
type SnapshotMetric = {
  label: string;
  createdAt: Date;
  items: Metric[];
}
```

A snapshot consists of:

* `comment`: a user-defined label
* `createdAt`: the timestamp when the snapshot was generated
* `items`: an array of unique `Metric` objects collected during execution

Each `Metric` includes:

* `testName` – the name of the current test (if available in Jest context)
* `address` – address of contract
* `contractName`, `methodName`, `opCode` – for identifying the source
* `codeHash` – `0x...` hex-formatted hash of contract code
* `receiver` – `internal`, `external-in`, or `external-out`
* `execute` – `computePhase` and `actionPhase` – information from transaction phases
* `messages` – total cells and bits usage of inbound and outbound messages
* `state` – total cells and bits usage of the contract's code and data

### Advanced Configuration

#### Contract Exclusion (optional)

You can exclude contracts from the snapshot using:

```ts
makeSnapshotMetric('label', store, {
  contractExcludes: [
    'ContractName1',
    'ContractName2',
  ],
});
```

#### ABI auto-mapping

Use `ContractDatabase.from()` to define a map of known `CodeHash` → [ContractABI](https://github.com/ton-org/ton-core/blob/c627c266030cb95d07dbea950dc8af36a3307d37/src/contract/ContractABI.ts), so method names and contract names are resolved automatically:

```ts
makeSnapshotMetric('label', store, {
  contractDatabase: ContractDatabase.from({
    '0xCodeHashv':  {...ContractABI}, // map CodeHash and ABI_1
    'ContractName': {...ContractABI}, // map ContractName and ABI_2
    '0xCodeHashN1': '0xCodeHash',     // aliase for ABI_1
    '0xCodeHashN2': 'ContractName',   // aliase for ABI_2
  }),
});
```

### Where to go next

* Read more about [benchmarking smart contracts](../README.md#benchmark-contracts)
* Integrate with [blueprint](https://github.com/ton-org/blueprint#benchmark-contracts) `blueprint metric` and `blueprint bench` commands to compare snapshots over time
