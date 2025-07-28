import {runtime, text} from "ton-assembly-dev-test"
import {generateTextReport, generateHtmlReport} from "../"
import {mkdirSync, writeFileSync, existsSync} from "node:fs"
import {executeInstructions} from "./execute";
import {collectAsmCoverage} from "../collect";

describe("asm coverage", () => {
    const test =
        (name: string, code: string, id: number = 0) =>
            async () => {
                const res = text.parse("test.asm", code);
                if (res.$ === "ParseFailure") {
                    throw new Error(res.error.msg);
                }

                const cell = runtime.compileCell(res.instructions);
                const [_, logs] = await executeInstructions(res.instructions, id);
                const coverage = collectAsmCoverage(cell, logs);

                const report = generateTextReport(coverage);
                expect(report).toMatchSnapshot();

                const outDirname = `${__dirname}/output`;
                if (!existsSync(outDirname)) {
                    mkdirSync(outDirname);
                }

                const htmlReport = generateHtmlReport(coverage);
                writeFileSync(`${__dirname}/output/${name}.html`, htmlReport);
            };

    it(
        "simple if",
        test(
            "simple if",
            `
                PUSHINT_4 0
                PUSHINT_4 0
                PUSHCONT {
                    INC
                    INC
                    INC
                }
                IF
            `,
        ),
    );

    it(
        "if ret",
        test(
            "if ret",
            `
                DROP
                PUSHINT_4 -1 // cond
                
                IFRET
                
                PUSHINT_4 1
                PUSHINT_4 2
                ADD
            `,
        ),
    );

    it(
        "simple if-else",
        test(
            "simple if-else",
            `
                PUSHINT_4 0
                PUSHINT_4 -1
                PUSHCONT {
                    INC
                }
                PUSHCONT {
                    DEC
                }
                IFELSE
            `,
        ),
    );

    it(
        "while loop with break",
        test(
            "while loop with break",
            `
                PUSHINT_4 10 // a = 10
                
                PUSHCONT { DUP GTINT 0 } // a > 0
                PUSHCONT {
                    // if (a < 5) { break }
                    DUP
                    LESSINT 5
                    IFRETALT
                
                    // a -= 1;
                    DEC
                }
                WHILEBRK
            `,
        ),
    );

    it(
        "dictionary",
        test(
            "dictionary",
            `
                DICTPUSHCONST 19 [
                    0 => {
                        PUSHINT_4 10
                        INC
                    }
                    2 => {
                        PUSHINT_4 5
                        INC
                    }
                ]
                DICTIGETJMPZ
                THROWARG 11
            `,
        ),
    );

    it(
        "dictionary 2",
        test(
            "dictionary 2",
            `
                DICTPUSHCONST 19 [
                    0 => {
                        PUSHINT_4 10
                        INC
                    }
                    2 => {
                        PUSHINT_4 5
                        INC
                    }
                ]
                DICTIGETJMPZ
                THROWARG 11
            `,
            2,
        ),
    );

    it(
        "try without throw",
        test(
            "try without throw",
            `
                PUSHINT_4 10
                PUSHCONT {
                    INC
                }
                PUSHCONT {
                    DEC
                }
                TRY
            `,
        ),
    );

    it(
        "try with throw",
        test(
            "try with throw",
            `
                PUSHINT_4 10
                PUSHCONT {
                    THROW 10
                }
                PUSHCONT {
                    SUB
                }
                TRY
            `,
        ),
    );

    it(
        "nested try with rethrow",
        test(
            "nested try with rethrow",
            `
                PUSHCONT {
                    PUSHCONT {
                        THROW 10
                    }
                    PUSHCONT {
                        THROWANY
                    }
                    TRY
                }
                PUSHCONT {
                    PUSHINT_4 2
                }
                TRY
            `,
        ),
    );
});

