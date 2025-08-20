import type { trace } from 'ton-assembly';
import { Cell } from '@ton/core';

export type CoverageData = {
    readonly code: Cell;
    readonly lines: readonly Line[];
};

export type Line = {
    readonly line: string;
    readonly info: Covered | Uncovered | Skipped;
};

export type Covered = {
    readonly $: 'Covered';
    readonly hits: number;
    readonly gasCosts: readonly number[];
};

export type Uncovered = {
    readonly $: 'Uncovered';
};

export type Skipped = {
    readonly $: 'Skipped';
};

export type InstructionStat = {
    readonly name: string;
    readonly totalGas: number;
    readonly totalHits: number;
    readonly avgGas: number;
};

export type CoverageSummary = {
    readonly totalLines: number;
    readonly coveredLines: number;
    readonly uncoveredLines: number;
    readonly coveragePercentage: number;
    readonly totalGas: number;
    readonly totalHits: number;
    readonly instructionStats: readonly InstructionStat[];
};

export function buildLineInfo(trace: trace.TraceInfo, asm: string): readonly Line[] {
    const lines = asm.split('\n');

    const perLineSteps: Map<number, trace.Step[]> = new Map();

    for (const step of trace.steps) {
        if (step.loc === undefined) continue;
        const line = step.loc.line;

        perLineSteps.set(line + 1, [...(perLineSteps.get(line + 1) ?? []), step]);

        if (step.loc.otherLines.length > 0) {
            for (const otherLine of step.loc.otherLines) {
                perLineSteps.set(otherLine + 1, [...(perLineSteps.get(otherLine + 1) ?? []), step]);
            }
        }
    }

    return lines.map((line, idx): Line => {
        const info = perLineSteps.get(idx + 1);
        if (info) {
            const gasInfo = info.map((step) => normalizeGas(step.gasCost));

            return {
                line,
                info: {
                    $: 'Covered',
                    hits: gasInfo.length,
                    gasCosts: gasInfo,
                },
            };
        }

        if (!isExecutableLine(line)) {
            return {
                line,
                info: {
                    $: 'Skipped',
                },
            };
        }

        return {
            line,
            info: {
                $: 'Uncovered',
            },
        };
    });
}

function normalizeGas(gas: number): number {
    if (gas > 10000) {
        // Normalize first SETCP to normal value
        return 26;
    }
    return gas;
}

export function isExecutableLine(line: string): boolean {
    const trimmed = line.trim();
    return (
        !trimmed.includes('=>') && // dictionary
        trimmed !== '}' && // close braces
        trimmed !== ']' && // close bracket
        trimmed.length > 0
    );
}

export function generateCoverageSummary(coverage: CoverageData): CoverageSummary {
    const lines = coverage.lines;
    const totalExecutableLines = lines.filter((line) => isExecutableLine(line.line)).length;

    const coveredLines = lines.filter((line) => isExecutableLine(line.line) && line.info.$ === 'Covered').length;
    const uncoveredLines = totalExecutableLines - coveredLines;
    const coveragePercentage = totalExecutableLines === 0 ? 0 : (coveredLines / totalExecutableLines) * 100;

    let totalGas = 0;
    let totalHits = 0;

    const instructionMap: Map<string, { readonly totalGas: number; readonly hits: number }> = new Map();

    for (const line of lines) {
        if (line.info.$ !== 'Covered') continue;

        const lineGas = line.info.gasCosts.reduce((sum, gas) => sum + gas, 0);
        totalGas += lineGas;
        totalHits += line.info.hits;
        const trimmedLine = line.line.trim();
        const instructionName = trimmedLine.split(/\s+/)[0];
        if (instructionName !== undefined) {
            const current = instructionMap.get(instructionName) ?? { totalGas: 0, hits: 0 };
            instructionMap.set(instructionName, {
                totalGas: current.totalGas + lineGas,
                hits: current.hits + line.info.hits,
            });
        }
    }

    const instructionStats: InstructionStat[] = [...instructionMap.entries()]
        .map(([name, stats]) => ({
            name,
            totalGas: stats.totalGas,
            totalHits: stats.hits,
            avgGas: stats.hits === 0 ? 0 : Math.round((stats.totalGas / stats.hits) * 100) / 100,
        }))
        .sort((a, b) => b.totalGas - a.totalGas);

    return {
        totalLines: totalExecutableLines,
        coveredLines,
        uncoveredLines,
        coveragePercentage,
        totalGas,
        totalHits,
        instructionStats,
    };
}

export function mergeCoverages(...coverages: readonly CoverageData[]): CoverageData {
    if (coverages.length === 0) {
        return {
            code: new Cell(),
            lines: [],
        };
    }

    let allLines: readonly Line[] = coverages[0]?.lines ?? [];
    for (const coverage of coverages.slice(1)) {
        allLines = mergeTwoLines(allLines, coverage.lines);
    }
    return {
        code: coverages[0]?.code ?? new Cell(),
        lines: allLines,
    };
}

export function mergeTwoLines(first: readonly Line[], second: readonly Line[]): readonly Line[] {
    if (first.length !== second.length) return first;

    const result: Line[] = [...first];

    for (const [index, line] of second.entries()) {
        const prev = result[index];
        if (!prev) continue;

        if (prev.info.$ === 'Uncovered' && line.info.$ === 'Uncovered') {
            // nothing changes
            continue;
        }

        if (prev.info.$ === 'Skipped' && line.info.$ === 'Skipped') {
            // nothing changes
            continue;
        }

        if (prev.info.$ === 'Uncovered' && line.info.$ === 'Covered') {
            // replace it with new data
            result[index] = line;
        }

        if (prev.info.$ === 'Covered' && line.info.$ === 'Uncovered') {
            // nothing changes
            continue;
        }

        if (prev.info.$ === 'Covered' && line.info.$ === 'Covered') {
            result[index] = {
                ...prev,
                info: {
                    ...prev.info,
                    hits: prev.info.hits + line.info.hits,
                    gasCosts: [...prev.info.gasCosts, ...line.info.gasCosts],
                },
            };
        }
    }

    return result;
}
