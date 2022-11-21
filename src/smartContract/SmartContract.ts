import BN from "bn.js";
import { Address, Cell, ExternalMessage, InternalMessage, parseTransaction, RawTransaction, Slice } from "ton";
import { defaultConfig } from "../config/defaultConfig";
import { emulateTransaction, EmulationParams, VMResults } from "../emulator-exec/emulatorExec";
import { bocOrCellToStr } from "../utils/boc";
import { AccountState, AccountStorage, encodeShardAccount } from "../utils/encode";
import { parseShardAccount, RawShardAccount } from "../utils/parse";
import { calcStorageUsed } from "../utils/storage";

export type SendMessageSuccess = {
    type: 'success';
    transaction: RawTransaction;
    shardAccount: RawShardAccount;
    transactionCell: Cell;
    shardAccountCell: Cell;
    logs: string;
};

export type SendMessageExternalNotAccepted = {
    type: 'external_not_accepted'
    error: string;
    vmResults: VMResults;
    logs: string;
};

export type SendMessageError = {
    type: 'error';
    error: string;
    logs: string;
};

export type SendMessageResult = SendMessageSuccess | SendMessageError | SendMessageExternalNotAccepted;

export class SmartContract {
    private configBoc: string = defaultConfig;
    private libsBoc?: string;
    private verbosity: number = 1;
    private shardAccount: Cell;
    private rawShardAccount: RawShardAccount;

    constructor(shardAccount: Cell) {
        this.rawShardAccount = parseShardAccount(shardAccount); // check for exceptions
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
            verbosity: this.verbosity,
            params: opts?.params,
        });

        if (!res.result.success) {
            if (res.result.vmResults !== undefined) return {
                type: 'external_not_accepted',
                error: res.result.error,
                vmResults: res.result.vmResults,
                logs: res.logs,
            };

            return {
                type: 'error',
                error: res.result.error,
                logs: res.logs,
            };
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
            type: 'success',
            shardAccount,
            shardAccountCell,
            transaction: tx,
            transactionCell: txCell,
            logs: res.logs,
        };
    }

    getShardAccount() {
        return this.rawShardAccount;
    }

    setConfig(config: Cell | string) {
        this.configBoc = bocOrCellToStr(config);
    }

    setLibs(libs?: Cell | string) {
        this.libsBoc = libs === undefined ? undefined : bocOrCellToStr(libs);
    }

    setVerbosity(verbosity: number) {
        this.verbosity = verbosity;
    }
}