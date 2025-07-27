import {Cell} from "@ton/core";
import {Coverage, Line} from "./data";

export function coverageToJson(coverage: Coverage): string {
    const lines = coverage.lines;
    return JSON.stringify({
        code: coverage.code.toBoc().toString("hex"),
        lines: lines.map((line, index) => {
            if (line.info.$ === "Covered") {
                return {
                    lineNumber: index,
                    line: line.line,
                    info: {
                        ...line.info,
                    },
                };
            }
            return {
                lineNumber: index,
                ...line,
            };
        }),
    });
}

export function coverageFromJson(string: string): Coverage {
    type CoverageJson = {
        readonly code: string;
        readonly lines: readonly Line[];
    };

    const data = JSON.parse(string) as CoverageJson;
    return {
        code: Cell.fromHex(data.code),
        lines: data.lines
    };
}
