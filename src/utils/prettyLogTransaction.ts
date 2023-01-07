import {Transaction} from "ton-core";
import {fromNano} from "ton";

export function prettyLogTransaction(tx: Transaction) {
    let res = `${tx.inMessage?.info.src!}  ➡️  ${tx.inMessage?.info.dest}\n`

    for (let message of tx.outMessages.values()) {
        if (message.info.type === 'internal') {
            res += `     ➡️  ${fromNano(message.info.value.coins)} 💎 ${message.info.dest}\n`
        } else {
            res += `      ➡️  ${message.info.dest}\n`
        }
    }

    return res
}

export function prettyLogTransactions(txs: Transaction[]) {
    let out = ''

    for (let tx of txs) {
        out += prettyLogTransaction(tx) + '\n\n'
    }

    console.log(out)
}