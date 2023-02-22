# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2023-02-22

This release contains multiple breaking changes.

### Added

- Added `blockchain.libs: Cell | undefined` getter and setter for global libraries dictionary (as a `Cell`)

### Changed

- `blockchain.treasury` now accepts an optional `TreasuryParams` argument (see below for definition) instead of the old optional `workchain?: number` argument. This is a breaking change
```typescript
export type TreasuryParams = Partial<{
    workchain: number
    predeploy: boolean
    balance: bigint
    resetBalanceIfZero: boolean
}>
```
- `OpenedContract` was renamed to `SandboxContract`. This is a breaking change
- `LogsVerbosity` now has a new field, `print: boolean` (defaults to `true` on the `Blockchain` instance), which controls whether to `console.log` any logs at all (both from transactions and get methods). This is a breaking change
- `smartContract.get` and `blockchain.runGetMethod` now return `GetMethodResult` (see below for definition). The differences from the previous return type are as follows:
    - `logs` renamed to `vmLogs`. This is a breaking change
    - `gasUsed` is now of type `bigint`. This is a breaking change
    - `blockchainLogs: string` and `debugLogs: string` were added
```typescript
export type GetMethodResult = {
    stack: TupleItem[]
    stackReader: TupleReader
    exitCode: number
    gasUsed: bigint
    blockchainLogs: string
    vmLogs: string
    debugLogs: string
}
```
- Properties `storage` and `messageQueue` on `Blockchain` are now protected. This is a breaking change
- All properties and methods of `Blockchain` that were private are now protected to improve extensibility. Note that any invariants expected by `Blockchain` must be upheld
- `blockchain.sendMessage` and `smartContract.receiveMessage` now accept an optional `MessageParams` argument (see below for definition). These parameters are used for every transaction in the chain in case of `blockchain.sendMessage`
```typescript
export type MessageParams = Partial<{
    now: number
    randomSeed: Buffer
    ignoreChksig: boolean
}>
```
- `blockchain.runGetMethod` and `smartContract.get` now accept an optional `GetMethodParams` argument (see below for definition)
```typescript
export type GetMethodParams = Partial<{
    now: number
    randomSeed: Buffer
    gasLimit: bigint
}>
```
- `SendMessageResult` now has `transactions: BlockchainTransaction[]` instead of `transactions: Transaction[]`. Definition of `BlockchainTransaction`:
```typescript
export type BlockchainTransaction = Transaction & {
    blockchainLogs: string
    vmLogs: string
    debugLogs: string
    events: Event[]
    parent?: BlockchainTransaction
    children: BlockchainTransaction[]
}
```
- `smartContract.receiveMessage` now returns `SmartContractTransaction` (see below for definition)
```typescript
export type SmartContractTransaction = Transaction & {
    blockchainLogs: string
    vmLogs: string
    debugLogs: string
}
```
- Emulator WASM binary has been updated

### Fixed

- Fixed empty message bodies in bounced messages. This fix is contained in the emulator WASM binary

## [0.4.0] - 2023-02-09

### Changed

- Treasuries obtained by `blockchain.treasury` calls are now initialized during this call and will no longer produce an extra transaction when first sending a message
- Transaction processing loop now prefetches contracts, which should provide a performance boost in some scenarios

## [0.3.0] - 2023-02-05

### Changed

- `Blockchain` and `SmartContract` now use `LogsVerbosity` (see below for definition) as the verbosity type, which allows for more control over what kinds of logs are printed. Logs from TVM debug primitives are now enabled by default, again. (You can disable them globally by setting verbosity with `debugLogs: false` on the `Blockchain` instance)

Definition of `LogsVerbosity`:
```typescript
type LogsVerbosity = {
    blockchainLogs: boolean
    vmLogs: Verbosity
    debugLogs: boolean
}
```

## [0.2.2] - 2023-02-03

### Added 

- Added `blockchain.runGetMethod(address, method, stack)` to run a get method on the specified address
- Added `blockchain.setShardAccount(address, account)` to directly set the state of smart contracts
- Added `account: ShardAccount` getter and setter to `SmartContract`
- Exported helper methods `createEmptyShardAccount`, `createShardAccount` for use with `blockchain.setShardAccount` and `smartContract.account` setter
- Added the ability to pass `Cell`s into `blockchain.sendMessage`

### Changed

- Removed unnecessary `async` modifiers from `smartContract.receiveMessage` and `smartContract.get`
- Logs from TVM debug primitives (for example, `DUMP` and `STRDUMP` with corresponding FunC functions `~dump()` and `~strdump()`) now respect the `verbosity` parameter and will only work when it is not `none`
- Logs from TVM debug primitives are now printed using a single `console.log` call per one TVM execution to avoid cluttering the terminal during unit tests

### Fixed

- Fixed potential race conditions between execution of different transaction chains on the same `Blockchain` instance by use of an `AsyncLock`

### Removed

- Changed `blockchain.pushMessage`, `blockchain.processQueue`, `blockchain.runQueue` to be private