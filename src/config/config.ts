import { TonClient4 } from "ton";
import {Cell} from "ton-core";

export const getConfigBoc = async (seqno?: number, client?: TonClient4): Promise<string> => {
    if (client === undefined) {
        client = new TonClient4({
            endpoint: 'https://mainnet-v4.tonhubapi.com'
        });
    }

    if (seqno === undefined) {
        seqno = (await client.getLastBlock()).last.seqno;
    }

    return (await client.getConfig(seqno)).config.cell;
};

class NetworkConfig {
    private configCell: Cell

    constructor(configCell: Cell) {
        this.configCell = configCell
    }

    getCell() {
        return this.configCell
    }
}