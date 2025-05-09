import { dirname, join } from 'path';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import chalk from 'chalk';
import { BaseReporter } from '@jest/reporters';
import type { Config } from '@jest/types';
import { sandboxMetricRawFile } from './BenchmarkEnvironment';
import { Metric, makeSnapshotMetric, CodeHash } from '../utils/collectMetric';
import { readJsonl } from '../utils/readJsonl';
import { BenchmarkCommand } from './BenchmarkCommand';
import { ContractDatabase } from '../utils/ContractDatabase';
import { ContractABI } from '@ton/core';
import { readSnapshots } from '../utils/readSnapshots';

export const defaultOutDir = '.benchmark';
export const defaultReportName = 'benchmark-final';
export const minComparisonDepth = 2;

const PASS_TEXT = 'PASS';
const PASS = chalk.supportsColor ? chalk.reset.inverse.bold.green(` ${PASS_TEXT} `) : PASS_TEXT;

const SKIP_TEXT = 'SKIP';
const SKIP = chalk.supportsColor ? chalk.reset.inverse.bold.yellow(` ${SKIP_TEXT} `) : SKIP_TEXT;

type ReportMode = 'onlyMetric' | 'averageMetric';

export interface Options {
    reportMode?: ReportMode;
    reportName?: string;
    outDir?: string;
    benchmarkDepth?: number;
    contractExcludes?: string[];
    removeRawResult?: boolean;
    contractDatabase?: Record<CodeHash, ContractABI> | string;
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
        if (this.benchmarkDepth < minComparisonDepth) {
            throw new Error(`The minimum comparison depth must be greater than or equal to ${minComparisonDepth}`);
        }
    }

    get reportMode() {
        return this.options.reportMode || 'onlyMetric';
    }

    get reportName() {
        return this.options.reportName || defaultReportName;
    }

    get outDir() {
        return this.options.outDir || defaultOutDir;
    }

    get outDirPath() {
        return join(this.rootDir, this.outDir);
    }

    get benchmarkDepth() {
        return this.options.benchmarkDepth || 2;
    }

    get snapshots() {
        return readSnapshots(this.outDir);
    }

    get snapshotCurrent() {
        return this.metricStore.then((store) =>
            makeSnapshotMetric('current', store, {
                contractDatabase: this.contractDatabase,
                contractExcludes: this.contractExcludes,
            }),
        );
    }

    get removeRawResult() {
        return this.options.removeRawResult || true;
    }

    get contractDatabase() {
        let value = this.options.contractDatabase || {};
        if (typeof value === 'string') {
            try {
                value = JSON.parse(readFileSync(value, 'utf-8')) as Record<CodeHash, ContractABI>;
            } catch (error) {
                throw new Error(`Could not parse contract database: ${value}`);
            }
        }
        return ContractDatabase.from(value);
    }

    get contractExcludes() {
        return this.options.contractExcludes || [];
    }

    get sandboxMetricRawFile() {
        return join(this.rootDir, sandboxMetricRawFile);
    }

    get metricStore() {
        return readJsonl<Metric>(this.sandboxMetricRawFile);
    }

    async onRunComplete(): Promise<void> {
        const log = [];
        let status = SKIP;
        if (this.command.doBenchmark) {
            if (this.command.doDiff) {
                log.push(`Comparison metric mode: "${this.reportMode}"`);
                const list = Object.values(await this.snapshots).map((it) => it.content);
                const snapshots = [await this.snapshotCurrent, ...list];
                switch (this.reportMode) {
                    case 'onlyMetric':
                        log.push(
                            `${chalk.bold('Report:')} previous ${snapshots.length} on depth ${this.benchmarkDepth}`,
                        );
                        log.push(`Report mode "${this.reportMode}" not implemented yet`);
                        status = PASS;
                        break;
                    default:
                        throw new Error(`Report mode "${this.reportMode}" not implemented`);
                }
            } else if (this.command.label) {
                log.push(`Collect metric mode: "${this.reportMode}"`);
                switch (this.reportMode) {
                    case 'onlyMetric':
                        const file = await this.prepareOnlyMetricSnapshot(this.command.label);
                        log.push(`Report write in '${file}'`);
                        break;
                    default:
                        throw new Error(`Snapshot mode "${this.reportMode}" not implemented`);
                }
                status = PASS;
            }
            if (this.removeRawResult) {
                unlinkSync(this.sandboxMetricRawFile);
            }
        }
        this.log(`${status} ${log.join('\n')}`);
    }

    async prepareOnlyMetricSnapshot(label: string) {
        const snapshot = await this.snapshotCurrent;
        snapshot.label = label;
        const list = await this.snapshots;
        let snapshotFile = `${snapshot.createdAt.getTime()}.json`;
        if (list[snapshot.label]) {
            snapshotFile = list[snapshot.label].name;
        }
        const snapshotFilePath = join(this.outDirPath, snapshotFile);
        if (!existsSync(this.outDirPath)) {
            mkdirSync(this.outDirPath, { recursive: true });
        }
        writeFileSync(snapshotFilePath, JSON.stringify(snapshot, null, 2) + '\n');
        return join(this.outDir, snapshotFile);
    }
}
