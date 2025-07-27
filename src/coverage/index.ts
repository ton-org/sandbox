import {Address, Cell, beginCell} from "@ton/core"
import type {Mapping} from "ton-assembly-dev-test/dist/runtime";
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

export function collectTxsCoverage(code: Cell, address: Address | undefined, transactions: readonly BlockchainTransaction[]): Coverage[] {
    const results: Coverage[] = []

    for (const transaction of transactions) {
        if (address !== undefined && bigintToAddress(transaction.address)?.toString() !== address.toString()) {
            // other contract transaction
            continue
        }

        results.push(collectAsmCoverage(code, transaction.vmLogs));
    }

    return results
}

const bigintToAddress = (addr: bigint | undefined): Address | undefined => {
    if (addr === undefined) return undefined

    try {
        const slice = beginCell().storeUint(4, 3).storeUint(0, 8).storeUint(addr, 256).asSlice()
        return slice.loadAddress()
    } catch {
        return undefined
    }
}

export {generateHtmlReport} from "./html"
export {generateTextReport} from "./text"
export * from "./data"
