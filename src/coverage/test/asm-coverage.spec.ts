import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

import { runtime, text } from 'ton-assembly';

import { generateTextReport, generateHtmlReport } from '../';
import { executeInstructions } from './execute';
import { collectAsmCoverage } from '../collect';

describe('asm coverage', () => {
    const test =
        (code: string, id: number = 0) =>
        async () => {
            const name = expect.getState().currentTestName;

            const res = text.parse('test.asm', code);
            if (res.$ === 'ParseFailure') {
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
        'simple if',
        test(
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
        'if ret',
        test(
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
        'simple if-else',
        test(
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
        'while loop with break',
        test(
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
        'dictionary',
        test(
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
        'dictionary 2',
        test(
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

    // In this test, methods 0 and 1 have the same code, so it will be cells that will be deduplicated.
    // Because of this, it is impossible to distinguish from the logs which method was called, so in the
    // next test both methods are considered covered.
    it(
        'dictionary with same code methods',
        test(
            `
                DICTPUSHCONST 19 [
                    0 => {
                        PUSHINT_4 10
                        INC
                    }
                    2 => {
                        PUSHINT_4 10
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
        'try without throw',
        test(
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
        'try with throw',
        test(
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
        'nested try with rethrow',
        test(
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
