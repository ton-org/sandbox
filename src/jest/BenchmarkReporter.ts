import { dirname, join } from 'path';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import chalk from 'chalk';
import { BaseReporter } from '@jest/reporters';
import type { Config } from '@jest/types';
import { sandboxMetricRawFile } from './BenchmarkEnvironment';
import { Metric, makeSnapshotMetric } from '../utils/collectMetric';
import { readJsonl } from '../utils/readJsonl';
import { BenchmarkCommand } from './BenchmarkCommand';

export const defaultReportName = '.benchmark';

const PASS_TEXT = 'PASS';
const PASS = chalk.supportsColor ? chalk.reset.inverse.bold.green(` ${PASS_TEXT} `) : PASS_TEXT;

const SKIP_TEXT = 'SKIP';
const SKIP = chalk.supportsColor ? chalk.reset.inverse.bold.yellow(` ${SKIP_TEXT} `) : SKIP_TEXT;

type ReportMode = 'onlyMetric' | 'averageMetric';

export interface Options {
    reportMode?: ReportMode;
    reportName?: string;
    contractExcludes?: string[];
    removeRawResult?: boolean;
}

export default class BenchmarkReporter extends BaseReporter {
    protected rootDir: string;
    protected options: Options;
    protected command: BenchmarkCommand;

    constructor(globalConfig: Config.GlobalConfig, options: Options = {}) {
        super();
        this.rootDir = globalConfig.rootDir;
        this.options = options;
        this.command = new BenchmarkCommand();
    }

    get reportMode() {
        return this.options.reportMode || 'onlyMetric';
    }

    get reportName() {
        return this.options.reportName || defaultReportName;
    }

    get removeRawResult() {
        return this.options.removeRawResult || true;
    }

    get contractExcludes() {
        return this.options.contractExcludes || [];
    }

    get sandboxMetricRawFile() {
        return join(this.rootDir, sandboxMetricRawFile);
    }

    get metricStore() {
        return readJsonl<Metric>(this.sandboxMetricRawFile).then((list) =>
            list.filter((it) => it.contractName == null || !this.contractExcludes.includes(it.contractName)),
        );
    }

    async onRunComplete(): Promise<void> {
        const log = [];
        let status = SKIP;
        if (this.command.doBenchmark) {
            if (this.command.doDiff) {
                log.push('Bench metric not implement yet');
            } else if (this.command.comment) {
                log.push(`Report "${this.reportMode}"`);
                switch (this.reportMode) {
                    case 'onlyMetric':
                        log.push(await this.createOnlyMetricReport(this.command.comment));
                        break;
                    default:
                        throw new Error(`Report mode "${this.reportMode}" not implemented`);
                }
                status = PASS;
            }
            if (this.removeRawResult) {
                unlinkSync(this.sandboxMetricRawFile);
            }
        }
        this.log(`${status} ${chalk.bold('benchmark')}`);
        this.log(log.join('\n'));
    }

    async createOnlyMetricReport(comment: string) {
        const file = await this.prepareOnlyMetricReport(comment);
        return `created in '${file}'`;
    }

    async prepareOnlyMetricReport(comment: string) {
        const snapshot = makeSnapshotMetric(comment, await this.metricStore);
        const file = join(this.rootDir, this.reportName, `${snapshot.createdAt.getTime()}.json`);
        const folder = dirname(file);
        if (!existsSync(folder)) {
            mkdirSync(folder, { recursive: true });
        }
        writeFileSync(file, JSON.stringify(snapshot, null, 2));
        return file;
    }
}
