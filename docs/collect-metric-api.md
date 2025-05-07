## Collect Metric API

The `@ton/sandbox` package provides a built-in way to collect detailed metrics during contract execution. This is useful for benchmarking gas usage, VM steps, message forwarding, and storage impact of smart contracts.

> ℹ️ See also: [Benchmark Contracts documentation](https://github.com/ton-org/sandbox#benchmark-contracts)

### Example

```ts
import { beginCell, toNano } from '@ton/core';
import { Blockchain, createMetricStore, makeSnapshotMetric } from '@ton/sandbox';

async function main() {
  const store = createMetricStore(); // initialize metric store
  const blockchain = await Blockchain.create();
  const [alice, bob] = await blockchain.createWallets(2);

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

  const snapshot = makeSnapshotMetric('Sample Snapshot', store);
  console.log(JSON.stringify(snapshot, null, 2));
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

A snapshot consists of:

* `comment`: a user-defined label
* `createdAt`: the timestamp when the snapshot was generated
* `items`: an array of unique `Metric` objects collected during execution

Each `Metric` includes:

* `testName` – the name of the current test (if available in Jest context)
* `contractName`, `methodName`, `opCode` – for identifying the source
* `computePhase`, `actionPhase` – information from transaction phases
* `outMessages` – total cell and bit usage of outbound messages
* `state` – total cell and bit usage of the contract's code + data

### Where to go next

* Read more about [benchmarking smart contracts](../README.md#benchmark-contracts)
* Integrate with [blueprint](https://github.com/ton-org/blueprint#benchmark-contracts) `blueprint metric` and `blueprint bench` commands to compare snapshots over time
