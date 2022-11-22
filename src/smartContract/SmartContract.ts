import BN from "bn.js";
import { Address, Cell, ExternalMessage, InternalMessage, parseTransaction, RawTransaction, Slice } from "ton";
import { defaultConfig } from "../config/defaultConfig";
import { emulateTransaction, EmulationParams } from "../emulator-exec/emulatorExec";
import { AccountState, AccountStorage, encodeShardAccount } from "../utils/encode";
import { parseShardAccount, RawShardAccount } from "../utils/parse";
import { calcStorageUsed } from "../utils/storage";
import { SmartContractError, SmartContractExternalNotAcceptedError } from "./errors";

export type SendMessageResult = {
    transaction: RawTransaction;
    shardAccount: RawShardAccount;
    transactionCell: Cell;
    shardAccountCell: Cell;
    logs: string;
    vmLogs: string;
};

export type Verbosity = 'short' | 'full' | 'full_location' | 'full_location_stack';

const verbosityToNum: Record<Verbosity, number> = {
    'short': 0,
    'full': 1,
    'full_location': 2,
    'full_location_stack': 3,
};

export class SmartContract {
    private configBoc: string = defaultConfig;
    private libsBoc?: string;
    private verbosity: Verbosity = 'full';
    private shardAccount: Cell;
    private rawShardAccount: RawShardAccount;

    constructor(shardAccount: Cell) {
        this.rawShardAccount = parseShardAccount(shardAccount); // can throw an exception if `account` is `none`
        this.shardAccount = shardAccount;
    }

    static fromState(state: {
        address: Address
        accountState: AccountState
        balance: BN
    }): SmartContract {
        const storage: AccountStorage = {
            lastTransLT: new BN(0),
            currencyCollection: {
                coins: state.balance,
            },
            accountState: state.accountState,
        };

        return new SmartContract(encodeShardAccount({
            account: {
                address: state.address,
                storageStat: {
                    used: calcStorageUsed(storage),
                    lastPaid: 0,
                },
                storage,
            },
            lastTransHash: Buffer.alloc(32),
            lastTransLT: new BN(0),
        }));
    }

    async sendMessage(message: ExternalMessage | InternalMessage, opts?: {
        mutateAccount?: boolean
        params?: EmulationParams
    }): Promise<SendMessageResult> {
        const msgCell = new Cell();
        message.writeTo(msgCell);
        const res = await emulateTransaction(this.configBoc, this.shardAccount, msgCell, {
            libs: this.libsBoc,
            verbosity: verbosityToNum[this.verbosity],
            params: opts?.params,
        });

        if (!res.result.success) {
            if (res.result.vmResults !== undefined) {
                throw new SmartContractExternalNotAcceptedError(res.result.error, res.logs, res.result.vmResults);
            }

            throw new SmartContractError(res.result.error, res.logs);
        }

        const shardAccountCell = Cell.fromBoc(Buffer.from(res.result.shardAccount, 'base64'))[0];
        const shardAccount = parseShardAccount(shardAccountCell);

        if (opts?.mutateAccount ?? true) {
            this.shardAccount = shardAccountCell;
            this.rawShardAccount = shardAccount;
        }

        const txCell = Cell.fromBoc(Buffer.from(res.result.transaction, 'base64'))[0];

        const tx = parseTransaction(
            this.getShardAccount().account.address.workChain,
            Slice.fromCell(txCell)
        );

        return {
            shardAccount,
            shardAccountCell,
            transaction: tx,
            transactionCell: txCell,
            logs: res.logs,
            vmLogs: res.result.vmLog,
        };
    }

    getShardAccount() {
        return this.rawShardAccount;
    }

    setConfig(config: Cell) {
        this.configBoc = config.toBoc().toString('base64');
    }

    setLibs(libs?: Cell) {
        this.libsBoc = libs === undefined ? undefined : libs.toBoc().toString('base64');
    }

    setVerbosity(verbosity: Verbosity) {
        this.verbosity = verbosity;
    }
}