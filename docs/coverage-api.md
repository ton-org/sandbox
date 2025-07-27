# Code Coverage Guide

This guide explains how to collect, analyze, and work with code coverage data in your TON smart contract tests. Coverage
analysis helps you understand which parts of your contract code are tested and which areas might need additional test
coverage.

## Quick Start

### 1. Enable Coverage Collection

Before running tests, enable verbose VM logs to collect coverage data:

```typescript
import {Blockchain} from '@ton/sandbox';

describe('Contract Tests', () => {
    let blockchain: Blockchain;
    let contract: SandboxContract<MyContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        // Enable coverage collection
        blockchain.verbosity.vmLogs = "vm_logs_verbose";

        // Deploy your contract
        contract = blockchain.openContract(MyContract.fromInit());
        // ... deployment logic
    });

    // Your tests here...
});
```

### 2. Collect Coverage After Tests

```typescript
afterAll(() => {
    const coverage = blockchain.coverage(contract);
    console.log(coverage.summary());
})
```

### 3. Generate Reports

```typescript
import {writeFileSync} from 'fs';

afterAll(async () => {
    const coverage = blockchain.coverage(contract);

    // Generate HTML report for detailed analysis
    const htmlReport = coverage.report("html");
    writeFileSync("coverage.html", htmlReport);

    // Print text text report to console
    const textReport = coverage.report("text");
    console.log(textReport);
});
```

## Understanding Coverage Data

### Coverage Summary

The coverage summary provides key metrics about your test coverage:

```typescript
const summary = coverage.summary();

console.log(`Total lines: ${summary.totalLines}`);
console.log(`Covered lines: ${summary.coveredLines}`);
console.log(`Coverage percentage: ${summary.coveragePercentage.toFixed(2)}%`);
console.log(`Total gas consumed: ${summary.totalGas}`);
console.log(`Total hits: ${summary.totalHits}`);

// Instruction-level statistics
summary.instructionStats.forEach(stat => {
    console.log(`${stat.name}: ${stat.totalHits} hits, ${stat.totalGas} gas, avg ${stat.avgGas}`);
});
```

### Coverage Reports

- **HTML Report**: Interactive report with syntax highlighting and line-by-line coverage details
- **Text Report**: Console-friendly summary with basic coverage information

## Advanced Usage Patterns

### Multiple Test Suites

When running multiple test files, you might want to merge coverage data:

```typescript
// In first test file
const coverage1 = blockchain.coverage(contract);
const coverage1Json = coverage1.toJson();
writeFileSync("coverage1.json", coverage1Json);

// In second test file  
const coverage2 = blockchain.coverage(contract);
const coverage2Json = coverage2.toJson();
writeFileSync("coverage2.json", coverage2Json);

// Merge coverage data
const savedCoverage1 = Coverage.fromJson(readFileSync("coverage1.json", "utf-8"));
const savedCoverage2 = Coverage.fromJson(readFileSync("coverage2.json", "utf-8"));
const totalCoverage = savedCoverage1.mergeWith(savedCoverage2);

console.log(`Combined coverage: ${totalCoverage.summary().coveragePercentage}%`);
```

### Get Method Coverage

Coverage includes both transactions and get method calls:

```typescript
// Execute transactions
await contract.send(sender, {value: toNano('1')}, 'setValue');

// Execute get methods
const value = await contract.getValue();
const balance = await contract.getBalance();

// Coverage includes both transaction and get method execution
const coverage = blockchain.coverage(contract);
```

## Coverage for Multiple Contracts

When testing systems with multiple contracts:

```typescript
describe('Multi-Contract System', () => {
    let blockchain: Blockchain;
    let contract1: SandboxContract<Contract1>;
    let contract2: SandboxContract<Contract2>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        blockchain.verbosity.vmLogs = "vm_logs_verbose";

        // Deploy multiple contracts
        contract1 = blockchain.openContract(Contract1.fromInit());
        contract2 = blockchain.openContract(Contract2.fromInit());
    });

    afterAll(() => {
        // Get coverage for each contract separately
        const coverage1 = blockchain.coverage(contract1);
        const coverage2 = blockchain.coverage(contract2);

        console.log('Contract 1 Coverage:', coverage1.summary().coveragePercentage);
        console.log('Contract 2 Coverage:', coverage2.summary().coveragePercentage);

        // Generate separate reports
        writeFileSync("contract1-coverage.html", coverage1.report("html"));
        writeFileSync("contract2-coverage.html", coverage2.report("html"));
    });
});
```
