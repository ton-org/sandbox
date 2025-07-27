import {CoverageData, CoverageSummary, generateCoverageSummary, mergeCoverages} from "./data";
import {coverageFromJson, coverageToJson} from "./json";
import {generateHtmlReport} from "./view/html";
import {generateTextReport} from "./view/text";

export class Coverage {
    public constructor(public readonly data: CoverageData) {
    }

    public static fromJson(data: string): Coverage {
        return new Coverage(coverageFromJson(data))
    }

    public toJson(): string {
        return coverageToJson(this.data)
    }

    public report(format: "text" | "html"): string {
        if (format === "html") {
            return generateHtmlReport(this.data)
        }
        if (format === "text") {
            return generateTextReport(this.data)
        }

        throw new Error(`unexpected format: ${format}`)
    }

    public summary(): CoverageSummary {
        return generateCoverageSummary(this.data)
    }

    public mergeWith(...other: Coverage[]): Coverage {
        return new Coverage(mergeCoverages(this.data, ...other.map(it => it.data)));
    }
}
