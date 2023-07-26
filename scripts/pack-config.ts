import { beginCell, Cell, Dictionary, DictionaryValue, TonClient4 } from '@ton/ton';
import fs from 'fs';

const CellRef: DictionaryValue<Cell> = {
    serialize: (src, builder) => {
        builder.storeRef(src)
    },
    parse: (src) => src.loadRef(),
}

function makeSlim(config: Cell): Cell {
    const configDict = Dictionary.loadDirect(Dictionary.Keys.Int(32), CellRef, config)

    const configDictSlim = Dictionary.empty(Dictionary.Keys.Int(32), CellRef)

    for (let k = 0; k < 32; k++) {
        const prev = configDict.get(k)
        if (prev !== undefined) {
            configDictSlim.set(k, prev)
        }
    }

    return beginCell().storeDictDirect(configDictSlim).endCell()
}

function writeConfig(name: string, config: Cell, seqno: number) {
    const out = `export const ${name}ConfigSeqno = ${seqno};\nexport const ${name}Config = \`${config.toBoc({ idx: false }).toString('base64')}\`;`;

    fs.writeFileSync(`./src/config/${name}Config.ts`, out);
}

const main = async () => {
    const client = new TonClient4({
        endpoint: 'https://mainnet-v4.tonhubapi.com'
    });

    const lastBlock = await client.getLastBlock();

    const lastBlockConfig = await client.getConfig(lastBlock.last.seqno);

    const configCell = Cell.fromBase64(lastBlockConfig.config.cell);

    writeConfig('default', configCell, lastBlock.last.seqno);

    writeConfig('slim', makeSlim(configCell), lastBlock.last.seqno);
};

main();