# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Changed

- Updated API docs

## [0.28.0] - 2025-04-01

### Added

- Added `getVersion` method to `Executor`

### Changed

- Updated emulator WASM binary (TON v2025.03)
- Updated config

## [0.27.1] - 2025-02-25

### Fixed

- Fixed a bug pertaining to blockchain snapshot loading

## [0.27.0] - 2025-02-20

### Added

- Added better extra currency support

### Changed

- Updated dependencies

## [0.26.0] - 2025-02-12

### Changed

- Updated emulator WASM binary (TON v2025.02)

## [0.25.0] - 2025-01-30

### Changed

- Extra currencies are now available in get methods

## [0.24.0] - 2025-01-17

### Added

- Added `SmartContract.ec` getter and setter to work with extra currencies
- Added an optional `ec` parameter to `internal` helper to set extra currencies

## [0.23.0] - 2024-12-18

### Updated

- Updated emulator WASM binary

## [0.22.0] - 2024-09-17

### Added

- Added `blockchain.recordStorage` flag. If set to `true`, `BlockchainTransaction` will have `oldStorage` and `newStorage` fields. Note that enabling this flag will disable a certain optimization, which will slow down contract emulation

## [0.21.0] - 2024-09-16

### Added

- `SandboxContract` now wraps methods starting with `is` (having the same semantics as `get`) as well as `send` and `get`

### Changed

- Updated dependencies

## [0.20.0] - 2024-05-31

### Added

- Added the ability to create `Blockchain` using a custom `IExecutor` instead of the default `Executor`
- Added more information to `EmulationError`, extended its error message

## [0.19.0] - 2024-04-27

### Fixed

- Fixed a bug in the emulator that caused send mode 16 to not properly work

## [0.18.0] - 2024-04-23

### Changed

- Changed the default and slim configs to use the latest config at the time of release, which reduces gas fees by a factor of 2.5x

## [0.17.0] - 2024-03-27

### Changed

- Updated emulator WASM binary
- Changed the default and slim configs to use the latest config at the time of release, which enables TVM v6 opcodes

## [0.16.0] - 2024-03-01

This release contains a breaking change.

### Added

- Added `IExecutor` interface with the prospect of creating custom executor
- Added `open` and `getTransactions` to sandbox's `ContractProvider`
- Added `toSandboxContract` helper function to cast `OpenedContract<T>` to `SandboxContract<T>` when applicable

### Changed

- Changed the default executor to have `async` methods (it still has sync nature)
- Improved get method return object

## [0.15.0] - 2023-12-24

### Changed

- Changed the default and slim configs to use the latest config at the time of release, which enables new TVM opcodes

## [0.14.0] - 2023-12-04

### Changed

- Updated emulator WASM binary

## [0.13.1] - 2023-10-10

### Fixed

- Fixed a bug in `Blockchain` that led to storage fetch errors (for example, network errors in `RemoteBlockchainStorage`) being cached and breaking that contract address forever

## [0.13.0] - 2023-10-05

### Changed

- On transaction emulation error, an `EmulationError` is now thrown that has an `error` string, `vmLogs`, and `exitCode` (the latter two being optional). The error is no longer being dumped into console

## [0.12.0] - 2023-10-03

### Added

- Step by step execution (`blockchain.sendMessageIter`)
- Better docs

### Fixed

- `now` from `Blockchain` is now honored in `SmartContract.receiveMessage`
- Exit code 1 is now counted as success in get methods

## [0.11.1] - 2023-07-26

### Changed

- Migrated dependencies to @ton organization packages
- Bumped @ton/test-utils version to 0.3.1

## [0.11.0] - 2023-05-11

### Added

- Added the ability to emulate ticktock transactions. There are 3 ways to do that: `blockchain.runTickTock(Address | Address[], TickOrTock, MessageParams?)`, `smartContract.runTickTock(TickOrTock, MessageParams?)`, or you can change `ContractProvider` in your wrapper classes to be `SandboxContractProvider` and invoke `tickTock(TickOrTock)` on it. `TickOrTock` is a union type `'tick' | 'tock'`
- Added new verbosity levels: `'vm_logs_location'` (same as `'vm_logs'` but also display code cell hash and offset), `'vm_logs_gas'` (same as `'vm_logs_location'` but also display gas remaining), `'vm_logs_verbose'` (same as `'vm_logs_full'` but display stack values in a more verbose way)

### Changed

- Changed emulator WASM binary

## [0.10.0] - 2023-05-04

### Changed

- Changed emulator WASM binary
- Changed treasury code

### Fixed

- Fixed certain interactions between snapshots and treasuries

## [0.9.0] - 2023-04-27

### Added

- Added `printTransactionFees` helper for easier calculation of fees of different operations
- Added `blockchain.snapshot`, `blockchain.loadFrom`, `smartContract.snapshot`, `smartContract.loadFrom` methods to create state snapshots of the respective objects and restore from them at a later point in time. They return and accept new types, `BlockchainSnapshot` and `SmartContractSnapshot`

## [0.8.0] - 2023-04-07

This release contains a breaking change.

### Added

- Added `blockchain.createWallets` method which accepts a number `n` and optional `TreasuryParams`. It creates `n` treasuries and returns them as an array

### Changed

- `RemoteBlockchainStorage` now requires a `RemoteBlockchainStorageClient` instead of `TonClient4`. There is a helper function, `wrapTonClient4ForRemote`, to wrap a `TonClient4` into `RemoteBlockchainStorageClient`. This is a breaking change
- Updated default config
- `Blockchain.create` now accepts an optional `BlockchainConfig = Cell | 'default' | 'slim'` as the config. If nothing or `'default'` is specified, the default config is used, if `'slim'` is specified, the slim config is used (it is much smaller than the default config, which improves performance), if a `Cell` is passed, then it is used as the config

### Removed

- Removed ton as a peer dependency

## [0.7.0] - 2023-03-27

### Added

- Added `externals: ExternalOut[]` field to `BlockchainTransaction` and `SendMessageResult`. `ExternalOut` is a specialized type for external out messages compatible with `Message` from ton-core

### Changed

- Get methods now throw a specialized error type `GetMethodError` when exit code is not 0
- Smart contracts now throw a specialized error type `TimeError` when trying to run a transaction at a unix timestamp that is less than the unix timestamp of the last transaction
- Get methods now return `gasUsed` and `logs` from the `ContractProvider` on opened contracts

### Other

- Consecutive transaction emulations have been optimized

## [0.6.1] - 2023-03-16

### Fixed

- Fixed `blockchain.now` override for get methods in opened contracts

## [0.6.0] - 2023-03-13

### Added

- Added `treasury.getBalance` method
- Added `blockchain.now` getter and setter to override current unix time as seen during contract execution (both transactions and get methods). Note that this is unix timestamp, not JS timestamp, so you need to use `Math.floor(Date.now() / 1000)` instead of `Date.now()` to set current time

### Changed

- `RemoteBlockchainStorage` constructor now accepts a second optional parameter, `blockSeqno?: number`. If passed, all accounts will be pulled from that block number instead of the latest one

## [0.5.1] - 2023-03-02

### Changed

- Changed ton and ton-core dev and peer dependencies to versions 13.4.1 and 0.48.0 respectively

### Fixed

- Fixed typos in `SendMode.PAY_GAS_SEPARATLY` (missing E) from ton-core

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