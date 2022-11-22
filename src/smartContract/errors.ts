import { VMResults } from "../emulator-exec/emulatorExec";

export class SmartContractError extends Error {
    logs: string;

    constructor(message: string, logs: string) {
        super(message);

        this.logs = logs;
    }
}

export class SmartContractExternalNotAcceptedError extends Error {
    logs: string;
    vmResults: VMResults;

    constructor(message: string, logs: string, vmResults: VMResults) {
        super(message);

        this.logs = logs;
        this.vmResults = vmResults;
    }
}