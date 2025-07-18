import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';

import chalk, { supportsColor } from 'chalk';
import { BaseReporter } from '@jest/reporters';
import type { Config } from '@jest/types';
import { ContractABI } from '@ton/core';

import { BenchmarkCommand } from './BenchmarkCommand';
import { sandboxMetricRawFile } from './BenchmarkEnvironment';
import { readJsonl } from '../utils/readJsonl';
import {
    Metric,
    makeSnapshotMetric,
    CodeHash,
    SnapshotMetric,
    sortByCreatedAt,
    ContractDatabase,
    gasReportTable,
    makeGasReport,
    defaultColor,
    ContractData,
} from '../metric';
import { readSnapshots } from '../metric/readSnapshots';

export const defaultSnapshotDir = '.snapshot';
export const defaultReportName = 'gas-report';
export const defaultContractDatabaseName = 'contract.abi.json';
export const defaultDepthCompare = 2;
export const minComparisonDepth = 1;

const PASS_TEXT = 'PASS';
const PASS = supportsColor ? chalk.reset.inverse.bold.green(` ${PASS_TEXT} `) : PASS_TEXT;

const SKIP_TEXT = 'SKIP';
const SKIP = supportsColor ? chalk.reset.inverse.bold.yellow(` ${SKIP_TEXT} `) : SKIP_TEXT;

type ReportMode = 'gas' | 'average';

export interface Options {
    reportMode?: ReportMode;
    reportName?: string;
    snapshotDir?: string;
    depthCompare?: number;
    contractExcludes?: string[];
    removeRawResult?: boolean;
    contractDatabase?: Record<CodeHash, ContractABI> | string;
}

export default class BenchmarkReporter extends BaseReporter {
    protected rootDirPath: string;
    protected options: Options;
    protected command: BenchmarkCommand;
    contractDatabase: ContractDatabase;

    constructor(globalConfig: Config.GlobalConfig, options: Options = {}) {
        super();
        this.rootDirPath = globalConfig.rootDir;
        this.options = options;
        this.command = new BenchmarkCommand();
        if (this.depthCompare < minComparisonDepth) {
            throw new Error(`The minimum depth compare must be greater than or equal to ${minComparisonDepth}`);
        }
        this.contractDatabase = this.readContractDatabase();
    }

    get reportMode() {
        return this.options.reportMode || 'gas';
    }

    get reportName() {
        return this.options.reportName || defaultReportName;
    }

    get snapshotDir() {
        return this.options.snapshotDir || defaultSnapshotDir;
    }

    get snapshotDirPath() {
        const dirPath = join(this.rootDirPath, this.snapshotDir);
        try {
            if (!existsSync(dirPath)) {
                mkdirSync(dirPath, { recursive: true });
            }
        } catch (_) {
            throw new Error(`Can not create directory: ${dirPath}`);
        }
        return dirPath;
    }

    get depthCompare() {
        return this.options.depthCompare || defaultDepthCompare;
    }

    get snapshotFiles() {
        return readSnapshots(this.snapshotDirPath);
    }

    get snapshots() {
        return this.snapshotFiles.then((list) => Object.values(list).map((item) => item.content));
    }

    get snapshotCurrent() {
        return this.metricStore.then((store) =>
            makeSnapshotMetric(store, {
                contractDatabase: this.contractDatabase,
                contractExcludes: this.contractExcludes,
            }),
        );
    }

    get removeRawResult() {
        return this.options.removeRawResult || true;
    }

    get contractExcludes() {
        return this.options.contractExcludes || [];
    }

    get sandboxMetricRawFile() {
        return join(this.rootDirPath, sandboxMetricRawFile);
    }

    get metricStore() {
        if (existsSync(this.sandboxMetricRawFile)) {
            return readJsonl<Metric>(this.sandboxMetricRawFile);
        }
        return new Promise<Metric[]>((resolve) => resolve([]));
    }

    readContractDatabase() {
        let data: ContractData = {};
        const filePath = this.options.contractDatabase || defaultContractDatabaseName;
        if (typeof filePath === 'string') {
            try {
                if (existsSync(join(this.rootDirPath, filePath))) {
                    data = JSON.parse(readFileSync(join(this.rootDirPath, filePath), 'utf-8'));
                }
            } catch (_) {
                throw new Error(`Could not parse contract database: ${filePath}`);
            }
        }
        return ContractDatabase.from(data);
    }

    saveContractDatabase(): void {
        const contractDatabase = this.options.contractDatabase;
        let filePath = typeof contractDatabase === 'string' ? contractDatabase : defaultContractDatabaseName;
        try {
            const content = JSON.stringify(this.contractDatabase.data, null, 2) + '\n';
            writeFileSync(join(this.rootDirPath, filePath), content, {
                encoding: 'utf8',
            });
        } catch (_) {
            throw new Error(`Can not write: ${filePath}`);
        }
    }

    async onRunComplete(): Promise<void> {
        const log = [];
        let status = SKIP;
        if (this.command.doBenchmark) {
            const list = await this.snapshots;
            const snapshots = [await this.snapshotCurrent, ...list];
            let doDiff = this.command.doDiff;
            const depthCompare = Math.min(snapshots.length, this.depthCompare);
            if (doDiff) {
                log.push(`Comparison metric mode: ${this.reportMode} depth: ${depthCompare}`);
                switch (this.reportMode) {
                    case 'gas':
                        log.push(...this.gasReportReport(snapshots, depthCompare));
                        status = PASS;
                        break;
                    default:
                        throw new Error(`Report mode ${this.reportMode} not supported`);
                }
            } else if (this.command.label) {
                log.push(`Collect metric mode: "${this.reportMode}"`);
                const file = await this.saveSnapshot(this.command.label);
                log.push(`Report write in '${file}'`);
                status = PASS;
            }
            if (this.removeRawResult) {
                unlinkSync(this.sandboxMetricRawFile);
            }
            this.saveContractDatabase();
        } else {
            log.push(`Reporter mode: ${this.reportMode}`);
        }
        this.log(`${status} ${log.join('\n')}`);
    }

    gasReportReport(data: SnapshotMetric[], benchmarkDepth: number) {
        const log = [];
        const reportFile = `${this.reportName}.json`;
        const report = makeGasReport(data);
        try {
            const reportFilePath = join(this.rootDirPath, reportFile);
            writeFileSync(reportFilePath, JSON.stringify(report, null, 2) + '\n', {
                encoding: 'utf8',
            });
            log.push(`Gas report write in '${reportFile}'`);
        } catch (_) {
            throw new Error(`Can not write: ${reportFile}`);
        }
        const list = report.sort(sortByCreatedAt(true)).slice(0, benchmarkDepth);
        log.push(gasReportTable(list, defaultColor));
        return log;
    }

    async saveSnapshot(label: string) {
        const snapshot = await this.snapshotCurrent;
        snapshot.label = label;
        const list = await this.snapshotFiles;
        let snapshotFile = `${snapshot.createdAt.getTime()}.json`;
        if (list[snapshot.label]) {
            snapshotFile = list[snapshot.label].name;
        }
        const snapshotFilePath = join(this.snapshotDirPath, snapshotFile);
        try {
            writeFileSync(snapshotFilePath, JSON.stringify(snapshot, null, 2) + '\n', {
                encoding: 'utf8',
            });
        } catch (_) {
            throw new Error(`Can not write: ${join(this.snapshotDir, snapshotFile)}`);
        }
        return join(this.snapshotDir, snapshotFile);
    }
}
