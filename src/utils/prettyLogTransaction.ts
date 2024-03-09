import {Transaction, fromNano} from "@ton/core";
import {Address, ExternalAddress} from "@ton/core"
import { Maybe } from "@ton/core/dist/utils/maybe";


export function prettyLogTransaction(tx: Transaction, mapping?: Map<Address | Maybe<ExternalAddress>, string>) {
    // Helper function to get the mapped address or default to the original
    const getMappedAddress = (address: Address | Maybe<ExternalAddress>): string => {
        return mapping?.get(address) ?? `${address}`;
    };

    let res = `${getMappedAddress(tx.inMessage?.info.src!)}  ➡️  ${getMappedAddress(tx.inMessage?.info.dest)}\n`;

    for (let message of tx.outMessages.values()) {
        const dest = getMappedAddress(message.info.dest);
        if (message.info.type === 'internal') {
            res += `     ➡️  ${fromNano(message.info.value.coins)} 💎 ${dest}\n`;
        } else {
            res += `      ➡️  ${dest}\n`;
        }
    }

    return res;
}

export function prettyLogTransactions(txs: Transaction[], mapping?: Map<Address | Maybe<ExternalAddress>, string>) {
    let out = ''

    for (let tx of txs) {
        out += prettyLogTransaction(tx, mapping) + '\n\n'
    }

    console.log(out)
}