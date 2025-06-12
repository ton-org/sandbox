import { beginCell, Cell, Dictionary } from '@ton/core';

import { ConfigParam, loadConfigParam, storeConfigParam } from './config.tlb-gen';

const configNormalization = {
    ConfigParam__: 'ConfigParam__0',
    ConfigParam_config_mc_gas_prices: 'ConfigParam__20',
    ConfigParam_config_gas_prices: 'ConfigParam__21',
    ConfigParam_config_mc_block_limits: 'ConfigParam__22',
    ConfigParam_config_block_limits: 'ConfigParam__23',
    ConfigParam_config_mc_fwd_prices: 'ConfigParam__24',
    ConfigParam_config_fwd_prices: 'ConfigParam__25',
} as const;

type NormalizeKind<K extends string> = K extends keyof typeof configNormalization ? (typeof configNormalization)[K] : K;
type KindToNumber<K extends string> = NormalizeKind<K> extends `ConfigParam__${infer N extends number}` ? N : never;

type BlockchainConfig = {
    [K in ConfigParam as KindToNumber<K['kind']>]: K;
};

function loadConfigDict(configCellOrBase64: string | Cell) {
    return (typeof configCellOrBase64 === 'string' ? Cell.fromBase64(configCellOrBase64) : configCellOrBase64)
        .beginParse()
        .loadDictDirect(Dictionary.Keys.Int(32), Dictionary.Values.Cell());
}

export function loadConfig(configCellOrBase64: string | Cell): BlockchainConfig {
    const configDict = loadConfigDict(configCellOrBase64);

    const parsedConfig: Partial<BlockchainConfig> = {};
    for (const [id, configParam] of configDict) {
        try {
            // @ts-expect-error Should load OK as in tlb
            parsedConfig[id] = loadConfigParam(configParam.beginParse(), id);
        } catch (err: unknown) {
            if (
                !(err instanceof Error) ||
                !err.message.startsWith('Expected one of "ConfigParam__", "ConfigParam__1", "ConfigParam__2"')
            ) {
                throw err;
            }
            // ignore unknow params otherwise. Params -999, -1000 and -1001 not described in tlb
        }
    }

    return parsedConfig as BlockchainConfig;
}

export function updateConfig(config: Cell, ...params: ConfigParam[]): Cell {
    const configDict = loadConfigDict(config);
    for (const param of params) {
        const normalizedKind = (<Record<string, string>>configNormalization)[param.kind] ?? param.kind;
        const id = Number(normalizedKind.slice('ConfigParam__'.length));
        configDict.set(id, beginCell().store(storeConfigParam(param)).endCell());
    }
    return beginCell().storeDictDirect(configDict).endCell();
}
