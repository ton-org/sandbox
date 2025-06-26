import EventEmitter from 'node:events';

import { TupleItem } from '@ton/core';

import { Executor, GetMethodArgs, RunTransactionArgs } from '../executor/Executor';

export type SourceMapEntry = {
    path: string;
    line: number;
    function: string;
    contextId: number;
    requireContextId?: number;
} & (
    | {
          type: 'statement';
          variables: string[];
          firstStatement?: true;
      }
    | {
          type: 'return';
      }
    | {
          type: 'try_begin';
          catchContextId: number;
      }
    | {
          type: 'try_end';
      }
    | {
          type: 'context';
      }
    | {
          type: 'branch';
          trueContextId: number;
          falseContextId?: number;
      }
);

export type DebugMarks = Map<string, Map<number, number[]>>;

export type SourceMap = {
    [k: number]: SourceMapEntry;
};

export type GlobalEntry = {
    name: string;
};

export type DebugInfo = {
    sourceMap: SourceMap;
    globals: GlobalEntry[];
    marks: DebugMarks;
};

type Breakpoint = {
    id: number;
    line: number;
    verified: boolean;
};

export type Variable = {
    name: string;
    value: TupleItem;
};

type StackFrame = {
    function: string;
    path: string;
    line: number;
    nextContextId: number;
    contextId: number;
    shouldTryNoStep: boolean;
    stepped: boolean;
};

type StepUntil =
    | { type: 'breakpoint' }
    | { type: 'any-line'; stopEvent: 'stopOnBreakpoint' | 'stopOnStep' }
    | { type: 'next-line'; depth: number }
    | { type: 'out'; depth: number };

type TryContext = {
    contextId: number;
    frameDepth: number;
};

export class Debuggee extends EventEmitter {
    executor: Executor;
    ptr: number = 0;
    debugType: 'get' | 'tx' = 'get';
    sourceMap: SourceMap = {};
    availableLines: { [k: string]: number[] } = {};
    breakpoints: Map<string, Breakpoint[]> = new Map();
    breakpointID: number = 0;
    frames: StackFrame[] = [];
    globals: GlobalEntry[] = [];
    debugMarks: DebugMarks = new Map();
    tryContexts: TryContext[] = [];
    finishedCallback: (v: unknown) => void;

    constructor(executor: Executor, finishedCallback: (v: unknown) => void) {
        super();
        this.executor = executor;
        this.executor.debugLogFunc = (s: string) => {
            this.sendEvent('output', s);
        };
        this.finishedCallback = finishedCallback;
    }

    setDebugInfo(debugInfo: DebugInfo) {
        this.setSourceMap(debugInfo.sourceMap);
        this.setGlobals(debugInfo.globals);
        this.setDebugMarks(debugInfo.marks);
    }

    setDebugMarks(marks: DebugMarks) {
        this.debugMarks = marks;
    }

    setSourceMap(sourceMap: SourceMap) {
        this.sourceMap = sourceMap;
        for (const di in sourceMap) {
            const sem = sourceMap[di];
            if (!(sem.path in this.availableLines)) {
                this.availableLines[sem.path] = [];
            }
            this.availableLines[sem.path].push(sem.line);
        }
    }

    setGlobals(globals: GlobalEntry[]) {
        this.globals = globals;
    }

    getAvailableSourcePaths() {
        return Object.keys(this.availableLines);
    }

    getAvailableLines(path: string) {
        return this.availableLines[path] ?? [];
    }

    isLineAvailable(path: string, line: number) {
        if (!(path in this.availableLines)) {
            return false;
        }
        const lines = this.availableLines[path];
        return lines.indexOf(line) >= 0;
    }

    continue() {
        this.stepUntil({ type: 'breakpoint' });
    }

    stepIn() {
        this.stepUntil({ type: 'any-line', stopEvent: 'stopOnStep' });
    }

    stepOver() {
        this.stepUntil({ type: 'next-line' });
    }

    stepOut() {
        this.stepUntil({ type: 'out' });
    }

