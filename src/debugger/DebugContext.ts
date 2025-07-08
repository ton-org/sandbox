import type { ShardAccount } from '@ton/core';

import type {
    EmulationResult,
    Executor,
    GetMethodArgs,
    GetMethodResult,
    RunTransactionArgs,
} from '../executor/Executor';
import type { DebugInfo } from './Debuggee';
import { isBrowser } from '../utils/environment';

// only this class is allowed to use outside the 'debugger' directory for browser support
class DebugContext {
    constructor() {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { debugGetMethod, debugTransaction } = require('./debug');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getDebugInfo } = require('./DebugInfoCache');

        this.debugGetMethod = debugGetMethod;
        this.debugTransaction = debugTransaction;
        this.getDebugInfo = getDebugInfo;
    }

    getDebugInfo: (account: ShardAccount) => { uninitialized: boolean; debugInfo: DebugInfo | undefined };
    debugGetMethod: (executor: Executor, args: GetMethodArgs, debugInfo: DebugInfo) => Promise<GetMethodResult>;
    debugTransaction: (executor: Executor, args: RunTransactionArgs, debugInfo: DebugInfo) => Promise<EmulationResult>;
}

let debugContext: DebugContext | undefined = undefined;

export function getDebugContext(): DebugContext {
    if (isBrowser()) {
        throw new Error('Debug feature is not supported in browser environment');
    }

    if (!debugContext) {
        debugContext = new DebugContext();
    }
    return debugContext;
}
