# Code Coverage Guide

This guide explains how to collect, analyze, and work with code coverage data in your TON smart contract tests. Coverage
analysis helps you understand which parts of your contract code are tested and which areas might need additional test
coverage.

## Quick Start

### 1. Enable Coverage Collection

Before running tests, add `blockchain.enableCoverage()` to collect coverage data:

```typescript
import {Blockchain} from '@ton/sandbox';
import process = require("node:process");

describe('Contract Tests', () => {
    let blockchain: Blockchain;
    let contract: SandboxContract<MyContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        blockchain.enableCoverage();
        // or for COVERAGE=true mode only
        // blockchain.enableCoverage(process.env["COVERAGE"] === "true");

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
    console.log(coverage?.summary());
})
```

### 3. Generate Reports

```typescript
import {writeFileSync} from 'fs';

afterAll(() => {
    const coverage = blockchain.coverage(contract);
    blockchain.enableCoverage();

    // Generate HTML report for detailed analysis
    const htmlReport = coverage.report("html");
    writeFileSync("coverage.html", htmlReport);

    // Print text text report to console
    const textReport = coverage?.report("text");
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

- **HTML Report**: Interactive report with highlighting and line-by-line coverage details
- **Text Report**: Console-friendly report with coverage information and marked code

## Advanced Usage Patterns

### Multiple Test Suites

When running multiple test files, you might want to merge coverage data:

```typescript
// In first test file
const coverage1 = blockchain.coverage(contract);
if (!coverage1) return;
const coverage1Json = coverage1.toJson();
writeFileSync("coverage1.json", coverage1Json);

// In second test file  
const coverage2 = blockchain.coverage(contract);
if (!coverage2) return;
const coverage2Json = coverage2.toJson();
writeFileSync("coverage2.json", coverage2Json);

// Merge coverage data in separate script after tests
const savedCoverage1 = Coverage.fromJson(readFileSync("coverage1.json", "utf-8"));
const savedCoverage2 = Coverage.fromJson(readFileSync("coverage2.json", "utf-8"));
const totalCoverage = savedCoverage1.mergeWith(savedCoverage2);

console.log(`Combined coverage: ${totalCoverage.summary().coveragePercentage}%`);
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
        blockchain.enableCoverage();

        // Deploy multiple contracts
        contract1 = blockchain.openContract(Contract1.fromInit());
        contract2 = blockchain.openContract(Contract2.fromInit());
    });

    afterAll(() => {
        // Get coverage for each contract separately
        const coverage1 = blockchain.coverage(contract1);
        const coverage2 = blockchain.coverage(contract2);

        if (!coverage1 || !coverage2) return;

        console.log('Contract 1 Coverage:', coverage1.summary().coveragePercentage);
        console.log('Contract 2 Coverage:', coverage2.summary().coveragePercentage);

        // Generate separate reports
        writeFileSync("contract1-coverage.html", coverage1.report("html"));
        writeFileSync("contract2-coverage.html", coverage2.report("html"));
    });
});
```