    startGetMethod(args: GetMethodArgs) {
        this.ptr = this.executor.sbsGetMethodSetup(args);
        this.debugType = 'get';
    }

    startTransaction(args: RunTransactionArgs) {
        const { emptr, res } = this.executor.sbsTransactionSetup(args);
        if (res !== 1) {
            throw new Error('Could not setup SBS transaction, result: ' + res);
        }
        this.ptr = emptr;
        this.debugType = 'tx';
    }

    getC7() {
        switch (this.debugType) {
            case 'get':
                return this.executor.sbsGetMethodC7(this.ptr);
            case 'tx':
                return this.executor.sbsTransactionC7(this.ptr);
        }
    }

    vmStep() {
        switch (this.debugType) {
            case 'get':
                return this.executor.sbsGetMethodStep(this.ptr);
            case 'tx':
                return this.executor.sbsTransactionStep(this.ptr);
        }
    }

    codePos() {
        switch (this.debugType) {
            case 'get':
                return this.executor.sbsGetMethodCodePos(this.ptr);
            case 'tx':
                return this.executor.sbsTransactionCodePos(this.ptr);
        }
    }

    getStack() {
        switch (this.debugType) {
            case 'get':
                return this.executor.sbsGetMethodStack(this.ptr);
            case 'tx':
                return this.executor.sbsTransactionStack(this.ptr);
        }
    }

    getContDistinguisher() {
        switch (this.debugType) {
            case 'get':
                return this.executor.sbsGetMethodGetContDistinguisher(this.ptr);
            case 'tx':
                return this.executor.sbsTransactionGetContDistinguisher(this.ptr);
        }
    }

    setContDistinguishers(distinguisher: number, trueDistinguisher: number, falseDistinguisher: number) {
        switch (this.debugType) {
            case 'get':
                this.executor.sbsGetMethodSetContDistinguishers(
                    this.ptr,
                    distinguisher,
                    trueDistinguisher,
                    falseDistinguisher,
                );
                break;
            case 'tx':
                this.executor.sbsTransactionSetContDistinguishers(
                    this.ptr,
                    distinguisher,
                    trueDistinguisher,
                    falseDistinguisher,
                );
                break;
        }
    }

    getContDistinguisherTriggered() {
        switch (this.debugType) {
            case 'get':
                return this.executor.sbsGetMethodGetContDistinguisherTriggered(this.ptr);
            case 'tx':
                return this.executor.sbsTransactionGetContDistinguisherTriggered(this.ptr);
        }
    }

    setTryParams(primed: number, triggered: number) {
        switch (this.debugType) {
            case 'get':
                this.executor.sbsGetMethodSetTryParams(this.ptr, primed, triggered);
                break;
            case 'tx':
                this.executor.sbsTransactionSetTryParams(this.ptr, primed, triggered);
                break;
        }
    }

    getTriggeredTryParam() {
        switch (this.debugType) {
            case 'get':
                return this.executor.sbsGetMethodGetTriggeredTryParam(this.ptr);
            case 'tx':
                return this.executor.sbsTransactionGetTriggeredTryParam(this.ptr);
        }
    }

    getLocalVariables(): Variable[] | undefined {
        const sme = this.currentSourceMapEntry(false);
        if (sme === undefined || sme.type !== 'statement') {
            return undefined;
        }

        const vars: Variable[] = [];

        const stack = this.getStack();
        for (let i = 0; i < sme.variables.length; i++) {
            vars.push({
                name: sme.variables[i],
                value: stack[i],
            });
        }

        return vars;
    }

    getGlobalVariables(): Variable[] | undefined {
        const vars: Variable[] = [];

        const c7item = this.getC7();
        if (c7item.type !== 'tuple') {
            return undefined;
        }
        const c7 = c7item.items;
        for (let i = 0; i < this.globals.length; i++) {
            if (i + 1 < c7.length) {
                vars.push({
                    name: this.globals[i].name,
                    value: c7[i + 1],
                });
                continue;
            }

            vars.push({
                name: this.globals[i].name,
                value: { type: 'null' },
            });
        }

        return vars;
    }

