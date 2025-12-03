# UI Protocol

The **UI Protocol** defines the communication interface between the testing environment and the Sandbox UI.  
When `SANDBOX_UI_ENABLED` is set, test data and blockchain state updates are sent to the UI for visualization and debugging.  
This allows developers to inspect transactions, contract states, and logs in real time.

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
  "testInfo": TestInfo | undefined,
  "transactions": RawTransactionsInfo,
  "contracts": RawContractData[]
}
```

## Data Formats

### TestInfo
```typescript
{
  "id": string | undefined,
  "name": string | undefined,
  "path": string | undefined
}
```

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
