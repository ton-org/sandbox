import { VMResults } from "../executor/emulatorExec";

export class SmartContractError extends Error {
    logs: string;
    debugLogs: string[];

    constructor(message: string, logs: string, debugLogs: string[]) {
        super(message);

        this.logs = logs;
        this.debugLogs = debugLogs;
    }
}

export class SmartContractExternalNotAcceptedError extends Error {
    logs: string;
    debugLogs: string[];
    vmResults: VMResults;

    constructor(message: string, logs: string, debugLogs: string[], vmResults: VMResults) {
        super(message);

        this.logs = logs;
        this.debugLogs = debugLogs;
        this.vmResults = vmResults;
    }
}