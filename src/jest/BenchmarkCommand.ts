export class BenchmarkCommand {
    readonly comment?: string;
    readonly doDiff: boolean;

    constructor() {
        this.comment = process.env['BENCH_NEW'];
        this.doDiff = !!process.env['BENCH_DIFF'];
    }

    get doBenchmark() {
        return this.doDiff || typeof this.comment !== 'undefined';
    }
}
