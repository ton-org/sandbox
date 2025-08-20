import { Address, beginCell, Cell } from '@ton/core';
import { runtime, text, trace } from 'ton-assembly';

import { BlockchainTransaction } from '../blockchain/Blockchain';
import { buildLineInfo, CoverageData } from './data';

export function collectAsmCoverage(cell: Cell, logs: string): CoverageData {
    const [cleanCell, mapping] = recompileCell(cell);
    const info = trace.createMappingInfo(mapping);

    const traceInfos = trace.createTraceInfoPerTransaction(logs, info, undefined);
    const assembly = text.print(runtime.decompileCell(cleanCell));
    const combinedTrace = { steps: traceInfos.flatMap((trace) => trace.steps) };
    const combinedLines = buildLineInfo(combinedTrace, assembly);
    return {
        code: cell,
        lines: combinedLines,
    };
}

function recompileCell(cell: Cell): [Cell, runtime.Mapping] {
    const instructionsWithoutPositions = runtime.decompileCell(cell);
    const assemblyForPositions = text.print(instructionsWithoutPositions);

    const parseResult = text.parse('out.tasm', assemblyForPositions);
    if (parseResult.$ === 'ParseFailure') {
        throw new Error('Cannot parse resulting text Assembly');
    }

    return runtime.compileCellWithMapping(parseResult.instructions);
}

export function collectTxsCoverage(
    code: Cell,
    address: Address | undefined,
    transactions: readonly BlockchainTransaction[],
): CoverageData[] {
    const results: CoverageData[] = [];

    for (const transaction of transactions) {
        const txAddress = bigintToAddress(transaction.address);
        if (address !== undefined && txAddress?.toString() !== address.toString()) {
            // other contract transaction, skip
            continue;
        }

        results.push(collectAsmCoverage(code, transaction.vmLogs));
    }

    return results;
}

function bigintToAddress(addr: bigint | undefined): Address | undefined {
    if (addr === undefined) return undefined;

    try {
        const slice = beginCell().storeUint(4, 3).storeUint(0, 8).storeUint(addr, 256).asSlice();
        return slice.loadAddress();
    } catch {
        return undefined;
    }
}
