import * as Net from 'net';

import { GetMethodArgs, Executor, GetMethodResult, RunTransactionArgs, EmulationResult } from '../executor/Executor';
import { Debuggee, DebugInfo } from './Debuggee';
import { TVMDebugSession } from './TVMDebugSession';

const port = 42069;

function initDebuggee(executor: Executor) {
    let dbg!: Debuggee;
    const promise = new Promise((resolve) => {
        dbg = new Debuggee(executor, resolve);
    });
    return { dbg, promise };
}

export async function debugGetMethod(
    executor: Executor,
    args: GetMethodArgs,
    debugInfo: DebugInfo,
): Promise<GetMethodResult> {
    // eslint-disable-next-line no-console
    console.log('Launched get method debug session. Please connect using the extension.');

    const { dbg, promise } = initDebuggee(executor);
    dbg.prepareGetMethod(args, debugInfo);
    const server = Net.createServer((socket) => {
        const session = new TVMDebugSession(dbg);
        session.setRunAsServer(true);
        session.start(socket, socket);
    }).listen(port);
    const result = await promise;
    server.close();
    return result as GetMethodResult;
}

export async function debugTransaction(executor: Executor, args: RunTransactionArgs, debugInfo: DebugInfo) {
    // eslint-disable-next-line no-console
    console.log('Launched transaction debug session. Please connect using the extension.');

    const { dbg, promise } = initDebuggee(executor);
    dbg.prepareTransaction(args, debugInfo);
    const server = Net.createServer((socket) => {
        const session = new TVMDebugSession(dbg);
        session.setRunAsServer(true);
        session.start(socket, socket);
    }).listen(port);
    const result = await promise;
    server.close();
    return result as EmulationResult;
}
