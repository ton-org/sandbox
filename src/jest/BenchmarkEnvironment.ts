import { join, dirname } from 'path';
import { existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { Circus, Global, Config } from '@jest/types';
import type { EnvironmentContext } from '@jest/environment';
import { BenchmarkCommand } from './BenchmarkCommand';
import { createMetricStore, getMetricStore } from '../metric';

export const sandboxMetricRawFile = '.sandbox-metric-raw.jsonl';

type ConstructorConfig = {
    projectConfig: Config.ProjectConfig;
    globalConfig: Config.GlobalConfig;
};

export default class BenchmarkEnvironment {
    env: any;
    global: Global.Global | null;
    moduleMocker: any;
    protected rootDir: string;
    protected command: BenchmarkCommand;

    constructor(config: ConstructorConfig, context?: EnvironmentContext) {
        this.command = new BenchmarkCommand();
        const clsImport = require('jest-environment-node');
        const cls = clsImport.default ?? clsImport;
        const env = new cls(config, context);
        this.global = env.global || global;
        this.rootDir = config.globalConfig.rootDir;
        if (env.getVmContext) {
            function getVmContext() {
                return env.getVmContext();
            }
            Object.defineProperty(this, 'getVmContext', {
                value: getVmContext.bind(this),
                writable: false,
            });
        }
        if (env.handleTestEvent) {
            function handleTestEvent(event: Circus.Event, state: Circus.State) {
                return env.handleTestEvent(event, state);
            }
            Object.defineProperty(this, 'handleTestEvent', {
                value: handleTestEvent.bind(this),
                writable: false,
            });
        }
        this.env = env;
        this.moduleMocker = env.moduleMocker || null;
    }

    async setup() {
        if (this.command.doBenchmark) {
            createMetricStore(this.global);
        }
        await this.env.setup();
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
        }
        await this.env.teardown();
        this.global = null;
    }

    runScript(script: any) {
        console.log(`env runScript ${script}`);
        return this.env.runScript(script);
    }
}
