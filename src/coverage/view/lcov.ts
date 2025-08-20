import { CoverageData, isExecutableLine } from '../data';

export function generateLcovReport(filePath: string, coverage: CoverageData): string {
    let lcov = `SF:${filePath}\n`;

    let linesHit = 0;
    let linesFound = 0;

    coverage.lines.forEach((line, idx) => {
        if (!isExecutableLine(line.line)) {
            return;
        }

        const lineNumber = idx + 1;

        if (line.info.$ === 'Covered') {
            linesFound++;
            linesHit++;
            lcov += `DA:${lineNumber},${line.info.hits}\n`;
        } else if (line.info.$ === 'Uncovered') {
            linesFound++;
            lcov += `DA:${lineNumber},0\n`;
        }
    });

    lcov += `LH:${linesHit}\n`;
    lcov += `LF:${linesFound}\n`;
    lcov += `end_of_record\n`;

    return lcov;
}
