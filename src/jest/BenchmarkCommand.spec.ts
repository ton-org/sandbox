import { BenchmarkCommand } from './BenchmarkCommand';

describe('BenchmarkCommand', () => {
    it.each([
        // label, diff, expected
        [undefined, undefined, [undefined, false, false]],
        [undefined, 'false', [undefined, false, false]],
        ['some', 'false', ['some', false, true]],
        [undefined, 'true', [undefined, true, true]],
        ['some', 'true', ['some', true, true]],
    ])('command variant label:%s & diff:%s ', (label, diff, expected) => {
        if (label) {
            process.env['BENCH_NEW'] = label;
        }
        if (diff) {
            process.env['BENCH_DIFF'] = diff;
        }
        const actual = new BenchmarkCommand();
        expect([actual.label, actual.doDiff, actual.doBenchmark]).toEqual(expected);
    });

    afterEach(() => {
        delete process.env['BENCH_NEW'];
        delete process.env['BENCH_DIFF'];
    });
});
