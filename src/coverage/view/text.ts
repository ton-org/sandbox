import {CoverageData, CoverageSummary, generateCoverageSummary, InstructionStat, Line} from "../data";

export function generateTextReport(coverage: CoverageData): string {
    const summary = generateCoverageSummary(coverage);

    const lines = coverage.lines;
    const maxLineNumberWidth = lines.length.toString().length;

    const annotatedLines = lines
        .map((line, index) => {
            const {gasInfo, hitsInfo, status} = lineInfo(line);

            const lineNumber = index + 1;
            const lineNumberPres = lineNumber.toString().padStart(maxLineNumberWidth);

            return `${lineNumberPres} ${status}| ${line.line.padEnd(40)} |${gasInfo.padEnd(10)} |${hitsInfo}`;
        })
        .join("\n");

    const summaryText = [
        "Coverage Summary:",
        `Lines: ${summary.coveredLines}/${summary.totalLines} (${summary.coveragePercentage.toFixed(2)}%)`,
        `Total Gas: ${summary.totalGas}`,
        `Total Hits: ${summary.totalHits}`,
        "",
        "Instruction Stats:",
        ...instructionsStats(summary),
    ].join("\n");

    return `${summaryText}\n\nAnnotated Code:\n${annotatedLines}`;
}

type LineInfo = {
    readonly gasInfo: string
    readonly hitsInfo: string
    readonly status: string
}

function lineInfo(line: Line): LineInfo {
    if (line.info.$ === "Covered") {
        const totalGas = calculateTotalGas(line.info.gasCosts);
        const gasInfo = ` gas:${totalGas}`;
        const hitInfo = ` hits:${line.info.hits}`;
        return {gasInfo, hitsInfo: hitInfo, status: "✓ "};
    }

    if (line.info.$ === "Uncovered") {
        return {gasInfo: "", hitsInfo: "", status: "✗ "};
    }

    return {gasInfo: "", hitsInfo: "", status: "  "};
}

function calculateTotalGas(gasCosts: readonly number[]): number {
    return gasCosts.reduce((sum, gas) => sum + gas, 0);
}

function instructionsStats(summary: CoverageSummary) {
    if (summary.instructionStats.length === 0) {
        return [];
    }

    const maxNameWidth = Math.max(...summary.instructionStats.map(stat => stat.name.length));
    const maxGasWidth = Math.max(...summary.instructionStats.map(stat => stat.totalGas.toString().length));
    const maxHitsWidth = Math.max(...summary.instructionStats.map(stat => stat.totalHits.toString().length));
    const maxAvgGasWidth = Math.max(...summary.instructionStats.map(stat => stat.avgGas.toString().length));

    return summary.instructionStats.map(stat =>
        formatInstructionStat(stat, summary.totalGas, maxNameWidth, maxGasWidth, maxHitsWidth, maxAvgGasWidth)
    );
}

function formatInstructionStat(
    stat: InstructionStat,
    totalGas: number,
    nameWidth: number,
    gasWidth: number,
    hitsWidth: number,
    avgGasWidth: number
) {
    const name = stat.name.padEnd(nameWidth);
    const totalGasStr = stat.totalGas.toString().padStart(gasWidth);
    const hitsStr = stat.totalHits.toString().padStart(hitsWidth);
    const avgGasStr = stat.avgGas.toString().padStart(avgGasWidth);
    const percent = ((stat.totalGas / totalGas) * 100).toFixed(2).padStart(6);

    return `  ${name} | ${totalGasStr} gas | ${hitsStr} hits | ${avgGasStr} avg gas | ${percent}%`;
}
