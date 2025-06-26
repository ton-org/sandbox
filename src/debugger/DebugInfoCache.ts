import { resolve } from 'node:path';

import { Cell } from '@ton/core';
import { DebugInfo as FuncDebugInfo } from '@ton-community/func-js';

import { DebugInfo, SourceMap } from './Debuggee';
import { parseMarks } from './marks';

export type DebugInfoCache = Map<string, DebugInfo>;

export const defaultDebugInfoCache: DebugInfoCache = new Map();

export function registerCompiledContract(code: Cell, debugInfo: FuncDebugInfo, marks: Cell) {
    const parsedMarks = parseMarks(marks, code);

    const { locations, globals } = debugInfo;

    const sm: SourceMap = {};

    for (let i = 0; i < locations.length; i++) {
        const di = locations[i];
        const common = {
            path: resolve(di.file),
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