    currentDebugMarks() {
        const codepos = this.codePos();
        return this.debugMarks.get(codepos.hash)?.get(codepos.offset);
    }

    currentSourceMapEntry(honorStepped: boolean) {
        const dms = this.currentDebugMarks();
        if (dms === undefined) {
            return undefined;
        }

        let currentContextId: number | undefined;
        let stepped: boolean | undefined;
        if (this.frames.length > 0) {
            const topFrame = this.frames[this.frames.length - 1];
            currentContextId = topFrame.contextId;
            stepped = topFrame.stepped;
        }

        for (const dm of dms) {
            const entry = this.sourceMap[dm];
            if (
                (entry.type === 'statement' &&
                    entry.firstStatement &&
                    entry.requireContextId === undefined &&
                    (stepped || !honorStepped)) ||
                entry.requireContextId === currentContextId
            ) {
                return entry;
            }
        }

        return undefined;
    }

    breakpointKey(path: string, line: number) {
        return path + ':' + line;
    }

    splitBreakpointKey(k: string) {
        const i = k.lastIndexOf(':');
        return {
            path: k.slice(0, i),
            line: parseInt(k.slice(i + 1)),
        };
    }

    clearBreakpoints(path: string) {
        this.breakpoints.set(path, []);
    }

    hasBreakpoint(path: string, line: number) {
        return (this.breakpoints.get(path) ?? []).findIndex((v) => v.line === line) >= 0;
    }

    setBreakpoint(path: string, line: number): Breakpoint {
        let arr = this.breakpoints.get(path);
        if (arr === undefined) {
            arr = [];
            this.breakpoints.set(path, arr);
        }
        const bp: Breakpoint = {
            id: this.breakpointID++,
            line,
            verified: this.isLineAvailable(path, line),
        };
        arr.push(bp);
        return bp;
    }

    sendEvent(event: string, ...args: unknown[]): void {
        setTimeout(() => {
            this.emit(event, ...args);
        }, 0);
    }

    onFinished() {
        this.sendEvent('end');
        let r: unknown;
        switch (this.debugType) {
            case 'get': {
                r = this.executor.sbsGetMethodResult(this.ptr);
                this.executor.destroyTvmEmulator(this.ptr);
                break;
            }
            case 'tx': {
                r = this.executor.sbsTransactionResult(this.ptr);
                this.executor.destroyEmulator(this.ptr);
                break;
            }
        }

        this.finishedCallback(r);
    }

    stackFrames(): StackFrame[] {
        return this.frames;
    }

    applySourceMapEntry(sme: SourceMapEntry, until: StepUntil): { stopStepping: boolean } {
        let stopStepping = false;

        switch (sme.type) {
            case 'statement': {
                if (sme.firstStatement) {
                    this.frames.push({
                        function: sme.function,
                        path: sme.path,
                        line: sme.line,
                        contextId: sme.contextId,
                        shouldTryNoStep: true,
                        nextContextId: sme.contextId,
                        stepped: false,
                    });
                }

                if (this.frames.length > 0) {
                    const topFrame = this.frames[this.frames.length - 1];
                    topFrame.line = sme.line;
                }

                switch (until.type) {
                    case 'breakpoint': {
                        if (this.hasBreakpoint(sme.path, sme.line)) {
                            this.sendEvent('stopOnBreakpoint');
                            stopStepping = true;
                        }
                        break;
                    }
                    case 'any-line': {
                        this.sendEvent(until.stopEvent);
                        stopStepping = true;
                        break;
                    }
                    case 'next-line': {
                        if (this.frames.length <= until.depth) {
                            this.sendEvent('stopOnStep');
                            stopStepping = true;
                        }
                        break;
                    }
                    case 'out': {
                        if (this.frames.length < until.depth) {
                            this.sendEvent('stopOnStep');
                            stopStepping = true;
                        }
                        break;
                    }
                }

                break;
            }
            case 'return': {
                this.frames.pop();

                return { stopStepping };
            }
            case 'try_begin': {
                this.tryContexts.push({
                    contextId: sme.catchContextId,
                    frameDepth: this.frames.length,
                });

                this.setTryParams(this.tryContexts.length - 1, -1);

                break;
            }
            case 'try_end': {
                this.tryContexts.pop();

                this.setTryParams(-1, -1);

                break;
            }
            case 'branch': {
                let falseId = -1;
                if (sme.falseContextId !== undefined) {
                    falseId = sme.falseContextId;
                }

                this.setContDistinguishers(-1, sme.trueContextId, falseId);

                break;
            }
        }

        if (this.frames.length > 0) {
            const topFrame = this.frames[this.frames.length - 1];
            topFrame.shouldTryNoStep = true;
            topFrame.nextContextId = sme.contextId;
        }

        return { stopStepping };
    }

