import { IExecutor } from "../executor/Executor";
import { BlockchainBase, BlockchainConfig } from "./BlockchainBase";
import { BlockchainStorage, LocalBlockchainStorage } from "./BlockchainStorage";

export class LeanBlockchain extends BlockchainBase {
    /**
     * Creates instance of sandbox blockchain.
     * ```ts
     * const blockchain = await Blockchain.create({ config: 'slim' });
     * ```
     *
     * Remote storage example:
     * ```ts
     * let client = new TonClient4({
     *     endpoint: 'https://mainnet-v4.tonhubapi.com'
     * })
     *
     * let blockchain = await Blockchain.create({
     *     storage: new RemoteBlockchainStorage(wrapTonClient4ForRemote(client), 34892000)
     * });
     * ```
     *
     * @param [opts.executor] Custom contract executor. If omitted {@link Executor} used.
     * @param [opts.config] Config used in blockchain. If omitted {@link defaultConfig} used.
     * @param [opts.storage] Contracts storage used for blockchain. If omitted {@link LocalBlockchainStorage} used.
     */
    static async create(opts: { executor: IExecutor, config?: BlockchainConfig, storage?: BlockchainStorage }) {
        return new LeanBlockchain({
            storage: opts.storage ?? new LocalBlockchainStorage(),
            ...opts
        })
    }
}
