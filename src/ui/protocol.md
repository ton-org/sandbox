# UI Protocol

TODO: describe
SANDBOX_UI_ENABLED

## Connection

### Websocket
- **Port**: 7743 (default)
- **Host**: localhost (default)
- **Environment Variable**: `SANDBOX_WEBSOCKET_ADDR` (overrides default)

## Message Types

### 1. Test Data Message
```typescript
{
  "type": "test-data",
  "testName": string | undefined,
  "transactions": RawTransactionsInfo,
  "contracts": RawContractData[]
}
```

## Data Formats

### RawTransactionInfo
```typescript
{
  "transaction": string,           // Hex-encoded BOC transaction
  "blockchainLogs": string,        // Blockchain execution logs
  "vmLogs": string,               // VM execution logs
  "debugLogs": string,            // Debug output logs
  "code": string | undefined,     // Contract code (hex)
  "sourceMap": object | undefined, // Source mapping
  "contractName": string | undefined, // Contract name
  "parentId": string | undefined,    // Parent transaction ID
  "childrenIds": string[],           // Child transaction IDs
  "oldStorage": string | undefined,  // Old storage state (hex)
  "newStorage": string | undefined,  // New storage state (hex)
  "callStack": string | undefined    // Function call stack
}
```

### RawTransactionsInfo
```
{
  "transactions": RawTransactionInfo[]
}
```

### RawContractData
```
{
  "address": string,              // Contract address
  "meta": ContractMeta | undefined, // Contract metadata
  "stateInit": string | undefined,  // State init (hex BOC)
  "account": string               // Account data (hex BOC)
}
```

### ContractMeta
```
{
  "wrapperName": string | undefined;
  "abi": ContractABI | undefined;
  "treasurySeed": string | undefined;
}
```
