export class BenchmarkCommand {
    readonly label?: string;
    readonly doDiff: boolean;

    constructor() {
        this.label = process.env?.BENCH_NEW;
        this.doDiff = process.env?.BENCH_DIFF === 'true' || false;
    }

    get doBenchmark() {
        return this.doDiff || typeof this.label !== 'undefined';
    }
}
