import {CoverageData, CoverageSummary, generateCoverageSummary, mergeCoverages} from "./data";
import {coverageFromJson, coverageToJson} from "./json";
import {generateHtmlReport} from "./view/html";
import {generateTextReport} from "./view/text";

/**
 * Coverage data container with methods for analysis and reporting.
 *
 * @example
 * const coverage = blockchain.coverage(contract);
 * console.log(coverage.summary());
 * await fs.writeFile("report.html", coverage.report("html"));
 */
export class Coverage {
    /**
     * Creates a coverage object with the specified data.
     *
     * @param data Coverage data containing code cell and line information
     *
     * Likely you don't need to create this object manually.
     * Use {@link Blockchain.coverage} instead.
     */
    public constructor(public readonly data: CoverageData) {
    }

    /**
     * Creates a coverage object from a JSON string.
     *
     * @param data JSON string containing serialized coverage data
     * @returns Coverage object
     *
     * @example
     * const savedCoverageJson = await fs.readFile("coverage.json", "utf-8");
     * const coverage = Coverage.fromJson(savedCoverageJson);
     */
    public static fromJson(data: string): Coverage {
        return new Coverage(coverageFromJson(data));
    }

    /**
     * Exports coverage to JSON format.
     *
     * @returns JSON string representation of coverage data
     *
     * @example
     * const coverageJson = coverage.toJson();
     * await fs.writeFile("coverage.json", coverageJson);
     */
    public toJson(): string {
        return coverageToJson(this.data);
    }

    /**
     * Generates a coverage report in the specified format.
     *
     * @param format Report format - "text" for console output or "html" for web viewing
     * @returns String containing the formatted report
     * @throws Error if unsupported format is provided
     *
     * @example
     * // Generate HTML report
     * const htmlReport = coverage.report("html");
     * await fs.writeFile("coverage.html", htmlReport);
     *
     * // Generate text report
     * const textReport = coverage.report("text");
     * console.log(textReport);
     */
    public report(format: "text" | "html"): string {
        if (format === "html") {
            return generateHtmlReport(this.data);
        }
        if (format === "text") {
            return generateTextReport(this.data);
        }

        throw new Error(`unexpected format: ${format}`);
    }

    /**
     * Returns summary information about coverage including percentages and statistics.
     *
     * @returns Coverage summary with line counts, percentages, gas consumption and instruction statistics
     *
     * @example
     * const summary = coverage.summary();
     * console.log(`Coverage: ${summary.coveragePercentage.toFixed(2)}%`);
     * console.log(`Covered lines: ${summary.coveredLines}/${summary.totalLines}`);
     */
    public summary(): CoverageSummary {
        return generateCoverageSummary(this.data);
    }

    /**
     * Merges current coverage with other coverage objects.
     * Useful for combining coverage data from multiple test runs.
     *
     * @param other Array of coverage objects to merge with current coverage
     * @returns New Coverage object containing merged data from all inputs
     *
     * @example
     * // Merge coverage from multiple test runs
     * const coverage1 = blockchain.coverage(contract);
     * // ... reset and run more tests
     * const coverage2 = blockchain.coverage(contract);
     * const totalCoverage = coverage1.mergeWith(coverage2);
     * console.log(`Total coverage: ${totalCoverage.summary().coveragePercentage}%`);
     */
    public mergeWith(...other: Coverage[]): Coverage {
        return new Coverage(mergeCoverages(this.data, ...other.map(it => it.data)));
    }
}
