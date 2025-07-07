import { Cell, type ShardAccount } from '@ton/core';
import { DebugInfo as FuncDebugInfo } from '@ton-community/func-js';

import type { DebugInfo, SourceMap } from './Debuggee';
import { parseMarks } from './marks';
import { isBrowser } from '../utils/environment';

export type DebugInfoCache = Map<string, DebugInfo>;

const defaultDebugInfoCache: DebugInfoCache = new Map();

export function getDebugInfo(acc: ShardAccount): { uninitialized: boolean; debugInfo: DebugInfo | undefined } {
    if (acc.account === undefined || acc.account === null) {
        return { uninitialized: true, debugInfo: undefined };
    }
    if (acc.account.storage.state.type !== 'active') {
        return { uninitialized: true, debugInfo: undefined };
    }
    const code = acc.account.storage.state.state.code;
    if (code === undefined || code === null) {
        return { uninitialized: true, debugInfo: undefined };
    }
    const debugInfo = defaultDebugInfoCache.get(code.hash().toString('base64'));
    return { uninitialized: false, debugInfo };
}

export function registerCompiledContract(code: Cell, debugInfo: FuncDebugInfo, marks: Cell) {
    if (isBrowser()) {
        throw new Error('Debug feature is not supported in browser environment');
    }

    const parsedMarks = parseMarks(marks, code);

    const { locations, globals } = debugInfo;

    const sm: SourceMap = {};

    for (let i = 0; i < locations.length; i++) {
        const di = locations[i];
        const common = {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            path: require('node:path').resolve(di.file),
            line: di.line,
            function: di.func,
            contextId: di.ctx_id,
            requireContextId: di.req_ctx_id,
        };
        if (di.ret) {
            sm[i] = {
                ...common,
                type: 'return',
            };
        } else if (di.try_catch_ctx_id !== undefined) {
            sm[i] = {
                ...common,
                type: 'try_begin',
                catchContextId: di.try_catch_ctx_id,
            };
        } else if (di.is_try_end) {
            sm[i] = {
                ...common,
                type: 'try_end',
            };
        } else if (di.vars !== undefined) {
            sm[i] = {
                ...common,
                type: 'statement',
                variables: di.vars ?? [],
                firstStatement: di.first_stmt,
            };
        } else if (di.branch_true_ctx_id !== undefined) {
            sm[i] = {
                ...common,
                type: 'branch',
                trueContextId: di.branch_true_ctx_id,
                falseContextId: di.branch_false_ctx_id,
            };
        } else {
            sm[i] = {
                ...common,
                type: 'context',
            };
        }
    }

    defaultDebugInfoCache.set(code.hash().toString('base64'), {
        sourceMap: sm,
        globals,
        marks: parsedMarks,
    });

    return code;
}
