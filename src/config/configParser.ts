import { beginCell, Cell, Dictionary } from '@ton/core';

import { ConfigParam, loadConfigParam, storeConfigParam } from './block';

type KindToNumber<K extends string> = K extends `ConfigParam__${infer N}`
    ? N extends ''
        ? '0'
        : N extends `${infer Num extends number}`
          ? Num
          : never
    : never;

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
        const id = Number(param.kind.replace('ConfigParam__', '0'));
        configDict.set(id, beginCell().store(storeConfigParam(param)).endCell());
    }
    return beginCell().storeDictDirect(configDict).endCell();
}
