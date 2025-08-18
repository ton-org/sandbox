import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { EnvironmentContext } from '@jest/environment';
import { readConfig } from 'jest-config';
import { Config } from '@jest/types';

import BenchmarkEnvironment, { BenchmarkEnvironmentConfig } from './BenchmarkEnvironment';
import { BenchmarkCommandOption } from './BenchmarkCommand';
import * as metric from '../metric';
const testPath = mkdtempSync(join(tmpdir(), 'jest-'));

const context: EnvironmentContext = {
    console,
    docblockPragmas: {},
    testPath,
};

async function makeConfig(command: Partial<BenchmarkCommandOption> = {}): Promise<BenchmarkEnvironmentConfig> {
    let config = await readConfig(
        {} as Config.Argv,
        {} /* packageRootOrConfig */,
        false /* skipArgvConfigOption */,
        testPath /* parentConfigPath */,
    );
    return {
        projectConfig: {
            ...config.projectConfig,
            testEnvironmentCommand: command,
        },
        globalConfig: {
            ...config.globalConfig,
            reporters: [['./BenchmarkReporter', {}]],
        },
    };
}

describe('BenchmarkEnvironment', () => {
    it('uses a copy of the process object', async () => {
        const config = await makeConfig();
        const env1 = new BenchmarkEnvironment(config, context);
        const env2 = new BenchmarkEnvironment(config, context);
        expect(env1.global.process).not.toBe(env2.global.process);
    });

    it('exposes process.on', async () => {
        const config = await makeConfig();
        const env1 = new BenchmarkEnvironment(config, context);
        expect(env1.global.process.on).not.toBeNull();
    });

    it('exposes global', async () => {
        const config = await makeConfig({
            label: 'foo',
        });
        const env1 = new BenchmarkEnvironment(config, context);
        expect(env1.global.global).toBe(env1.global);
        await env1.setup();
        const store = metric.getMetricStore(env1.global);
        expect(store).toBeDefined();
        expect(Array.isArray(store)).toBe(true);
        expect(store!.length).toEqual(0);
        store!.push({
            address: 'EQBGhqLAZseEqRXz4ByFPTGV7SVMlI4hrbs-Sps_Xzx01x8G',
            opCode: '0x0',
            execute: {
                compute: {
                    type: 'vm',
                },
            },
            message: {
                in: { cells: 0, bits: 0 },
                out: { cells: 0, bits: 0 },
            },
            state: {
                code: { cells: 0, bits: 0 },
                data: { cells: 0, bits: 0 },
            },
        });
        expect(store!.length).toEqual(1);
        await env1.teardown();
        expect(store!.length).toEqual(0);
    });
});
