export interface BenchmarkCommandOption {
    label: string;
    doDiff: boolean;
}

export class BenchmarkCommand {
    readonly label?: string;
    readonly doDiff: boolean;

    constructor(option?: Partial<BenchmarkCommandOption>) {
        option = option || {};
        this.label = option?.label ?? process.env?.BENCH_NEW;
        this.doDiff = option?.doDiff ?? process.env?.BENCH_DIFF === 'true' ?? false;
    }

    get doBenchmark() {
        return this.doDiff || typeof this.label !== 'undefined';
    }
}
