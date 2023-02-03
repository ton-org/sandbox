# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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