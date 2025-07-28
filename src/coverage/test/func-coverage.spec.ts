import {runtime} from "ton-assembly";
import {generateTextReport, generateHtmlReport} from "../";
import {mkdirSync, writeFileSync, existsSync} from "node:fs";
import {executeInstructions} from "./execute";
import {collectAsmCoverage} from "../collect";
import {compileFunc} from "@ton-community/func-js";
import {Cell} from "@ton/core";
import {decompileCell} from "ton-assembly/dist/runtime";

describe("func asm coverage", () => {
    const test =
        (code: string, id: number = 0) =>
            async () => {
                const name = expect.getState().currentTestName;

                const funcCompiled = await compile(code);
                const funcInstructions = decompileCell(funcCompiled);

                const cell = runtime.compileCell(funcInstructions);
                const [_, logs] = await executeInstructions(funcInstructions, id);
                const coverage = collectAsmCoverage(cell, logs);

                const report = generateTextReport(coverage);
                expect(report).toMatchSnapshot();

                const outDirname = `${__dirname}/output`;
                if (!existsSync(outDirname)) {
                    mkdirSync(outDirname);
                }

                const htmlReport = generateHtmlReport(coverage);
                writeFileSync(`${__dirname}/output/func-${name}.html`, htmlReport);
            };

    it(
        "simple if",
        test(
            `
                global int foo;
            
                () recv_internal() {
                    foo = 10;
                    if (foo > 10) {
                        foo = 20;
                        return ();
                    }
                    
                    foo = 15;
                    return ();
                }
            `,
        ),
    );
});

const compile = async (code: string): Promise<Cell> => {
    const res = await compileFunc({
        sources: [
            {
                content: code,
                filename: "source",
            },
        ],
    });
    if (res.status === "error") {
        throw new Error(`cannot compile FunC: ${res.message}`);
    }

    return Cell.fromBase64(res.codeBoc);
};