    stepUntil(
        what:
            | { type: 'breakpoint' }
            | { type: 'any-line'; stopEvent: 'stopOnBreakpoint' | 'stopOnStep' }
            | { type: 'next-line' }
            | { type: 'out' },
    ) {
        let until: StepUntil;
        switch (what.type) {
            case 'next-line':
            case 'out': {
                until = { type: what.type, depth: this.frames.length };
                break;
            }
            default:
                until = what;
        }
        while (true) {
            if (this.frames.length > 0) {
                const topFrame = this.frames[this.frames.length - 1];

                while (topFrame.shouldTryNoStep) {
                    topFrame.contextId = topFrame.nextContextId;
                    const sme = this.currentSourceMapEntry(true);
                    if (sme === undefined) {
                        topFrame.shouldTryNoStep = false;
                        break;
                    }

                    const { stopStepping } = this.applySourceMapEntry(sme, until);
                    if (stopStepping) {
                        return;
                    }
                }
            }

            if (this.frames.length > 0) {
                const topFrame = this.frames[this.frames.length - 1];
                topFrame.stepped = true;
            }

            const finished = this.vmStep();
            if (finished) {
                this.onFinished();
                return;
            }

            const triggeredTryParam = this.getTriggeredTryParam();
            if (triggeredTryParam >= 0) {
                if (triggeredTryParam !== this.tryContexts.length - 1) {
                    throw new Error(
                        `Got triggered try param ${triggeredTryParam} but expected ${this.tryContexts.length - 1}`,
                    );
                }
                const tryContext = this.tryContexts[triggeredTryParam];
                this.tryContexts.pop();
                this.setTryParams(-1, -1);
                this.frames = this.frames.slice(0, tryContext.frameDepth);
                this.frames[this.frames.length - 1].contextId = tryContext.contextId;
            }

            if (this.getContDistinguisherTriggered()) {
                const distinguisher = this.getContDistinguisher();
                this.setContDistinguishers(-1, -1, -1);
                if (distinguisher >= 0 && this.frames.length > 0) {
                    const topFrame = this.frames[this.frames.length - 1];
                    topFrame.contextId = distinguisher;
                }
            }

            const sme = this.currentSourceMapEntry(true);
            if (sme !== undefined) {
                const { stopStepping } = this.applySourceMapEntry(sme, until);
                if (stopStepping) {
                    return;
                }
            }
        }
    }

    prepareGetMethod(args: GetMethodArgs, debugInfo: DebugInfo) {
        this.startGetMethod(args);
        this.setDebugInfo(debugInfo);
    }

    prepareTransaction(args: RunTransactionArgs, debugInfo: DebugInfo) {
        this.startTransaction(args);
        this.setDebugInfo(debugInfo);
    }

    start(debug: boolean, stopOnEntry: boolean) {
        if (debug) {
            if (stopOnEntry) {
                this.stepUntil({ type: 'any-line', stopEvent: 'stopOnBreakpoint' });
            } else {
                this.continue();
            }
        } else {
            this.continue();
        }
    }
}
