import { join, dirname } from 'path';
import { existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import type { EnvironmentContext } from '@jest/environment';
import NodeEnvironment from 'jest-environment-node';
import { Config } from '@jest/types';
import { BenchmarkCommand, BenchmarkCommandOption } from './BenchmarkCommand';
import { createMetricStore, getMetricStore, resetMetricStore } from '../metric';

export const sandboxMetricRawFile = '.sandbox-metric-raw.jsonl';

export type BenchmarkEnvironmentConfig = {
    projectConfig: Config.ProjectConfig & { testEnvironmentCommand?: Partial<BenchmarkCommandOption> };
    globalConfig: Config.GlobalConfig;
};

export default class BenchmarkEnvironment extends NodeEnvironment {
    protected command: BenchmarkCommand;
    protected rootDir: string;

    constructor(config: BenchmarkEnvironmentConfig, context: EnvironmentContext) {
        super(config, context);
        this.command = new BenchmarkCommand(config.projectConfig.testEnvironmentCommand);
        this.rootDir = config.globalConfig.rootDir;
    }

    async setup() {
        if (this.command.doBenchmark) {
            createMetricStore(this.global);
        }
    }

    get resultFile() {
        return join(this.rootDir, sandboxMetricRawFile);
    }

    async teardown() {
        if (this.command.doBenchmark) {
            const store = getMetricStore(this.global) || [];
            const fileName = this.resultFile;
            const folder = dirname(fileName);
            if (!existsSync(folder)) {
                mkdirSync(folder, { recursive: true });
            }
            if (!existsSync(fileName)) {
                writeFileSync(fileName, '');
            }
            for (const item of store) {
                appendFileSync(fileName, JSON.stringify(item) + '\n');
            }
            resetMetricStore(this.global);
        }
        await super.teardown();
    }
}
