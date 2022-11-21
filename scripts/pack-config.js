const { TonClient4 } = require('ton');
const fs = require('fs');

const main = async () => {
    const client = new TonClient4({
        endpoint: 'https://mainnet-v4.tonhubapi.com'
    });

    const lastBlock = await client.getLastBlock();

    const lastBlockConfig = await client.getConfig(lastBlock.last.seqno);

    const out = `export const defaultConfigSeqno = ${lastBlock.last.seqno};\nexport const defaultConfig = \`${lastBlockConfig.config.cell}\`;`;

    fs.writeFileSync('./src/config/defaultConfig.ts', out);
};

main();