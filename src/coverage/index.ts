import type {Cell} from "@ton/core"
import type { Mapping} from "ton-assembly-dev-test/dist/runtime";
import {compileCellWithMapping, decompileCell} from "ton-assembly-dev-test/dist/runtime"
import {print, parse} from "ton-assembly-dev-test/dist/text"
import {createMappingInfo, createTraceInfoPerTransaction} from "ton-assembly-dev-test/dist/trace"
import {buildLineInfo, Coverage} from "./data"
import {BlockchainTransaction} from "../blockchain/Blockchain";

export function collectAsmCoverage(cell: Cell, logs: string) {
    const [cleanCell, mapping] = recompileCell(cell, false)
    const info = createMappingInfo(mapping)

    const traceInfos = createTraceInfoPerTransaction(logs, info, undefined)
    const assembly = print(decompileCell(cleanCell))
    const combinedTrace = {steps: traceInfos.flatMap(trace => trace.steps)}
    const combinedLines = buildLineInfo(combinedTrace, assembly)
    return {
        code: cell,
        lines: combinedLines,
    };
}

export const recompileCell = (cell: Cell, forFunC: boolean): [Cell, Mapping] => {
    const instructionsWithoutPositions = decompileCell(cell)
    const assemblyForPositionsRaw = print(instructionsWithoutPositions)

    // filter out all DEBUGMARK lines from the assembly
    const assemblyForPositions = forFunC
        ? assemblyForPositionsRaw
        : assemblyForPositionsRaw
              .split("\n")
              .filter(it => !it.includes("DEBUGMARK"))
              .join("\n")

    const parseResult = parse("out.tasm", assemblyForPositions)
    if (parseResult.$ === "ParseFailure") {
        throw new Error("Cannot parse resulting text Assembly")
    }

    return compileCellWithMapping(parseResult.instructions)
}

export function collectTxsCoverage(results: Coverage[], code: Cell, transactions: readonly BlockchainTransaction[]) {
    for (const transaction of transactions) {
        collectTxCoverage(results, code, transaction.vmLogs);
    }
}

export function collectTxCoverage(results: Coverage[], code: Cell, vmLogs: string) {
    const coverage = collectAsmCoverage(code, vmLogs);
    results.push(coverage);
}

export {generateHtml} from "./html"
export {generateTextReport} from "./text"
export * from "./data"
