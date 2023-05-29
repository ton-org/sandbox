import { Builder, Cell, Dictionary, DictionaryValue, Slice, beginCell } from 'ton-core';
import { defaultConfig, defaultConfigSeqno } from '../src/config/defaultConfig';
import { slimConfig, slimConfigSeqno } from '../src/config/slimConfig';
import fs from 'fs';

const CellRef: DictionaryValue<Cell> = {
    serialize: (src, builder) => {
        builder.storeRef(src)
    },
    parse: (src) => src.loadRef(),
}

type GlobalVersion = {
    version: number
    capabilities: bigint
};

function loadGlobalVersion(slice: Slice): GlobalVersion {
    if (slice.loadUint(8) !== 0xc4) {
        throw new Error(`Wrong magic for GlobalVersion`);
    }

    return {
        version: slice.loadUint(32),
        capabilities: slice.loadUintBig(64),
    };
}

function storeGlobalVersion(value: GlobalVersion): (b: Builder) => void {
    return (b: Builder) => {
        b.storeUint(0xc4, 8)
            .storeUint(value.version, 32)
            .storeUint(value.capabilities, 64);
    };
}

function writeConfig(name: string, config: Cell, seqno: number) {
    const out = `export const ${name}ConfigSeqno = ${seqno};\nexport const ${name}Config = \`${config.toBoc({ idx: false }).toString('base64')}\`;`;

    fs.writeFileSync(`./src/config/${name}Config.ts`, out);
}

function modifyConfig(source: string, name: string, seqno: number) {
    const oldConfigCell = Cell.fromBase64(source);

    const configDict = Dictionary.loadDirect(Dictionary.Keys.Int(32), CellRef, oldConfigCell);

    const oldGlobalVersionCell = configDict.get(8);

    if (oldGlobalVersionCell === undefined) {
        throw new Error('param 8 must be present');
    }

    const globalVersion = loadGlobalVersion(oldGlobalVersionCell.beginParse());

    globalVersion.version = Math.max(4, globalVersion.version);

    const newGlobalVersionCell = beginCell().store(storeGlobalVersion(globalVersion)).endCell();

    configDict.set(8, newGlobalVersionCell);

    const newConfigCell = beginCell().storeDictDirect(configDict).endCell();

    writeConfig(name, newConfigCell, seqno);
}

function main() {
    modifyConfig(defaultConfig, 'default', defaultConfigSeqno);

    modifyConfig(slimConfig, 'slim', slimConfigSeqno);
}

main();