import { beginCell, Cell, Dictionary } from '@ton/core';

export async function fetchConfig(network: 'mainnet' | 'testnet', maxRetries: number = 5) {
    let apiDomain: string;
    let retryLeft = maxRetries;

    if(network == 'testnet') {
        apiDomain = 'testnet.toncenter.com';
    } else if(network == 'mainnet') {
        apiDomain = 'toncenter.com';
    } else {
        throw new RangeError(`Unknown network: ${network}`);
    }

    const sleep = (timeout: number) => new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });

    const headers = new Headers();
    headers.append("Accept", "application/json");

    do {
        try {
            const resp = await fetch(`https://${apiDomain}/api/v2/getConfigAll`, {
                method: 'GET',
                headers
            });

            const jsonResp = await resp.json();
            if(jsonResp.ok) {
                return Cell.fromBase64(jsonResp.result.config.bytes);
            } else {
                throw new Error(JSON.stringify(jsonResp));
            }
        } catch(e: any) {
            retryLeft--;
            console.error(`Error fetching config:${e.toString()}`);
            await sleep(1000);
        }
    } while(retryLeft > 0);

    throw new Error(`Failed to fetch config after ${maxRetries} attempts`);
}

export function setGlobalVersion(config: Cell, version: number, capabilites?: bigint) {
        const parsedConfig = Dictionary.loadDirect(
            Dictionary.Keys.Int(32),
            Dictionary.Values.Cell(),
            config
        );

        let changed = false;

        const param8 = parsedConfig.get(8);
        if(!param8) {
            throw new Error("[setTvmVersion] parameter 8 is not found!");
        }

        const ds = param8.beginParse();
        const tag = ds.loadUint(8);
        const curVersion = ds.loadUint(32);

        const newValue = beginCell().storeUint(tag, 8);

        if (curVersion != version) {
            changed = true;
        }
        newValue.storeUint(version, 32);

        if(capabilites) {
            const curCapabilities = ds.loadUintBig(64);
            if(capabilites != curCapabilities) {
                changed = true;
            }
            newValue.storeUint(capabilites, 64);
        } else {
            newValue.storeSlice(ds);
        }

        // If any changes, serialize
        if(changed) {
            parsedConfig.set(8, newValue.endCell());
            return beginCell().storeDictDirect(parsedConfig).endCell();
        }

        return config;
}
