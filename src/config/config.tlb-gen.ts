/* eslint-disable */
import { Builder } from '@ton/core'
import { Slice } from '@ton/core'
import { beginCell } from '@ton/core'
import { BitString } from '@ton/core'
import { Cell } from '@ton/core'
import { Address } from '@ton/core'
import { ExternalAddress } from '@ton/core'
import { Dictionary } from '@ton/core'
import { DictionaryValue } from '@ton/core'
import { TupleItem } from '@ton/core'
import { parseTuple } from '@ton/core'
import { serializeTuple } from '@ton/core'
export function bitLen(n: number) {
    return n.toString(2).length;
}

export interface Bool {
    readonly kind: 'Bool';
    readonly value: boolean;
}

export function loadBool(slice: Slice): Bool {
    if (slice.remainingBits >= 1) {
        let value = slice.loadUint(1);
        return {
            kind: 'Bool',
            value: value == 1
        }

    }
    throw new Error('Expected one of "BoolFalse" in loading "BoolFalse", but data does not satisfy any constructor');
}

export function storeBool(bool: Bool): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(bool.value ? 1: 0, 1);
    })

}



export function loadBoolFalse(slice: Slice): Bool {
  if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b0))) {
      slice.loadUint(1);
      return {
          kind: 'Bool',
          value: false
      }

  }
  throw new Error('Expected one of "BoolFalse" in loading "BoolFalse", but data does not satisfy any constructor');
}

export function loadBoolTrue(slice: Slice): Bool {
  if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b1))) {
      slice.loadUint(1);
      return {
          kind: 'Bool',
          value: true
      }

  }
  throw new Error('Expected one of "BoolTrue" in loading "BoolTrue", but data does not satisfy any constructor');
}

export function copyCellToBuilder(from: Cell, to: Builder): void {
    let slice = from.beginParse();
    to.storeBits(slice.loadBits(slice.remainingBits));
    while (slice.remainingRefs) {
        to.storeRef(slice.loadRef());
    }
}
// unit$_ = Unit;

export interface Unit {
    readonly kind: 'Unit';
}

// true$_ = True;

export interface True {
    readonly kind: 'True';
}

// nothing$0 {X:Type} = Maybe X;

// just$1 {X:Type} value:X = Maybe X;

export type Maybe<X> = Maybe_nothing<X> | Maybe_just<X>;

export interface Maybe_nothing<X> {
    readonly kind: 'Maybe_nothing';
}

export interface Maybe_just<X> {
    readonly kind: 'Maybe_just';
    readonly value: X;
}

/*
hm_edge#_ {n:#} {X:Type} {l:#} {m:#} label:(HmLabel ~l n)
          {n = (~m) + l} node:(HashmapNode m X) = Hashmap n X;
*/

export interface Hashmap<X> {
    readonly kind: 'Hashmap';
    readonly n: number;
    readonly l: number;
    readonly m: number;
    readonly label: HmLabel;
    readonly node: HashmapNode<X>;
}

// hmn_leaf#_ {X:Type} value:X = HashmapNode 0 X;

/*
hmn_fork#_ {n:#} {X:Type} left:^(Hashmap n X)
           right:^(Hashmap n X) = HashmapNode (n + 1) X;
*/

export type HashmapNode<X> = HashmapNode_hmn_leaf<X> | HashmapNode_hmn_fork<X>;

export interface HashmapNode_hmn_leaf<X> {
    readonly kind: 'HashmapNode_hmn_leaf';
    readonly value: X;
}

export interface HashmapNode_hmn_fork<X> {
    readonly kind: 'HashmapNode_hmn_fork';
    readonly n: number;
    readonly left: Hashmap<X>;
    readonly right: Hashmap<X>;
}

// hml_short$0 {m:#} {n:#} len:(Unary ~n) {n <= m} s:(n * Bit) = HmLabel ~n m;

// hml_long$10 {m:#} n:(#<= m) s:(n * Bit) = HmLabel ~n m;

// hml_same$11 {m:#} v:Bit n:(#<= m) = HmLabel ~n m;

export type HmLabel = HmLabel_hml_short | HmLabel_hml_long | HmLabel_hml_same;

export interface HmLabel_hml_short {
    readonly kind: 'HmLabel_hml_short';
    readonly m: number;
    readonly n: number;
    readonly len: Unary;
    readonly s: Array<boolean>;
}

export interface HmLabel_hml_long {
    readonly kind: 'HmLabel_hml_long';
    readonly m: number;
    readonly n: number;
    readonly s: Array<boolean>;
}

export interface HmLabel_hml_same {
    readonly kind: 'HmLabel_hml_same';
    readonly m: number;
    readonly v: boolean;
    readonly n: number;
}

// unary_zero$0 = Unary ~0;

// unary_succ$1 {n:#} x:(Unary ~n) = Unary ~(n + 1);

export type Unary = Unary_unary_zero | Unary_unary_succ;

export interface Unary_unary_zero {
    readonly kind: 'Unary_unary_zero';
}

export interface Unary_unary_succ {
    readonly kind: 'Unary_unary_succ';
    readonly n: number;
    readonly x: Unary;
}

// _ grams:Grams = Coins;

export interface Coins {
    readonly kind: 'Coins';
    readonly grams: bigint;
}

/*
extra_currencies$_ dict:(HashmapE 32 (VarUInteger 32))
                 = ExtraCurrencyCollection;
*/

export interface ExtraCurrencyCollection {
    readonly kind: 'ExtraCurrencyCollection';
    readonly dict: Dictionary<number, bigint>;
}

// ed25519_pubkey#8e81278a pubkey:bits256 = SigPubKey;

export interface SigPubKey {
    readonly kind: 'SigPubKey';
    readonly pubkey: Buffer;
}

// ed25519_signature#5 R:bits256 s:bits256 = CryptoSignatureSimple;

export interface CryptoSignatureSimple {
    readonly kind: 'CryptoSignatureSimple';
    readonly R: Buffer;
    readonly s: Buffer;
}

/*
chained_signature#f signed_cert:^SignedCertificate temp_key_signature:CryptoSignatureSimple
  = CryptoSignature;
*/

// _ CryptoSignatureSimple = CryptoSignature;

export type CryptoSignature = CryptoSignature_chained_signature | CryptoSignature__;

export interface CryptoSignature_chained_signature {
    readonly kind: 'CryptoSignature_chained_signature';
    readonly signed_cert: SignedCertificate;
    readonly temp_key_signature: CryptoSignatureSimple;
}

export interface CryptoSignature__ {
    readonly kind: 'CryptoSignature__';
    readonly anon0: CryptoSignatureSimple;
}

// certificate#4 temp_key:SigPubKey valid_since:uint32 valid_until:uint32 = Certificate;

export interface Certificate {
    readonly kind: 'Certificate';
    readonly temp_key: SigPubKey;
    readonly valid_since: number;
    readonly valid_until: number;
}

/*
signed_certificate$_ certificate:Certificate certificate_signature:CryptoSignature
  = SignedCertificate;
*/

export interface SignedCertificate {
    readonly kind: 'SignedCertificate';
    readonly certificate: Certificate;
    readonly certificate_signature: CryptoSignature;
}

// validator#53 public_key:SigPubKey weight:uint64 = ValidatorDescr;

// validator_addr#73 public_key:SigPubKey weight:uint64 adnl_addr:bits256 = ValidatorDescr;

export type ValidatorDescr = ValidatorDescr_validator | ValidatorDescr_validator_addr;

export interface ValidatorDescr_validator {
    readonly kind: 'ValidatorDescr_validator';
    readonly public_key: SigPubKey;
    readonly weight: bigint;
}

export interface ValidatorDescr_validator_addr {
    readonly kind: 'ValidatorDescr_validator_addr';
    readonly public_key: SigPubKey;
    readonly weight: bigint;
    readonly adnl_addr: Buffer;
}

/*
validators#11 utime_since:uint32 utime_until:uint32
  total:(## 16) main:(## 16) { main <= total } { main >= 1 }
  list:(Hashmap 16 ValidatorDescr) = ValidatorSet;
*/

/*
validators_ext#12 utime_since:uint32 utime_until:uint32
  total:(## 16) main:(## 16) { main <= total } { main >= 1 }
  total_weight:uint64 list:(HashmapE 16 ValidatorDescr) = ValidatorSet;
*/

export type ValidatorSet = ValidatorSet_validators | ValidatorSet_validators_ext;

export interface ValidatorSet_validators {
    readonly kind: 'ValidatorSet_validators';
    readonly utime_since: number;
    readonly utime_until: number;
    readonly total: number;
    readonly main: number;
    readonly list: Dictionary<number, ValidatorDescr>;
}

export interface ValidatorSet_validators_ext {
    readonly kind: 'ValidatorSet_validators_ext';
    readonly utime_since: number;
    readonly utime_until: number;
    readonly total: number;
    readonly main: number;
    readonly total_weight: bigint;
    readonly list: Dictionary<number, ValidatorDescr>;
}

// _ config_addr:bits256 = ConfigParam 0;

// _ elector_addr:bits256 = ConfigParam 1;

// _ minter_addr:bits256 = ConfigParam 2;

// _ fee_collector_addr:bits256 = ConfigParam 3;

// _ dns_root_addr:bits256 = ConfigParam 4;

// _ BurningConfig = ConfigParam 5;

// _ mint_new_price:Grams mint_add_price:Grams = ConfigParam 6;

// _ to_mint:ExtraCurrencyCollection = ConfigParam 7;

// _ GlobalVersion = ConfigParam 8;

// _ mandatory_params:(Hashmap 32 True) = ConfigParam 9;

// _ critical_params:(Hashmap 32 True) = ConfigParam 10;

// _ ConfigVotingSetup = ConfigParam 11;

// _ workchains:(HashmapE 32 WorkchainDescr) = ConfigParam 12;

// _ ComplaintPricing = ConfigParam 13;

// _ BlockCreateFees = ConfigParam 14;

/*
_ validators_elected_for:uint32 elections_start_before:uint32
  elections_end_before:uint32 stake_held_for:uint32
  = ConfigParam 15;
*/

/*
_ max_validators:(## 16) max_main_validators:(## 16) min_validators:(## 16)
  { max_validators >= max_main_validators }
  { max_main_validators >= min_validators }
  { min_validators >= 1 }
  = ConfigParam 16;
*/

// _ min_stake:Grams max_stake:Grams min_total_stake:Grams max_stake_factor:uint32 = ConfigParam 17;

// _ (Hashmap 32 StoragePrices) = ConfigParam 18;

// _ global_id:int32 = ConfigParam 19;

// config_mc_gas_prices#_ GasLimitsPrices = ConfigParam 20;

// config_gas_prices#_ GasLimitsPrices = ConfigParam 21;

// config_mc_block_limits#_ BlockLimits = ConfigParam 22;

// config_block_limits#_ BlockLimits = ConfigParam 23;

// config_mc_fwd_prices#_ MsgForwardPrices = ConfigParam 24;

// config_fwd_prices#_ MsgForwardPrices = ConfigParam 25;

// _ CatchainConfig = ConfigParam 28;

// _ ConsensusConfig = ConfigParam 29;

// _ fundamental_smc_addr:(HashmapE 256 True) = ConfigParam 31;

// _ prev_validators:ValidatorSet = ConfigParam 32;

// _ prev_temp_validators:ValidatorSet = ConfigParam 33;

// _ cur_validators:ValidatorSet = ConfigParam 34;

// _ cur_temp_validators:ValidatorSet = ConfigParam 35;

// _ next_validators:ValidatorSet = ConfigParam 36;

// _ next_temp_validators:ValidatorSet = ConfigParam 37;

// _ (HashmapE 256 ValidatorSignedTempKey) = ConfigParam 39;

// _ MisbehaviourPunishmentConfig = ConfigParam 40;

// _ SizeLimitsConfig = ConfigParam 43;

// _ SuspendedAddressList = ConfigParam 44;

// _ PrecompiledContractsConfig = ConfigParam 45;

// _ OracleBridgeParams = ConfigParam 71;

// _ OracleBridgeParams = ConfigParam 72;

// _ OracleBridgeParams = ConfigParam 73;

// _ JettonBridgeParams = ConfigParam 79;

// _ JettonBridgeParams = ConfigParam 81;

// _ JettonBridgeParams = ConfigParam 82;

export type ConfigParam = ConfigParam__ | ConfigParam__1 | ConfigParam__2 | ConfigParam__3 | ConfigParam__4 | ConfigParam__5 | ConfigParam__6 | ConfigParam__7 | ConfigParam__8 | ConfigParam__9 | ConfigParam__10 | ConfigParam__11 | ConfigParam__12 | ConfigParam__13 | ConfigParam__14 | ConfigParam__15 | ConfigParam__16 | ConfigParam__17 | ConfigParam__18 | ConfigParam__19 | ConfigParam_config_mc_gas_prices | ConfigParam_config_gas_prices | ConfigParam_config_mc_block_limits | ConfigParam_config_block_limits | ConfigParam_config_mc_fwd_prices | ConfigParam_config_fwd_prices | ConfigParam__26 | ConfigParam__27 | ConfigParam__28 | ConfigParam__29 | ConfigParam__30 | ConfigParam__31 | ConfigParam__32 | ConfigParam__33 | ConfigParam__34 | ConfigParam__35 | ConfigParam__36 | ConfigParam__37 | ConfigParam__38 | ConfigParam__39 | ConfigParam__40 | ConfigParam__41 | ConfigParam__42 | ConfigParam__43 | ConfigParam__44 | ConfigParam__45;

export interface ConfigParam__ {
    readonly kind: 'ConfigParam__';
    readonly config_addr: Buffer;
}

export interface ConfigParam__1 {
    readonly kind: 'ConfigParam__1';
    readonly elector_addr: Buffer;
}

export interface ConfigParam__2 {
    readonly kind: 'ConfigParam__2';
    readonly minter_addr: Buffer;
}

export interface ConfigParam__3 {
    readonly kind: 'ConfigParam__3';
    readonly fee_collector_addr: Buffer;
}

export interface ConfigParam__4 {
    readonly kind: 'ConfigParam__4';
    readonly dns_root_addr: Buffer;
}

export interface ConfigParam__5 {
    readonly kind: 'ConfigParam__5';
    readonly anon0: BurningConfig;
}

export interface ConfigParam__6 {
    readonly kind: 'ConfigParam__6';
    readonly mint_new_price: bigint;
    readonly mint_add_price: bigint;
}

export interface ConfigParam__7 {
    readonly kind: 'ConfigParam__7';
    readonly to_mint: ExtraCurrencyCollection;
}

export interface ConfigParam__8 {
    readonly kind: 'ConfigParam__8';
    readonly anon0: GlobalVersion;
}

export interface ConfigParam__9 {
    readonly kind: 'ConfigParam__9';
    readonly mandatory_params: Dictionary<number, True>;
}

export interface ConfigParam__10 {
    readonly kind: 'ConfigParam__10';
    readonly critical_params: Dictionary<number, True>;
}

export interface ConfigParam__11 {
    readonly kind: 'ConfigParam__11';
    readonly anon0: ConfigVotingSetup;
}

export interface ConfigParam__12 {
    readonly kind: 'ConfigParam__12';
    readonly workchains: Dictionary<number, WorkchainDescr>;
}

export interface ConfigParam__13 {
    readonly kind: 'ConfigParam__13';
    readonly anon0: ComplaintPricing;
}

export interface ConfigParam__14 {
    readonly kind: 'ConfigParam__14';
    readonly anon0: BlockCreateFees;
}

export interface ConfigParam__15 {
    readonly kind: 'ConfigParam__15';
    readonly validators_elected_for: number;
    readonly elections_start_before: number;
    readonly elections_end_before: number;
    readonly stake_held_for: number;
}

export interface ConfigParam__16 {
    readonly kind: 'ConfigParam__16';
    readonly max_validators: number;
    readonly max_main_validators: number;
    readonly min_validators: number;
}

export interface ConfigParam__17 {
    readonly kind: 'ConfigParam__17';
    readonly min_stake: bigint;
    readonly max_stake: bigint;
    readonly min_total_stake: bigint;
    readonly max_stake_factor: number;
}

export interface ConfigParam__18 {
    readonly kind: 'ConfigParam__18';
    readonly anon0: Dictionary<number, StoragePrices>;
}

export interface ConfigParam__19 {
    readonly kind: 'ConfigParam__19';
    readonly global_id: number;
}

export interface ConfigParam_config_mc_gas_prices {
    readonly kind: 'ConfigParam_config_mc_gas_prices';
    readonly anon0: GasLimitsPrices;
}

export interface ConfigParam_config_gas_prices {
    readonly kind: 'ConfigParam_config_gas_prices';
    readonly anon0: GasLimitsPrices;
}

export interface ConfigParam_config_mc_block_limits {
    readonly kind: 'ConfigParam_config_mc_block_limits';
    readonly anon0: BlockLimits;
}

export interface ConfigParam_config_block_limits {
    readonly kind: 'ConfigParam_config_block_limits';
    readonly anon0: BlockLimits;
}

export interface ConfigParam_config_mc_fwd_prices {
    readonly kind: 'ConfigParam_config_mc_fwd_prices';
    readonly anon0: MsgForwardPrices;
}

export interface ConfigParam_config_fwd_prices {
    readonly kind: 'ConfigParam_config_fwd_prices';
    readonly anon0: MsgForwardPrices;
}

export interface ConfigParam__26 {
    readonly kind: 'ConfigParam__26';
    readonly anon0: CatchainConfig;
}

export interface ConfigParam__27 {
    readonly kind: 'ConfigParam__27';
    readonly anon0: ConsensusConfig;
}

export interface ConfigParam__28 {
    readonly kind: 'ConfigParam__28';
    readonly fundamental_smc_addr: Dictionary<bigint, True>;
}

export interface ConfigParam__29 {
    readonly kind: 'ConfigParam__29';
    readonly prev_validators: ValidatorSet;
}

export interface ConfigParam__30 {
    readonly kind: 'ConfigParam__30';
    readonly prev_temp_validators: ValidatorSet;
}

export interface ConfigParam__31 {
    readonly kind: 'ConfigParam__31';
    readonly cur_validators: ValidatorSet;
}

export interface ConfigParam__32 {
    readonly kind: 'ConfigParam__32';
    readonly cur_temp_validators: ValidatorSet;
}

export interface ConfigParam__33 {
    readonly kind: 'ConfigParam__33';
    readonly next_validators: ValidatorSet;
}

export interface ConfigParam__34 {
    readonly kind: 'ConfigParam__34';
    readonly next_temp_validators: ValidatorSet;
}

export interface ConfigParam__35 {
    readonly kind: 'ConfigParam__35';
    readonly anon0: Dictionary<bigint, ValidatorSignedTempKey>;
}

export interface ConfigParam__36 {
    readonly kind: 'ConfigParam__36';
    readonly anon0: MisbehaviourPunishmentConfig;
}

export interface ConfigParam__37 {
    readonly kind: 'ConfigParam__37';
    readonly anon0: SizeLimitsConfig;
}

export interface ConfigParam__38 {
    readonly kind: 'ConfigParam__38';
    readonly anon0: SuspendedAddressList;
}

export interface ConfigParam__39 {
    readonly kind: 'ConfigParam__39';
    readonly anon0: PrecompiledContractsConfig;
}

export interface ConfigParam__40 {
    readonly kind: 'ConfigParam__40';
    readonly anon0: OracleBridgeParams;
}

export interface ConfigParam__41 {
    readonly kind: 'ConfigParam__41';
    readonly anon0: OracleBridgeParams;
}

export interface ConfigParam__42 {
    readonly kind: 'ConfigParam__42';
    readonly anon0: OracleBridgeParams;
}

export interface ConfigParam__43 {
    readonly kind: 'ConfigParam__43';
    readonly anon0: JettonBridgeParams;
}

export interface ConfigParam__44 {
    readonly kind: 'ConfigParam__44';
    readonly anon0: JettonBridgeParams;
}

export interface ConfigParam__45 {
    readonly kind: 'ConfigParam__45';
    readonly anon0: JettonBridgeParams;
}

/*
burning_config#01
  blackhole_addr:(Maybe bits256)
  fee_burn_num:# fee_burn_denom:# { fee_burn_num <= fee_burn_denom } { fee_burn_denom >= 1 } = BurningConfig;
*/

export interface BurningConfig {
    readonly kind: 'BurningConfig';
    readonly blackhole_addr: Maybe<Buffer>;
    readonly fee_burn_num: number;
    readonly fee_burn_denom: number;
}

// capabilities#c4 version:uint32 capabilities:uint64 = GlobalVersion;

export interface GlobalVersion {
    readonly kind: 'GlobalVersion';
    readonly version: number;
    readonly capabilities: bigint;
}

// cfg_vote_cfg#36 min_tot_rounds:uint8 max_tot_rounds:uint8 min_wins:uint8 max_losses:uint8 min_store_sec:uint32 max_store_sec:uint32 bit_price:uint32 cell_price:uint32 = ConfigProposalSetup;

export interface ConfigProposalSetup {
    readonly kind: 'ConfigProposalSetup';
    readonly min_tot_rounds: number;
    readonly max_tot_rounds: number;
    readonly min_wins: number;
    readonly max_losses: number;
    readonly min_store_sec: number;
    readonly max_store_sec: number;
    readonly bit_price: number;
    readonly _cell_price: number;
}

// cfg_vote_setup#91 normal_params:^ConfigProposalSetup critical_params:^ConfigProposalSetup = ConfigVotingSetup;

export interface ConfigVotingSetup {
    readonly kind: 'ConfigVotingSetup';
    readonly normal_params: ConfigProposalSetup;
    readonly critical_params: ConfigProposalSetup;
}

/*
cfg_proposal#f3 param_id:int32 param_value:(Maybe ^Cell) if_hash_equal:(Maybe uint256)
  = ConfigProposal;
*/

export interface ConfigProposal {
    readonly kind: 'ConfigProposal';
    readonly param_id: number;
    readonly param_value: Maybe<Cell>;
    readonly if_hash_equal: Maybe<bigint>;
}

/*
cfg_proposal_status#ce expires:uint32 proposal:^ConfigProposal is_critical:Bool
  voters:(HashmapE 16 True) remaining_weight:int64 validator_set_id:uint256
  rounds_remaining:uint8 wins:uint8 losses:uint8 = ConfigProposalStatus;
*/

export interface ConfigProposalStatus {
    readonly kind: 'ConfigProposalStatus';
    readonly expires: number;
    readonly proposal: ConfigProposal;
    readonly is_critical: Bool;
    readonly voters: Dictionary<number, True>;
    readonly remaining_weight: bigint;
    readonly validator_set_id: bigint;
    readonly rounds_remaining: number;
    readonly wins: number;
    readonly losses: number;
}

// wfmt_basic#1 vm_version:int32 vm_mode:uint64 = WorkchainFormat 1;

/*
wfmt_ext#0 min_addr_len:(## 12) max_addr_len:(## 12) addr_len_step:(## 12)
  { min_addr_len >= 64 } { min_addr_len <= max_addr_len }
  { max_addr_len <= 1023 } { addr_len_step <= 1023 }
  workchain_type_id:(## 32) { workchain_type_id >= 1 }
  = WorkchainFormat 0;
*/

export type WorkchainFormat = WorkchainFormat_wfmt_basic | WorkchainFormat_wfmt_ext;

export interface WorkchainFormat_wfmt_basic {
    readonly kind: 'WorkchainFormat_wfmt_basic';
    readonly vm_version: number;
    readonly vm_mode: bigint;
}

export interface WorkchainFormat_wfmt_ext {
    readonly kind: 'WorkchainFormat_wfmt_ext';
    readonly min_addr_len: number;
    readonly max_addr_len: number;
    readonly addr_len_step: number;
    readonly workchain_type_id: number;
}

/*
wc_split_merge_timings#0
  split_merge_delay:uint32 split_merge_interval:uint32
  min_split_merge_interval:uint32 max_split_merge_delay:uint32
  = WcSplitMergeTimings;
*/

export interface WcSplitMergeTimings {
    readonly kind: 'WcSplitMergeTimings';
    readonly split_merge_delay: number;
    readonly split_merge_interval: number;
    readonly min_split_merge_interval: number;
    readonly max_split_merge_delay: number;
}

/*
workchain#a6 enabled_since:uint32 monitor_min_split:(## 8)
  min_split:(## 8) max_split:(## 8) { monitor_min_split <= min_split }
  basic:(## 1) active:Bool accept_msgs:Bool flags:(## 13) { flags = 0 }
  zerostate_root_hash:bits256 zerostate_file_hash:bits256
  version:uint32 format:(WorkchainFormat basic)
  = WorkchainDescr;
*/

/*
workchain_v2#a7 enabled_since:uint32 monitor_min_split:(## 8)
  min_split:(## 8) max_split:(## 8) { monitor_min_split <= min_split }
  basic:(## 1) active:Bool accept_msgs:Bool flags:(## 13) { flags = 0 }
  zerostate_root_hash:bits256 zerostate_file_hash:bits256
  version:uint32 format:(WorkchainFormat basic)
  split_merge_timings:WcSplitMergeTimings
  = WorkchainDescr;
*/

export type WorkchainDescr = WorkchainDescr_workchain | WorkchainDescr_workchain_v2;

export interface WorkchainDescr_workchain {
    readonly kind: 'WorkchainDescr_workchain';
    readonly enabled_since: number;
    readonly monitor_min_split: number;
    readonly min_split: number;
    readonly max_split: number;
    readonly basic: number;
    readonly active: Bool;
    readonly accept_msgs: Bool;
    readonly flags: number;
    readonly zerostate_root_hash: Buffer;
    readonly zerostate_file_hash: Buffer;
    readonly version: number;
    readonly format: WorkchainFormat;
}

export interface WorkchainDescr_workchain_v2 {
    readonly kind: 'WorkchainDescr_workchain_v2';
    readonly enabled_since: number;
    readonly monitor_min_split: number;
    readonly min_split: number;
    readonly max_split: number;
    readonly basic: number;
    readonly active: Bool;
    readonly accept_msgs: Bool;
    readonly flags: number;
    readonly zerostate_root_hash: Buffer;
    readonly zerostate_file_hash: Buffer;
    readonly version: number;
    readonly format: WorkchainFormat;
    readonly split_merge_timings: WcSplitMergeTimings;
}

// complaint_prices#1a deposit:Grams bit_price:Grams cell_price:Grams = ComplaintPricing;

export interface ComplaintPricing {
    readonly kind: 'ComplaintPricing';
    readonly deposit: bigint;
    readonly bit_price: bigint;
    readonly _cell_price: bigint;
}

/*
block_grams_created#6b masterchain_block_fee:Grams basechain_block_fee:Grams
  = BlockCreateFees;
*/

export interface BlockCreateFees {
    readonly kind: 'BlockCreateFees';
    readonly masterchain_block_fee: bigint;
    readonly basechain_block_fee: bigint;
}

/*
_#cc utime_since:uint32 bit_price_ps:uint64 cell_price_ps:uint64
  mc_bit_price_ps:uint64 mc_cell_price_ps:uint64 = StoragePrices;
*/

export interface StoragePrices {
    readonly kind: 'StoragePrices';
    readonly utime_since: number;
    readonly bit_price_ps: bigint;
    readonly _cell_price_ps: bigint;
    readonly mc_bit_price_ps: bigint;
    readonly mc_cell_price_ps: bigint;
}

/*
gas_prices#dd gas_price:uint64 gas_limit:uint64 gas_credit:uint64
  block_gas_limit:uint64 freeze_due_limit:uint64 delete_due_limit:uint64
  = GasLimitsPrices;
*/

/*
gas_prices_ext#de gas_price:uint64 gas_limit:uint64 special_gas_limit:uint64 gas_credit:uint64
  block_gas_limit:uint64 freeze_due_limit:uint64 delete_due_limit:uint64
  = GasLimitsPrices;
*/

/*
gas_flat_pfx#d1 flat_gas_limit:uint64 flat_gas_price:uint64 other:GasLimitsPrices
  = GasLimitsPrices;
*/

export type GasLimitsPrices = GasLimitsPrices_gas_prices | GasLimitsPrices_gas_prices_ext | GasLimitsPrices_gas_flat_pfx;

export interface GasLimitsPrices_gas_prices {
    readonly kind: 'GasLimitsPrices_gas_prices';
    readonly gas_price: bigint;
    readonly gas_limit: bigint;
    readonly gas_credit: bigint;
    readonly block_gas_limit: bigint;
    readonly freeze_due_limit: bigint;
    readonly delete_due_limit: bigint;
}

export interface GasLimitsPrices_gas_prices_ext {
    readonly kind: 'GasLimitsPrices_gas_prices_ext';
    readonly gas_price: bigint;
    readonly gas_limit: bigint;
    readonly special_gas_limit: bigint;
    readonly gas_credit: bigint;
    readonly block_gas_limit: bigint;
    readonly freeze_due_limit: bigint;
    readonly delete_due_limit: bigint;
}

export interface GasLimitsPrices_gas_flat_pfx {
    readonly kind: 'GasLimitsPrices_gas_flat_pfx';
    readonly flat_gas_limit: bigint;
    readonly flat_gas_price: bigint;
    readonly other: GasLimitsPrices;
}

/*
param_limits#c3 underload:# soft_limit:# { underload <= soft_limit }
  hard_limit:# { soft_limit <= hard_limit } = ParamLimits;
*/

export interface ParamLimits {
    readonly kind: 'ParamLimits';
    readonly underload: number;
    readonly soft_limit: number;
    readonly hard_limit: number;
}

/*
block_limits#5d bytes:ParamLimits gas:ParamLimits lt_delta:ParamLimits
  = BlockLimits;
*/

export interface BlockLimits {
    readonly kind: 'BlockLimits';
    readonly bytes: ParamLimits;
    readonly gas: ParamLimits;
    readonly lt_delta: ParamLimits;
}

/*
msg_forward_prices#ea lump_price:uint64 bit_price:uint64 cell_price:uint64
  ihr_price_factor:uint32 first_frac:uint16 next_frac:uint16 = MsgForwardPrices;
*/

export interface MsgForwardPrices {
    readonly kind: 'MsgForwardPrices';
    readonly lump_price: bigint;
    readonly bit_price: bigint;
    readonly _cell_price: bigint;
    readonly ihr_price_factor: number;
    readonly first_frac: number;
    readonly next_frac: number;
}

/*
catchain_config#c1 mc_catchain_lifetime:uint32 shard_catchain_lifetime:uint32
  shard_validators_lifetime:uint32 shard_validators_num:uint32 = CatchainConfig;
*/

/*
catchain_config_new#c2 flags:(## 7) { flags = 0 } shuffle_mc_validators:Bool
  mc_catchain_lifetime:uint32 shard_catchain_lifetime:uint32
  shard_validators_lifetime:uint32 shard_validators_num:uint32 = CatchainConfig;
*/

export type CatchainConfig = CatchainConfig_catchain_config | CatchainConfig_catchain_config_new;

export interface CatchainConfig_catchain_config {
    readonly kind: 'CatchainConfig_catchain_config';
    readonly mc_catchain_lifetime: number;
    readonly shard_catchain_lifetime: number;
    readonly shard_validators_lifetime: number;
    readonly shard_validators_num: number;
}

export interface CatchainConfig_catchain_config_new {
    readonly kind: 'CatchainConfig_catchain_config_new';
    readonly flags: number;
    readonly shuffle_mc_validators: Bool;
    readonly mc_catchain_lifetime: number;
    readonly shard_catchain_lifetime: number;
    readonly shard_validators_lifetime: number;
    readonly shard_validators_num: number;
}

/*
consensus_config#d6 round_candidates:# { round_candidates >= 1 }
  next_candidate_delay_ms:uint32 consensus_timeout_ms:uint32
  fast_attempts:uint32 attempt_duration:uint32 catchain_max_deps:uint32
  max_block_bytes:uint32 max_collated_bytes:uint32 = ConsensusConfig;
*/

/*
consensus_config_new#d7 flags:(## 7) { flags = 0 } new_catchain_ids:Bool
  round_candidates:(## 8) { round_candidates >= 1 }
  next_candidate_delay_ms:uint32 consensus_timeout_ms:uint32
  fast_attempts:uint32 attempt_duration:uint32 catchain_max_deps:uint32
  max_block_bytes:uint32 max_collated_bytes:uint32 = ConsensusConfig;
*/

/*
consensus_config_v3#d8 flags:(## 7) { flags = 0 } new_catchain_ids:Bool
  round_candidates:(## 8) { round_candidates >= 1 }
  next_candidate_delay_ms:uint32 consensus_timeout_ms:uint32
  fast_attempts:uint32 attempt_duration:uint32 catchain_max_deps:uint32
  max_block_bytes:uint32 max_collated_bytes:uint32
  proto_version:uint16 = ConsensusConfig;
*/

/*
consensus_config_v4#d9 flags:(## 7) { flags = 0 } new_catchain_ids:Bool
  round_candidates:(## 8) { round_candidates >= 1 }
  next_candidate_delay_ms:uint32 consensus_timeout_ms:uint32
  fast_attempts:uint32 attempt_duration:uint32 catchain_max_deps:uint32
  max_block_bytes:uint32 max_collated_bytes:uint32
  proto_version:uint16 catchain_max_blocks_coeff:uint32 = ConsensusConfig;
*/

export type ConsensusConfig = ConsensusConfig_consensus_config | ConsensusConfig_consensus_config_new | ConsensusConfig_consensus_config_v3 | ConsensusConfig_consensus_config_v4;

export interface ConsensusConfig_consensus_config {
    readonly kind: 'ConsensusConfig_consensus_config';
    readonly round_candidates: number;
    readonly next_candidate_delay_ms: number;
    readonly consensus_timeout_ms: number;
    readonly fast_attempts: number;
    readonly attempt_duration: number;
    readonly catchain_max_deps: number;
    readonly max_block_bytes: number;
    readonly max_collated_bytes: number;
}

export interface ConsensusConfig_consensus_config_new {
    readonly kind: 'ConsensusConfig_consensus_config_new';
    readonly flags: number;
    readonly new_catchain_ids: Bool;
    readonly round_candidates: number;
    readonly next_candidate_delay_ms: number;
    readonly consensus_timeout_ms: number;
    readonly fast_attempts: number;
    readonly attempt_duration: number;
    readonly catchain_max_deps: number;
    readonly max_block_bytes: number;
    readonly max_collated_bytes: number;
}

export interface ConsensusConfig_consensus_config_v3 {
    readonly kind: 'ConsensusConfig_consensus_config_v3';
    readonly flags: number;
    readonly new_catchain_ids: Bool;
    readonly round_candidates: number;
    readonly next_candidate_delay_ms: number;
    readonly consensus_timeout_ms: number;
    readonly fast_attempts: number;
    readonly attempt_duration: number;
    readonly catchain_max_deps: number;
    readonly max_block_bytes: number;
    readonly max_collated_bytes: number;
    readonly proto_version: number;
}

export interface ConsensusConfig_consensus_config_v4 {
    readonly kind: 'ConsensusConfig_consensus_config_v4';
    readonly flags: number;
    readonly new_catchain_ids: Bool;
    readonly round_candidates: number;
    readonly next_candidate_delay_ms: number;
    readonly consensus_timeout_ms: number;
    readonly fast_attempts: number;
    readonly attempt_duration: number;
    readonly catchain_max_deps: number;
    readonly max_block_bytes: number;
    readonly max_collated_bytes: number;
    readonly proto_version: number;
    readonly catchain_max_blocks_coeff: number;
}

// validator_temp_key#3 adnl_addr:bits256 temp_public_key:SigPubKey seqno:# valid_until:uint32 = ValidatorTempKey;

export interface ValidatorTempKey {
    readonly kind: 'ValidatorTempKey';
    readonly adnl_addr: Buffer;
    readonly temp_public_key: SigPubKey;
    readonly seqno: number;
    readonly valid_until: number;
}

// signed_temp_key#4 key:^ValidatorTempKey signature:CryptoSignature = ValidatorSignedTempKey;

export interface ValidatorSignedTempKey {
    readonly kind: 'ValidatorSignedTempKey';
    readonly key: ValidatorTempKey;
    readonly signature: CryptoSignature;
}

/*
misbehaviour_punishment_config_v1#01
  default_flat_fine:Grams default_proportional_fine:uint32
  severity_flat_mult:uint16 severity_proportional_mult:uint16
  unpunishable_interval:uint16
  long_interval:uint16 long_flat_mult:uint16 long_proportional_mult:uint16
  medium_interval:uint16 medium_flat_mult:uint16 medium_proportional_mult:uint16
   = MisbehaviourPunishmentConfig;
*/

export interface MisbehaviourPunishmentConfig {
    readonly kind: 'MisbehaviourPunishmentConfig';
    readonly default_flat_fine: bigint;
    readonly default_proportional_fine: number;
    readonly severity_flat_mult: number;
    readonly severity_proportional_mult: number;
    readonly unpunishable_interval: number;
    readonly long_interval: number;
    readonly long_flat_mult: number;
    readonly long_proportional_mult: number;
    readonly medium_interval: number;
    readonly medium_flat_mult: number;
    readonly medium_proportional_mult: number;
}

/*
size_limits_config#01 max_msg_bits:uint32 max_msg_cells:uint32 max_library_cells:uint32 max_vm_data_depth:uint16
  max_ext_msg_size:uint32 max_ext_msg_depth:uint16 = SizeLimitsConfig;
*/

/*
size_limits_config_v2#02 max_msg_bits:uint32 max_msg_cells:uint32 max_library_cells:uint32 max_vm_data_depth:uint16
  max_ext_msg_size:uint32 max_ext_msg_depth:uint16 max_acc_state_cells:uint32 max_acc_state_bits:uint32
  max_acc_public_libraries:uint32 defer_out_queue_size_limit:uint32 max_msg_extra_currencies:uint32
  max_acc_fixed_prefix_length:uint8 = SizeLimitsConfig;
*/

export type SizeLimitsConfig = SizeLimitsConfig_size_limits_config | SizeLimitsConfig_size_limits_config_v2;

export interface SizeLimitsConfig_size_limits_config {
    readonly kind: 'SizeLimitsConfig_size_limits_config';
    readonly max_msg_bits: number;
    readonly max_msg_cells: number;
    readonly max_library_cells: number;
    readonly max_vm_data_depth: number;
    readonly max_ext_msg_size: number;
    readonly max_ext_msg_depth: number;
}

export interface SizeLimitsConfig_size_limits_config_v2 {
    readonly kind: 'SizeLimitsConfig_size_limits_config_v2';
    readonly max_msg_bits: number;
    readonly max_msg_cells: number;
    readonly max_library_cells: number;
    readonly max_vm_data_depth: number;
    readonly max_ext_msg_size: number;
    readonly max_ext_msg_depth: number;
    readonly max_acc_state_cells: number;
    readonly max_acc_state_bits: number;
    readonly max_acc_public_libraries: number;
    readonly defer_out_queue_size_limit: number;
    readonly max_msg_extra_currencies: number;
    readonly max_acc_fixed_prefix_length: number;
}

// suspended_address_list#00 addresses:(HashmapE 288 Unit) suspended_until:uint32 = SuspendedAddressList;

export interface SuspendedAddressList {
    readonly kind: 'SuspendedAddressList';
    readonly addresses: Dictionary<bigint, Unit>;
    readonly suspended_until: number;
}

// precompiled_smc#b0 gas_usage:uint64 = PrecompiledSmc;

export interface PrecompiledSmc {
    readonly kind: 'PrecompiledSmc';
    readonly gas_usage: bigint;
}

// precompiled_contracts_config#c0 list:(HashmapE 256 PrecompiledSmc) = PrecompiledContractsConfig;

export interface PrecompiledContractsConfig {
    readonly kind: 'PrecompiledContractsConfig';
    readonly list: Dictionary<bigint, PrecompiledSmc>;
}

// oracle_bridge_params#_ bridge_address:bits256 oracle_mutlisig_address:bits256 oracles:(HashmapE 256 uint256) external_chain_address:bits256 = OracleBridgeParams;

export interface OracleBridgeParams {
    readonly kind: 'OracleBridgeParams';
    readonly bridge_address: Buffer;
    readonly oracle_mutlisig_address: Buffer;
    readonly oracles: Dictionary<bigint, bigint>;
    readonly external_chain_address: Buffer;
}

/*
jetton_bridge_prices#_ bridge_burn_fee:Coins bridge_mint_fee:Coins
                       wallet_min_tons_for_storage:Coins
                       wallet_gas_consumption:Coins
                       minter_min_tons_for_storage:Coins
                       discover_gas_consumption:Coins = JettonBridgePrices;
*/

export interface JettonBridgePrices {
    readonly kind: 'JettonBridgePrices';
    readonly bridge_burn_fee: bigint;
    readonly bridge_mint_fee: bigint;
    readonly wallet_min_tons_for_storage: bigint;
    readonly wallet_gas_consumption: bigint;
    readonly minter_min_tons_for_storage: bigint;
    readonly discover_gas_consumption: bigint;
}

// jetton_bridge_params_v0#00 bridge_address:bits256 oracles_address:bits256 oracles:(HashmapE 256 uint256) state_flags:uint8 burn_bridge_fee:Coins = JettonBridgeParams;

// jetton_bridge_params_v1#01 bridge_address:bits256 oracles_address:bits256 oracles:(HashmapE 256 uint256) state_flags:uint8 prices:^JettonBridgePrices external_chain_address:bits256 = JettonBridgeParams;

export type JettonBridgeParams = JettonBridgeParams_jetton_bridge_params_v0 | JettonBridgeParams_jetton_bridge_params_v1;

export interface JettonBridgeParams_jetton_bridge_params_v0 {
    readonly kind: 'JettonBridgeParams_jetton_bridge_params_v0';
    readonly bridge_address: Buffer;
    readonly oracles_address: Buffer;
    readonly oracles: Dictionary<bigint, bigint>;
    readonly state_flags: number;
    readonly burn_bridge_fee: bigint;
}

export interface JettonBridgeParams_jetton_bridge_params_v1 {
    readonly kind: 'JettonBridgeParams_jetton_bridge_params_v1';
    readonly bridge_address: Buffer;
    readonly oracles_address: Buffer;
    readonly oracles: Dictionary<bigint, bigint>;
    readonly state_flags: number;
    readonly prices: JettonBridgePrices;
    readonly external_chain_address: Buffer;
}

// unit$_ = Unit;

export function loadUnit(slice: Slice): Unit {
    return {
        kind: 'Unit',
    }

}

export function storeUnit(unit: Unit): (builder: Builder) => void {
    return ((builder: Builder) => {
    })

}

// true$_ = True;

export function loadTrue(slice: Slice): True {
    return {
        kind: 'True',
    }

}

export function storeTrue(true0: True): (builder: Builder) => void {
    return ((builder: Builder) => {
    })

}

// nothing$0 {X:Type} = Maybe X;

// just$1 {X:Type} value:X = Maybe X;

export function loadMaybe<X>(slice: Slice, loadX: (slice: Slice) => X): Maybe<X> {
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b0))) {
        slice.loadUint(1);
        return {
            kind: 'Maybe_nothing',
        }

    }
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b1))) {
        slice.loadUint(1);
        let value: X = loadX(slice);
        return {
            kind: 'Maybe_just',
            value: value,
        }

    }
    throw new Error('Expected one of "Maybe_nothing", "Maybe_just" in loading "Maybe", but data does not satisfy any constructor');
}

export function storeMaybe<X>(maybe: Maybe<X>, storeX: (x: X) => (builder: Builder) => void): (builder: Builder) => void {
    if ((maybe.kind == 'Maybe_nothing')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
        })

    }
    if ((maybe.kind == 'Maybe_just')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1, 1);
            storeX(maybe.value)(builder);
        })

    }
    throw new Error('Expected one of "Maybe_nothing", "Maybe_just" in loading "Maybe", but data does not satisfy any constructor');
}

export function hashmap_get_l(label: HmLabel): number {
    if ((label.kind == 'HmLabel_hml_short')) {
        let n = label.n;
        return n

    }
    if ((label.kind == 'HmLabel_hml_long')) {
        let n = label.n;
        return n

    }
    if ((label.kind == 'HmLabel_hml_same')) {
        let n = label.n;
        return n

    }
    throw new Error('Expected one of "HmLabel_hml_short", "HmLabel_hml_long", "HmLabel_hml_same" for type "HmLabel" while getting "label", but data does not satisfy any constructor');
}

/*
hm_edge#_ {n:#} {X:Type} {l:#} {m:#} label:(HmLabel ~l n)
          {n = (~m) + l} node:(HashmapNode m X) = Hashmap n X;
*/

export function loadHashmap<X>(slice: Slice, n: number, loadX: (slice: Slice) => X): Hashmap<X> {
    let label: HmLabel = loadHmLabel(slice, n);
    let l = hashmap_get_l(label);
    let node: HashmapNode<X> = loadHashmapNode<X>(slice, (n - l), loadX);
    return {
        kind: 'Hashmap',
        n: n,
        m: (n - l),
        label: label,
        l: l,
        node: node,
    }

}

export function storeHashmap<X>(hashmap: Hashmap<X>, storeX: (x: X) => (builder: Builder) => void): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeHmLabel(hashmap.label)(builder);
        storeHashmapNode<X>(hashmap.node, storeX)(builder);
    })

}

// hmn_leaf#_ {X:Type} value:X = HashmapNode 0 X;

/*
hmn_fork#_ {n:#} {X:Type} left:^(Hashmap n X)
           right:^(Hashmap n X) = HashmapNode (n + 1) X;
*/

export function loadHashmapNode<X>(slice: Slice, arg0: number, loadX: (slice: Slice) => X): HashmapNode<X> {
    if ((arg0 == 0)) {
        let value: X = loadX(slice);
        return {
            kind: 'HashmapNode_hmn_leaf',
            value: value,
        }

    }
    if (true) {
        let slice1 = slice.loadRef().beginParse(true);
        let left: Hashmap<X> = loadHashmap<X>(slice1, (arg0 - 1), loadX);
        let slice2 = slice.loadRef().beginParse(true);
        let right: Hashmap<X> = loadHashmap<X>(slice2, (arg0 - 1), loadX);
        return {
            kind: 'HashmapNode_hmn_fork',
            n: (arg0 - 1),
            left: left,
            right: right,
        }

    }
    throw new Error('Expected one of "HashmapNode_hmn_leaf", "HashmapNode_hmn_fork" in loading "HashmapNode", but data does not satisfy any constructor');
}

export function storeHashmapNode<X>(hashmapNode: HashmapNode<X>, storeX: (x: X) => (builder: Builder) => void): (builder: Builder) => void {
    if ((hashmapNode.kind == 'HashmapNode_hmn_leaf')) {
        return ((builder: Builder) => {
            storeX(hashmapNode.value)(builder);
        })

    }
    if ((hashmapNode.kind == 'HashmapNode_hmn_fork')) {
        return ((builder: Builder) => {
            let cell1 = beginCell();
            storeHashmap<X>(hashmapNode.left, storeX)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeHashmap<X>(hashmapNode.right, storeX)(cell2);
            builder.storeRef(cell2);
        })

    }
    throw new Error('Expected one of "HashmapNode_hmn_leaf", "HashmapNode_hmn_fork" in loading "HashmapNode", but data does not satisfy any constructor');
}

export function hmLabel_hml_short_get_n(len: Unary): number {
    if ((len.kind == 'Unary_unary_zero')) {
        return 0

    }
    if ((len.kind == 'Unary_unary_succ')) {
        let n = len.n;
        return (n + 1)

    }
    throw new Error('Expected one of "Unary_unary_zero", "Unary_unary_succ" for type "Unary" while getting "len", but data does not satisfy any constructor');
}

// hml_short$0 {m:#} {n:#} len:(Unary ~n) {n <= m} s:(n * Bit) = HmLabel ~n m;

// hml_long$10 {m:#} n:(#<= m) s:(n * Bit) = HmLabel ~n m;

// hml_same$11 {m:#} v:Bit n:(#<= m) = HmLabel ~n m;

export function loadHmLabel(slice: Slice, m: number): HmLabel {
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b0))) {
        slice.loadUint(1);
        let len: Unary = loadUnary(slice);
        let n = hmLabel_hml_short_get_n(len);
        let s: Array<boolean> = Array.from(Array(n).keys()).map(((arg: number) => {
            return slice.loadBit()

        }));
        if ((!(n <= m))) {
            throw new Error('Condition (n <= m) is not satisfied while loading "HmLabel_hml_short" for type "HmLabel"');
        }
        return {
            kind: 'HmLabel_hml_short',
            m: m,
            len: len,
            n: n,
            s: s,
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b10))) {
        slice.loadUint(2);
        let n: number = slice.loadUint(bitLen(m));
        let s: Array<boolean> = Array.from(Array(n).keys()).map(((arg: number) => {
            return slice.loadBit()

        }));
        return {
            kind: 'HmLabel_hml_long',
            m: m,
            n: n,
            s: s,
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b11))) {
        slice.loadUint(2);
        let v: boolean = slice.loadBit();
        let n: number = slice.loadUint(bitLen(m));
        return {
            kind: 'HmLabel_hml_same',
            m: m,
            v: v,
            n: n,
        }

    }
    throw new Error('Expected one of "HmLabel_hml_short", "HmLabel_hml_long", "HmLabel_hml_same" in loading "HmLabel", but data does not satisfy any constructor');
}

export function storeHmLabel(hmLabel: HmLabel): (builder: Builder) => void {
    if ((hmLabel.kind == 'HmLabel_hml_short')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
            storeUnary(hmLabel.len)(builder);
            hmLabel.s.forEach(((arg: boolean) => {
                builder.storeBit(arg);
            }));
            if ((!(hmLabel.n <= hmLabel.m))) {
                throw new Error('Condition (hmLabel.n <= hmLabel.m) is not satisfied while loading "HmLabel_hml_short" for type "HmLabel"');
            }
        })

    }
    if ((hmLabel.kind == 'HmLabel_hml_long')) {
        return ((builder: Builder) => {
            builder.storeUint(0b10, 2);
            builder.storeUint(hmLabel.n, bitLen(hmLabel.m));
            hmLabel.s.forEach(((arg: boolean) => {
                builder.storeBit(arg);
            }));
        })

    }
    if ((hmLabel.kind == 'HmLabel_hml_same')) {
        return ((builder: Builder) => {
            builder.storeUint(0b11, 2);
            builder.storeBit(hmLabel.v);
            builder.storeUint(hmLabel.n, bitLen(hmLabel.m));
        })

    }
    throw new Error('Expected one of "HmLabel_hml_short", "HmLabel_hml_long", "HmLabel_hml_same" in loading "HmLabel", but data does not satisfy any constructor');
}

// unary_zero$0 = Unary ~0;

export function unary_unary_succ_get_n(x: Unary): number {
    if ((x.kind == 'Unary_unary_zero')) {
        return 0

    }
    if ((x.kind == 'Unary_unary_succ')) {
        let n = x.n;
        return (n + 1)

    }
    throw new Error('Expected one of "Unary_unary_zero", "Unary_unary_succ" for type "Unary" while getting "x", but data does not satisfy any constructor');
}

// unary_succ$1 {n:#} x:(Unary ~n) = Unary ~(n + 1);

export function loadUnary(slice: Slice): Unary {
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b0))) {
        slice.loadUint(1);
        return {
            kind: 'Unary_unary_zero',
        }

    }
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b1))) {
        slice.loadUint(1);
        let x: Unary = loadUnary(slice);
        let n = unary_unary_succ_get_n(x);
        return {
            kind: 'Unary_unary_succ',
            x: x,
            n: n,
        }

    }
    throw new Error('Expected one of "Unary_unary_zero", "Unary_unary_succ" in loading "Unary", but data does not satisfy any constructor');
}

export function storeUnary(unary: Unary): (builder: Builder) => void {
    if ((unary.kind == 'Unary_unary_zero')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
        })

    }
    if ((unary.kind == 'Unary_unary_succ')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1, 1);
            storeUnary(unary.x)(builder);
        })

    }
    throw new Error('Expected one of "Unary_unary_zero", "Unary_unary_succ" in loading "Unary", but data does not satisfy any constructor');
}

// _ grams:Grams = Coins;

export function loadCoins(slice: Slice): Coins {
    let grams: bigint = slice.loadCoins();
    return {
        kind: 'Coins',
        grams: grams,
    }

}

export function storeCoins(coins: Coins): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeCoins(coins.grams);
    })

}

/*
extra_currencies$_ dict:(HashmapE 32 (VarUInteger 32))
                 = ExtraCurrencyCollection;
*/

export function loadExtraCurrencyCollection(slice: Slice): ExtraCurrencyCollection {
    let dict: Dictionary<number, bigint> = Dictionary.load(Dictionary.Keys.Uint(32), {
        serialize: () => { throw new Error('Not implemented') },
        parse: ((slice: Slice) => {
        return slice.loadVarUintBig(bitLen((32 - 1)))

    }),
    }, slice);
    return {
        kind: 'ExtraCurrencyCollection',
        dict: dict,
    }

}

export function storeExtraCurrencyCollection(extraCurrencyCollection: ExtraCurrencyCollection): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeDict(extraCurrencyCollection.dict, Dictionary.Keys.Uint(32), {
            serialize: ((arg: bigint, builder: Builder) => {
            ((arg: bigint) => {
                return ((builder: Builder) => {
                    builder.storeVarUint(arg, bitLen((32 - 1)));
                })

            })(arg)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
    })

}

// ed25519_pubkey#8e81278a pubkey:bits256 = SigPubKey;

export function loadSigPubKey(slice: Slice): SigPubKey {
    if (((slice.remainingBits >= 32) && (slice.preloadUint(32) == 0x8e81278a))) {
        slice.loadUint(32);
        let pubkey: Buffer = slice.loadBuffer((256 / 8));
        return {
            kind: 'SigPubKey',
            pubkey: pubkey,
        }

    }
    throw new Error('Expected one of "SigPubKey" in loading "SigPubKey", but data does not satisfy any constructor');
}

export function storeSigPubKey(sigPubKey: SigPubKey): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x8e81278a, 32);
        builder.storeBuffer(sigPubKey.pubkey, (256 / 8));
    })

}

// ed25519_signature#5 R:bits256 s:bits256 = CryptoSignatureSimple;

export function loadCryptoSignatureSimple(slice: Slice): CryptoSignatureSimple {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0x5))) {
        slice.loadUint(4);
        let R: Buffer = slice.loadBuffer((256 / 8));
        let s: Buffer = slice.loadBuffer((256 / 8));
        return {
            kind: 'CryptoSignatureSimple',
            R: R,
            s: s,
        }

    }
    throw new Error('Expected one of "CryptoSignatureSimple" in loading "CryptoSignatureSimple", but data does not satisfy any constructor');
}

export function storeCryptoSignatureSimple(cryptoSignatureSimple: CryptoSignatureSimple): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x5, 4);
        builder.storeBuffer(cryptoSignatureSimple.R, (256 / 8));
        builder.storeBuffer(cryptoSignatureSimple.s, (256 / 8));
    })

}

/*
chained_signature#f signed_cert:^SignedCertificate temp_key_signature:CryptoSignatureSimple
  = CryptoSignature;
*/

// _ CryptoSignatureSimple = CryptoSignature;

export function loadCryptoSignature(slice: Slice): CryptoSignature {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0xf))) {
        slice.loadUint(4);
        let slice1 = slice.loadRef().beginParse(true);
        let signed_cert: SignedCertificate = loadSignedCertificate(slice1);
        let temp_key_signature: CryptoSignatureSimple = loadCryptoSignatureSimple(slice);
        return {
            kind: 'CryptoSignature_chained_signature',
            signed_cert: signed_cert,
            temp_key_signature: temp_key_signature,
        }

    }
    if (true) {
        let anon0: CryptoSignatureSimple = loadCryptoSignatureSimple(slice);
        return {
            kind: 'CryptoSignature__',
            anon0: anon0,
        }

    }
    throw new Error('Expected one of "CryptoSignature_chained_signature", "CryptoSignature__" in loading "CryptoSignature", but data does not satisfy any constructor');
}

export function storeCryptoSignature(cryptoSignature: CryptoSignature): (builder: Builder) => void {
    if ((cryptoSignature.kind == 'CryptoSignature_chained_signature')) {
        return ((builder: Builder) => {
            builder.storeUint(0xf, 4);
            let cell1 = beginCell();
            storeSignedCertificate(cryptoSignature.signed_cert)(cell1);
            builder.storeRef(cell1);
            storeCryptoSignatureSimple(cryptoSignature.temp_key_signature)(builder);
        })

    }
    if ((cryptoSignature.kind == 'CryptoSignature__')) {
        return ((builder: Builder) => {
            storeCryptoSignatureSimple(cryptoSignature.anon0)(builder);
        })

    }
    throw new Error('Expected one of "CryptoSignature_chained_signature", "CryptoSignature__" in loading "CryptoSignature", but data does not satisfy any constructor');
}

// certificate#4 temp_key:SigPubKey valid_since:uint32 valid_until:uint32 = Certificate;

export function loadCertificate(slice: Slice): Certificate {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0x4))) {
        slice.loadUint(4);
        let temp_key: SigPubKey = loadSigPubKey(slice);
        let valid_since: number = slice.loadUint(32);
        let valid_until: number = slice.loadUint(32);
        return {
            kind: 'Certificate',
            temp_key: temp_key,
            valid_since: valid_since,
            valid_until: valid_until,
        }

    }
    throw new Error('Expected one of "Certificate" in loading "Certificate", but data does not satisfy any constructor');
}

export function storeCertificate(certificate: Certificate): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x4, 4);
        storeSigPubKey(certificate.temp_key)(builder);
        builder.storeUint(certificate.valid_since, 32);
        builder.storeUint(certificate.valid_until, 32);
    })

}

/*
signed_certificate$_ certificate:Certificate certificate_signature:CryptoSignature
  = SignedCertificate;
*/

export function loadSignedCertificate(slice: Slice): SignedCertificate {
    let certificate: Certificate = loadCertificate(slice);
    let certificate_signature: CryptoSignature = loadCryptoSignature(slice);
    return {
        kind: 'SignedCertificate',
        certificate: certificate,
        certificate_signature: certificate_signature,
    }

}

export function storeSignedCertificate(signedCertificate: SignedCertificate): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeCertificate(signedCertificate.certificate)(builder);
        storeCryptoSignature(signedCertificate.certificate_signature)(builder);
    })

}

// validator#53 public_key:SigPubKey weight:uint64 = ValidatorDescr;

// validator_addr#73 public_key:SigPubKey weight:uint64 adnl_addr:bits256 = ValidatorDescr;

export function loadValidatorDescr(slice: Slice): ValidatorDescr {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x53))) {
        slice.loadUint(8);
        let public_key: SigPubKey = loadSigPubKey(slice);
        let weight: bigint = slice.loadUintBig(64);
        return {
            kind: 'ValidatorDescr_validator',
            public_key: public_key,
            weight: weight,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x73))) {
        slice.loadUint(8);
        let public_key: SigPubKey = loadSigPubKey(slice);
        let weight: bigint = slice.loadUintBig(64);
        let adnl_addr: Buffer = slice.loadBuffer((256 / 8));
        return {
            kind: 'ValidatorDescr_validator_addr',
            public_key: public_key,
            weight: weight,
            adnl_addr: adnl_addr,
        }

    }
    throw new Error('Expected one of "ValidatorDescr_validator", "ValidatorDescr_validator_addr" in loading "ValidatorDescr", but data does not satisfy any constructor');
}

export function storeValidatorDescr(validatorDescr: ValidatorDescr): (builder: Builder) => void {
    if ((validatorDescr.kind == 'ValidatorDescr_validator')) {
        return ((builder: Builder) => {
            builder.storeUint(0x53, 8);
            storeSigPubKey(validatorDescr.public_key)(builder);
            builder.storeUint(validatorDescr.weight, 64);
        })

    }
    if ((validatorDescr.kind == 'ValidatorDescr_validator_addr')) {
        return ((builder: Builder) => {
            builder.storeUint(0x73, 8);
            storeSigPubKey(validatorDescr.public_key)(builder);
            builder.storeUint(validatorDescr.weight, 64);
            builder.storeBuffer(validatorDescr.adnl_addr, (256 / 8));
        })

    }
    throw new Error('Expected one of "ValidatorDescr_validator", "ValidatorDescr_validator_addr" in loading "ValidatorDescr", but data does not satisfy any constructor');
}

/*
validators#11 utime_since:uint32 utime_until:uint32
  total:(## 16) main:(## 16) { main <= total } { main >= 1 }
  list:(Hashmap 16 ValidatorDescr) = ValidatorSet;
*/

/*
validators_ext#12 utime_since:uint32 utime_until:uint32
  total:(## 16) main:(## 16) { main <= total } { main >= 1 }
  total_weight:uint64 list:(HashmapE 16 ValidatorDescr) = ValidatorSet;
*/

export function loadValidatorSet(slice: Slice): ValidatorSet {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x11))) {
        slice.loadUint(8);
        let utime_since: number = slice.loadUint(32);
        let utime_until: number = slice.loadUint(32);
        let total: number = slice.loadUint(16);
        let main: number = slice.loadUint(16);
        let list: Dictionary<number, ValidatorDescr> = Dictionary.loadDirect(Dictionary.Keys.Uint(16), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadValidatorDescr,
        }, slice);
        if ((!(main <= total))) {
            throw new Error('Condition (main <= total) is not satisfied while loading "ValidatorSet_validators" for type "ValidatorSet"');
        }
        if ((!(main >= 1))) {
            throw new Error('Condition (main >= 1) is not satisfied while loading "ValidatorSet_validators" for type "ValidatorSet"');
        }
        return {
            kind: 'ValidatorSet_validators',
            utime_since: utime_since,
            utime_until: utime_until,
            total: total,
            main: main,
            list: list,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x12))) {
        slice.loadUint(8);
        let utime_since: number = slice.loadUint(32);
        let utime_until: number = slice.loadUint(32);
        let total: number = slice.loadUint(16);
        let main: number = slice.loadUint(16);
        let total_weight: bigint = slice.loadUintBig(64);
        let list: Dictionary<number, ValidatorDescr> = Dictionary.load(Dictionary.Keys.Uint(16), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadValidatorDescr,
        }, slice);
        if ((!(main <= total))) {
            throw new Error('Condition (main <= total) is not satisfied while loading "ValidatorSet_validators_ext" for type "ValidatorSet"');
        }
        if ((!(main >= 1))) {
            throw new Error('Condition (main >= 1) is not satisfied while loading "ValidatorSet_validators_ext" for type "ValidatorSet"');
        }
        return {
            kind: 'ValidatorSet_validators_ext',
            utime_since: utime_since,
            utime_until: utime_until,
            total: total,
            main: main,
            total_weight: total_weight,
            list: list,
        }

    }
    throw new Error('Expected one of "ValidatorSet_validators", "ValidatorSet_validators_ext" in loading "ValidatorSet", but data does not satisfy any constructor');
}

export function storeValidatorSet(validatorSet: ValidatorSet): (builder: Builder) => void {
    if ((validatorSet.kind == 'ValidatorSet_validators')) {
        return ((builder: Builder) => {
            builder.storeUint(0x11, 8);
            builder.storeUint(validatorSet.utime_since, 32);
            builder.storeUint(validatorSet.utime_until, 32);
            builder.storeUint(validatorSet.total, 16);
            builder.storeUint(validatorSet.main, 16);
            builder.storeDictDirect(validatorSet.list, Dictionary.Keys.Uint(16), {
                serialize: ((arg: ValidatorDescr, builder: Builder) => {
                storeValidatorDescr(arg)(builder);
            }),
                parse: () => { throw new Error('Not implemented') },
            });
            if ((!(validatorSet.main <= validatorSet.total))) {
                throw new Error('Condition (validatorSet.main <= validatorSet.total) is not satisfied while loading "ValidatorSet_validators" for type "ValidatorSet"');
            }
            if ((!(validatorSet.main >= 1))) {
                throw new Error('Condition (validatorSet.main >= 1) is not satisfied while loading "ValidatorSet_validators" for type "ValidatorSet"');
            }
        })

    }
    if ((validatorSet.kind == 'ValidatorSet_validators_ext')) {
        return ((builder: Builder) => {
            builder.storeUint(0x12, 8);
            builder.storeUint(validatorSet.utime_since, 32);
            builder.storeUint(validatorSet.utime_until, 32);
            builder.storeUint(validatorSet.total, 16);
            builder.storeUint(validatorSet.main, 16);
            builder.storeUint(validatorSet.total_weight, 64);
            builder.storeDict(validatorSet.list, Dictionary.Keys.Uint(16), {
                serialize: ((arg: ValidatorDescr, builder: Builder) => {
                storeValidatorDescr(arg)(builder);
            }),
                parse: () => { throw new Error('Not implemented') },
            });
            if ((!(validatorSet.main <= validatorSet.total))) {
                throw new Error('Condition (validatorSet.main <= validatorSet.total) is not satisfied while loading "ValidatorSet_validators_ext" for type "ValidatorSet"');
            }
            if ((!(validatorSet.main >= 1))) {
                throw new Error('Condition (validatorSet.main >= 1) is not satisfied while loading "ValidatorSet_validators_ext" for type "ValidatorSet"');
            }
        })

    }
    throw new Error('Expected one of "ValidatorSet_validators", "ValidatorSet_validators_ext" in loading "ValidatorSet", but data does not satisfy any constructor');
}

// _ config_addr:bits256 = ConfigParam 0;

// _ elector_addr:bits256 = ConfigParam 1;

// _ minter_addr:bits256 = ConfigParam 2;

// _ fee_collector_addr:bits256 = ConfigParam 3;

// _ dns_root_addr:bits256 = ConfigParam 4;

// _ BurningConfig = ConfigParam 5;

// _ mint_new_price:Grams mint_add_price:Grams = ConfigParam 6;

// _ to_mint:ExtraCurrencyCollection = ConfigParam 7;

// _ GlobalVersion = ConfigParam 8;

// _ mandatory_params:(Hashmap 32 True) = ConfigParam 9;

// _ critical_params:(Hashmap 32 True) = ConfigParam 10;

// _ ConfigVotingSetup = ConfigParam 11;

// _ workchains:(HashmapE 32 WorkchainDescr) = ConfigParam 12;

// _ ComplaintPricing = ConfigParam 13;

// _ BlockCreateFees = ConfigParam 14;

/*
_ validators_elected_for:uint32 elections_start_before:uint32
  elections_end_before:uint32 stake_held_for:uint32
  = ConfigParam 15;
*/

/*
_ max_validators:(## 16) max_main_validators:(## 16) min_validators:(## 16)
  { max_validators >= max_main_validators }
  { max_main_validators >= min_validators }
  { min_validators >= 1 }
  = ConfigParam 16;
*/

// _ min_stake:Grams max_stake:Grams min_total_stake:Grams max_stake_factor:uint32 = ConfigParam 17;

// _ (Hashmap 32 StoragePrices) = ConfigParam 18;

// _ global_id:int32 = ConfigParam 19;

// config_mc_gas_prices#_ GasLimitsPrices = ConfigParam 20;

// config_gas_prices#_ GasLimitsPrices = ConfigParam 21;

// config_mc_block_limits#_ BlockLimits = ConfigParam 22;

// config_block_limits#_ BlockLimits = ConfigParam 23;

// config_mc_fwd_prices#_ MsgForwardPrices = ConfigParam 24;

// config_fwd_prices#_ MsgForwardPrices = ConfigParam 25;

// _ CatchainConfig = ConfigParam 28;

// _ ConsensusConfig = ConfigParam 29;

// _ fundamental_smc_addr:(HashmapE 256 True) = ConfigParam 31;

// _ prev_validators:ValidatorSet = ConfigParam 32;

// _ prev_temp_validators:ValidatorSet = ConfigParam 33;

// _ cur_validators:ValidatorSet = ConfigParam 34;

// _ cur_temp_validators:ValidatorSet = ConfigParam 35;

// _ next_validators:ValidatorSet = ConfigParam 36;

// _ next_temp_validators:ValidatorSet = ConfigParam 37;

// _ (HashmapE 256 ValidatorSignedTempKey) = ConfigParam 39;

// _ MisbehaviourPunishmentConfig = ConfigParam 40;

// _ SizeLimitsConfig = ConfigParam 43;

// _ SuspendedAddressList = ConfigParam 44;

// _ PrecompiledContractsConfig = ConfigParam 45;

// _ OracleBridgeParams = ConfigParam 71;

// _ OracleBridgeParams = ConfigParam 72;

// _ OracleBridgeParams = ConfigParam 73;

// _ JettonBridgeParams = ConfigParam 79;

// _ JettonBridgeParams = ConfigParam 81;

// _ JettonBridgeParams = ConfigParam 82;

export function loadConfigParam(slice: Slice, arg0: number): ConfigParam {
    if ((arg0 == 0)) {
        let config_addr: Buffer = slice.loadBuffer((256 / 8));
        return {
            kind: 'ConfigParam__',
            config_addr: config_addr,
        }

    }
    if ((arg0 == 1)) {
        let elector_addr: Buffer = slice.loadBuffer((256 / 8));
        return {
            kind: 'ConfigParam__1',
            elector_addr: elector_addr,
        }

    }
    if ((arg0 == 2)) {
        let minter_addr: Buffer = slice.loadBuffer((256 / 8));
        return {
            kind: 'ConfigParam__2',
            minter_addr: minter_addr,
        }

    }
    if ((arg0 == 3)) {
        let fee_collector_addr: Buffer = slice.loadBuffer((256 / 8));
        return {
            kind: 'ConfigParam__3',
            fee_collector_addr: fee_collector_addr,
        }

    }
    if ((arg0 == 4)) {
        let dns_root_addr: Buffer = slice.loadBuffer((256 / 8));
        return {
            kind: 'ConfigParam__4',
            dns_root_addr: dns_root_addr,
        }

    }
    if ((arg0 == 5)) {
        let anon0: BurningConfig = loadBurningConfig(slice);
        return {
            kind: 'ConfigParam__5',
            anon0: anon0,
        }

    }
    if ((arg0 == 6)) {
        let mint_new_price: bigint = slice.loadCoins();
        let mint_add_price: bigint = slice.loadCoins();
        return {
            kind: 'ConfigParam__6',
            mint_new_price: mint_new_price,
            mint_add_price: mint_add_price,
        }

    }
    if ((arg0 == 7)) {
        let to_mint: ExtraCurrencyCollection = loadExtraCurrencyCollection(slice);
        return {
            kind: 'ConfigParam__7',
            to_mint: to_mint,
        }

    }
    if ((arg0 == 8)) {
        let anon0: GlobalVersion = loadGlobalVersion(slice);
        return {
            kind: 'ConfigParam__8',
            anon0: anon0,
        }

    }
    if ((arg0 == 9)) {
        let mandatory_params: Dictionary<number, True> = Dictionary.loadDirect(Dictionary.Keys.Uint(32), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadTrue,
        }, slice);
        return {
            kind: 'ConfigParam__9',
            mandatory_params: mandatory_params,
        }

    }
    if ((arg0 == 10)) {
        let critical_params: Dictionary<number, True> = Dictionary.loadDirect(Dictionary.Keys.Uint(32), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadTrue,
        }, slice);
        return {
            kind: 'ConfigParam__10',
            critical_params: critical_params,
        }

    }
    if ((arg0 == 11)) {
        let anon0: ConfigVotingSetup = loadConfigVotingSetup(slice);
        return {
            kind: 'ConfigParam__11',
            anon0: anon0,
        }

    }
    if ((arg0 == 12)) {
        let workchains: Dictionary<number, WorkchainDescr> = Dictionary.load(Dictionary.Keys.Uint(32), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadWorkchainDescr,
        }, slice);
        return {
            kind: 'ConfigParam__12',
            workchains: workchains,
        }

    }
    if ((arg0 == 13)) {
        let anon0: ComplaintPricing = loadComplaintPricing(slice);
        return {
            kind: 'ConfigParam__13',
            anon0: anon0,
        }

    }
    if ((arg0 == 14)) {
        let anon0: BlockCreateFees = loadBlockCreateFees(slice);
        return {
            kind: 'ConfigParam__14',
            anon0: anon0,
        }

    }
    if ((arg0 == 15)) {
        let validators_elected_for: number = slice.loadUint(32);
        let elections_start_before: number = slice.loadUint(32);
        let elections_end_before: number = slice.loadUint(32);
        let stake_held_for: number = slice.loadUint(32);
        return {
            kind: 'ConfigParam__15',
            validators_elected_for: validators_elected_for,
            elections_start_before: elections_start_before,
            elections_end_before: elections_end_before,
            stake_held_for: stake_held_for,
        }

    }
    if ((arg0 == 16)) {
        let max_validators: number = slice.loadUint(16);
        let max_main_validators: number = slice.loadUint(16);
        let min_validators: number = slice.loadUint(16);
        if ((!(max_validators >= max_main_validators))) {
            throw new Error('Condition (max_validators >= max_main_validators) is not satisfied while loading "ConfigParam__16" for type "ConfigParam"');
        }
        if ((!(max_main_validators >= min_validators))) {
            throw new Error('Condition (max_main_validators >= min_validators) is not satisfied while loading "ConfigParam__16" for type "ConfigParam"');
        }
        if ((!(min_validators >= 1))) {
            throw new Error('Condition (min_validators >= 1) is not satisfied while loading "ConfigParam__16" for type "ConfigParam"');
        }
        return {
            kind: 'ConfigParam__16',
            max_validators: max_validators,
            max_main_validators: max_main_validators,
            min_validators: min_validators,
        }

    }
    if ((arg0 == 17)) {
        let min_stake: bigint = slice.loadCoins();
        let max_stake: bigint = slice.loadCoins();
        let min_total_stake: bigint = slice.loadCoins();
        let max_stake_factor: number = slice.loadUint(32);
        return {
            kind: 'ConfigParam__17',
            min_stake: min_stake,
            max_stake: max_stake,
            min_total_stake: min_total_stake,
            max_stake_factor: max_stake_factor,
        }

    }
    if ((arg0 == 18)) {
        let anon0: Dictionary<number, StoragePrices> = Dictionary.loadDirect(Dictionary.Keys.Uint(32), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadStoragePrices,
        }, slice);
        return {
            kind: 'ConfigParam__18',
            anon0: anon0,
        }

    }
    if ((arg0 == 19)) {
        let global_id: number = slice.loadInt(32);
        return {
            kind: 'ConfigParam__19',
            global_id: global_id,
        }

    }
    if ((arg0 == 20)) {
        let anon0: GasLimitsPrices = loadGasLimitsPrices(slice);
        return {
            kind: 'ConfigParam_config_mc_gas_prices',
            anon0: anon0,
        }

    }
    if ((arg0 == 21)) {
        let anon0: GasLimitsPrices = loadGasLimitsPrices(slice);
        return {
            kind: 'ConfigParam_config_gas_prices',
            anon0: anon0,
        }

    }
    if ((arg0 == 22)) {
        let anon0: BlockLimits = loadBlockLimits(slice);
        return {
            kind: 'ConfigParam_config_mc_block_limits',
            anon0: anon0,
        }

    }
    if ((arg0 == 23)) {
        let anon0: BlockLimits = loadBlockLimits(slice);
        return {
            kind: 'ConfigParam_config_block_limits',
            anon0: anon0,
        }

    }
    if ((arg0 == 24)) {
        let anon0: MsgForwardPrices = loadMsgForwardPrices(slice);
        return {
            kind: 'ConfigParam_config_mc_fwd_prices',
            anon0: anon0,
        }

    }
    if ((arg0 == 25)) {
        let anon0: MsgForwardPrices = loadMsgForwardPrices(slice);
        return {
            kind: 'ConfigParam_config_fwd_prices',
            anon0: anon0,
        }

    }
    if ((arg0 == 28)) {
        let anon0: CatchainConfig = loadCatchainConfig(slice);
        return {
            kind: 'ConfigParam__26',
            anon0: anon0,
        }

    }
    if ((arg0 == 29)) {
        let anon0: ConsensusConfig = loadConsensusConfig(slice);
        return {
            kind: 'ConfigParam__27',
            anon0: anon0,
        }

    }
    if ((arg0 == 31)) {
        let fundamental_smc_addr: Dictionary<bigint, True> = Dictionary.load(Dictionary.Keys.BigUint(256), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadTrue,
        }, slice);
        return {
            kind: 'ConfigParam__28',
            fundamental_smc_addr: fundamental_smc_addr,
        }

    }
    if ((arg0 == 32)) {
        let prev_validators: ValidatorSet = loadValidatorSet(slice);
        return {
            kind: 'ConfigParam__29',
            prev_validators: prev_validators,
        }

    }
    if ((arg0 == 33)) {
        let prev_temp_validators: ValidatorSet = loadValidatorSet(slice);
        return {
            kind: 'ConfigParam__30',
            prev_temp_validators: prev_temp_validators,
        }

    }
    if ((arg0 == 34)) {
        let cur_validators: ValidatorSet = loadValidatorSet(slice);
        return {
            kind: 'ConfigParam__31',
            cur_validators: cur_validators,
        }

    }
    if ((arg0 == 35)) {
        let cur_temp_validators: ValidatorSet = loadValidatorSet(slice);
        return {
            kind: 'ConfigParam__32',
            cur_temp_validators: cur_temp_validators,
        }

    }
    if ((arg0 == 36)) {
        let next_validators: ValidatorSet = loadValidatorSet(slice);
        return {
            kind: 'ConfigParam__33',
            next_validators: next_validators,
        }

    }
    if ((arg0 == 37)) {
        let next_temp_validators: ValidatorSet = loadValidatorSet(slice);
        return {
            kind: 'ConfigParam__34',
            next_temp_validators: next_temp_validators,
        }

    }
    if ((arg0 == 39)) {
        let anon0: Dictionary<bigint, ValidatorSignedTempKey> = Dictionary.load(Dictionary.Keys.BigUint(256), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadValidatorSignedTempKey,
        }, slice);
        return {
            kind: 'ConfigParam__35',
            anon0: anon0,
        }

    }
    if ((arg0 == 40)) {
        let anon0: MisbehaviourPunishmentConfig = loadMisbehaviourPunishmentConfig(slice);
        return {
            kind: 'ConfigParam__36',
            anon0: anon0,
        }

    }
    if ((arg0 == 43)) {
        let anon0: SizeLimitsConfig = loadSizeLimitsConfig(slice);
        return {
            kind: 'ConfigParam__37',
            anon0: anon0,
        }

    }
    if ((arg0 == 44)) {
        let anon0: SuspendedAddressList = loadSuspendedAddressList(slice);
        return {
            kind: 'ConfigParam__38',
            anon0: anon0,
        }

    }
    if ((arg0 == 45)) {
        let anon0: PrecompiledContractsConfig = loadPrecompiledContractsConfig(slice);
        return {
            kind: 'ConfigParam__39',
            anon0: anon0,
        }

    }
    if ((arg0 == 71)) {
        let anon0: OracleBridgeParams = loadOracleBridgeParams(slice);
        return {
            kind: 'ConfigParam__40',
            anon0: anon0,
        }

    }
    if ((arg0 == 72)) {
        let anon0: OracleBridgeParams = loadOracleBridgeParams(slice);
        return {
            kind: 'ConfigParam__41',
            anon0: anon0,
        }

    }
    if ((arg0 == 73)) {
        let anon0: OracleBridgeParams = loadOracleBridgeParams(slice);
        return {
            kind: 'ConfigParam__42',
            anon0: anon0,
        }

    }
    if ((arg0 == 79)) {
        let anon0: JettonBridgeParams = loadJettonBridgeParams(slice);
        return {
            kind: 'ConfigParam__43',
            anon0: anon0,
        }

    }
    if ((arg0 == 81)) {
        let anon0: JettonBridgeParams = loadJettonBridgeParams(slice);
        return {
            kind: 'ConfigParam__44',
            anon0: anon0,
        }

    }
    if ((arg0 == 82)) {
        let anon0: JettonBridgeParams = loadJettonBridgeParams(slice);
        return {
            kind: 'ConfigParam__45',
            anon0: anon0,
        }

    }
    throw new Error('Expected one of "ConfigParam__", "ConfigParam__1", "ConfigParam__2", "ConfigParam__3", "ConfigParam__4", "ConfigParam__5", "ConfigParam__6", "ConfigParam__7", "ConfigParam__8", "ConfigParam__9", "ConfigParam__10", "ConfigParam__11", "ConfigParam__12", "ConfigParam__13", "ConfigParam__14", "ConfigParam__15", "ConfigParam__16", "ConfigParam__17", "ConfigParam__18", "ConfigParam__19", "ConfigParam_config_mc_gas_prices", "ConfigParam_config_gas_prices", "ConfigParam_config_mc_block_limits", "ConfigParam_config_block_limits", "ConfigParam_config_mc_fwd_prices", "ConfigParam_config_fwd_prices", "ConfigParam__26", "ConfigParam__27", "ConfigParam__28", "ConfigParam__29", "ConfigParam__30", "ConfigParam__31", "ConfigParam__32", "ConfigParam__33", "ConfigParam__34", "ConfigParam__35", "ConfigParam__36", "ConfigParam__37", "ConfigParam__38", "ConfigParam__39", "ConfigParam__40", "ConfigParam__41", "ConfigParam__42", "ConfigParam__43", "ConfigParam__44", "ConfigParam__45" in loading "ConfigParam", but data does not satisfy any constructor');
}

export function storeConfigParam(configParam: ConfigParam): (builder: Builder) => void {
    if ((configParam.kind == 'ConfigParam__')) {
        return ((builder: Builder) => {
            builder.storeBuffer(configParam.config_addr, (256 / 8));
        })

    }
    if ((configParam.kind == 'ConfigParam__1')) {
        return ((builder: Builder) => {
            builder.storeBuffer(configParam.elector_addr, (256 / 8));
        })

    }
    if ((configParam.kind == 'ConfigParam__2')) {
        return ((builder: Builder) => {
            builder.storeBuffer(configParam.minter_addr, (256 / 8));
        })

    }
    if ((configParam.kind == 'ConfigParam__3')) {
        return ((builder: Builder) => {
            builder.storeBuffer(configParam.fee_collector_addr, (256 / 8));
        })

    }
    if ((configParam.kind == 'ConfigParam__4')) {
        return ((builder: Builder) => {
            builder.storeBuffer(configParam.dns_root_addr, (256 / 8));
        })

    }
    if ((configParam.kind == 'ConfigParam__5')) {
        return ((builder: Builder) => {
            storeBurningConfig(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__6')) {
        return ((builder: Builder) => {
            builder.storeCoins(configParam.mint_new_price);
            builder.storeCoins(configParam.mint_add_price);
        })

    }
    if ((configParam.kind == 'ConfigParam__7')) {
        return ((builder: Builder) => {
            storeExtraCurrencyCollection(configParam.to_mint)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__8')) {
        return ((builder: Builder) => {
            storeGlobalVersion(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__9')) {
        return ((builder: Builder) => {
            builder.storeDictDirect(configParam.mandatory_params, Dictionary.Keys.Uint(32), {
                serialize: ((arg: True, builder: Builder) => {
                storeTrue(arg)(builder);
            }),
                parse: () => { throw new Error('Not implemented') },
            });
        })

    }
    if ((configParam.kind == 'ConfigParam__10')) {
        return ((builder: Builder) => {
            builder.storeDictDirect(configParam.critical_params, Dictionary.Keys.Uint(32), {
                serialize: ((arg: True, builder: Builder) => {
                storeTrue(arg)(builder);
            }),
                parse: () => { throw new Error('Not implemented') },
            });
        })

    }
    if ((configParam.kind == 'ConfigParam__11')) {
        return ((builder: Builder) => {
            storeConfigVotingSetup(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__12')) {
        return ((builder: Builder) => {
            builder.storeDict(configParam.workchains, Dictionary.Keys.Uint(32), {
                serialize: ((arg: WorkchainDescr, builder: Builder) => {
                storeWorkchainDescr(arg)(builder);
            }),
                parse: () => { throw new Error('Not implemented') },
            });
        })

    }
    if ((configParam.kind == 'ConfigParam__13')) {
        return ((builder: Builder) => {
            storeComplaintPricing(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__14')) {
        return ((builder: Builder) => {
            storeBlockCreateFees(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__15')) {
        return ((builder: Builder) => {
            builder.storeUint(configParam.validators_elected_for, 32);
            builder.storeUint(configParam.elections_start_before, 32);
            builder.storeUint(configParam.elections_end_before, 32);
            builder.storeUint(configParam.stake_held_for, 32);
        })

    }
    if ((configParam.kind == 'ConfigParam__16')) {
        return ((builder: Builder) => {
            builder.storeUint(configParam.max_validators, 16);
            builder.storeUint(configParam.max_main_validators, 16);
            builder.storeUint(configParam.min_validators, 16);
            if ((!(configParam.max_validators >= configParam.max_main_validators))) {
                throw new Error('Condition (configParam.max_validators >= configParam.max_main_validators) is not satisfied while loading "ConfigParam__16" for type "ConfigParam"');
            }
            if ((!(configParam.max_main_validators >= configParam.min_validators))) {
                throw new Error('Condition (configParam.max_main_validators >= configParam.min_validators) is not satisfied while loading "ConfigParam__16" for type "ConfigParam"');
            }
            if ((!(configParam.min_validators >= 1))) {
                throw new Error('Condition (configParam.min_validators >= 1) is not satisfied while loading "ConfigParam__16" for type "ConfigParam"');
            }
        })

    }
    if ((configParam.kind == 'ConfigParam__17')) {
        return ((builder: Builder) => {
            builder.storeCoins(configParam.min_stake);
            builder.storeCoins(configParam.max_stake);
            builder.storeCoins(configParam.min_total_stake);
            builder.storeUint(configParam.max_stake_factor, 32);
        })

    }
    if ((configParam.kind == 'ConfigParam__18')) {
        return ((builder: Builder) => {
            builder.storeDictDirect(configParam.anon0, Dictionary.Keys.Uint(32), {
                serialize: ((arg: StoragePrices, builder: Builder) => {
                storeStoragePrices(arg)(builder);
            }),
                parse: () => { throw new Error('Not implemented') },
            });
        })

    }
    if ((configParam.kind == 'ConfigParam__19')) {
        return ((builder: Builder) => {
            builder.storeInt(configParam.global_id, 32);
        })

    }
    if ((configParam.kind == 'ConfigParam_config_mc_gas_prices')) {
        return ((builder: Builder) => {
            storeGasLimitsPrices(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam_config_gas_prices')) {
        return ((builder: Builder) => {
            storeGasLimitsPrices(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam_config_mc_block_limits')) {
        return ((builder: Builder) => {
            storeBlockLimits(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam_config_block_limits')) {
        return ((builder: Builder) => {
            storeBlockLimits(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam_config_mc_fwd_prices')) {
        return ((builder: Builder) => {
            storeMsgForwardPrices(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam_config_fwd_prices')) {
        return ((builder: Builder) => {
            storeMsgForwardPrices(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__26')) {
        return ((builder: Builder) => {
            storeCatchainConfig(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__27')) {
        return ((builder: Builder) => {
            storeConsensusConfig(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__28')) {
        return ((builder: Builder) => {
            builder.storeDict(configParam.fundamental_smc_addr, Dictionary.Keys.BigUint(256), {
                serialize: ((arg: True, builder: Builder) => {
                storeTrue(arg)(builder);
            }),
                parse: () => { throw new Error('Not implemented') },
            });
        })

    }
    if ((configParam.kind == 'ConfigParam__29')) {
        return ((builder: Builder) => {
            storeValidatorSet(configParam.prev_validators)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__30')) {
        return ((builder: Builder) => {
            storeValidatorSet(configParam.prev_temp_validators)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__31')) {
        return ((builder: Builder) => {
            storeValidatorSet(configParam.cur_validators)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__32')) {
        return ((builder: Builder) => {
            storeValidatorSet(configParam.cur_temp_validators)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__33')) {
        return ((builder: Builder) => {
            storeValidatorSet(configParam.next_validators)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__34')) {
        return ((builder: Builder) => {
            storeValidatorSet(configParam.next_temp_validators)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__35')) {
        return ((builder: Builder) => {
            builder.storeDict(configParam.anon0, Dictionary.Keys.BigUint(256), {
                serialize: ((arg: ValidatorSignedTempKey, builder: Builder) => {
                storeValidatorSignedTempKey(arg)(builder);
            }),
                parse: () => { throw new Error('Not implemented') },
            });
        })

    }
    if ((configParam.kind == 'ConfigParam__36')) {
        return ((builder: Builder) => {
            storeMisbehaviourPunishmentConfig(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__37')) {
        return ((builder: Builder) => {
            storeSizeLimitsConfig(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__38')) {
        return ((builder: Builder) => {
            storeSuspendedAddressList(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__39')) {
        return ((builder: Builder) => {
            storePrecompiledContractsConfig(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__40')) {
        return ((builder: Builder) => {
            storeOracleBridgeParams(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__41')) {
        return ((builder: Builder) => {
            storeOracleBridgeParams(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__42')) {
        return ((builder: Builder) => {
            storeOracleBridgeParams(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__43')) {
        return ((builder: Builder) => {
            storeJettonBridgeParams(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__44')) {
        return ((builder: Builder) => {
            storeJettonBridgeParams(configParam.anon0)(builder);
        })

    }
    if ((configParam.kind == 'ConfigParam__45')) {
        return ((builder: Builder) => {
            storeJettonBridgeParams(configParam.anon0)(builder);
        })

    }
    throw new Error('Expected one of "ConfigParam__", "ConfigParam__1", "ConfigParam__2", "ConfigParam__3", "ConfigParam__4", "ConfigParam__5", "ConfigParam__6", "ConfigParam__7", "ConfigParam__8", "ConfigParam__9", "ConfigParam__10", "ConfigParam__11", "ConfigParam__12", "ConfigParam__13", "ConfigParam__14", "ConfigParam__15", "ConfigParam__16", "ConfigParam__17", "ConfigParam__18", "ConfigParam__19", "ConfigParam_config_mc_gas_prices", "ConfigParam_config_gas_prices", "ConfigParam_config_mc_block_limits", "ConfigParam_config_block_limits", "ConfigParam_config_mc_fwd_prices", "ConfigParam_config_fwd_prices", "ConfigParam__26", "ConfigParam__27", "ConfigParam__28", "ConfigParam__29", "ConfigParam__30", "ConfigParam__31", "ConfigParam__32", "ConfigParam__33", "ConfigParam__34", "ConfigParam__35", "ConfigParam__36", "ConfigParam__37", "ConfigParam__38", "ConfigParam__39", "ConfigParam__40", "ConfigParam__41", "ConfigParam__42", "ConfigParam__43", "ConfigParam__44", "ConfigParam__45" in loading "ConfigParam", but data does not satisfy any constructor');
}

/*
burning_config#01
  blackhole_addr:(Maybe bits256)
  fee_burn_num:# fee_burn_denom:# { fee_burn_num <= fee_burn_denom } { fee_burn_denom >= 1 } = BurningConfig;
*/

export function loadBurningConfig(slice: Slice): BurningConfig {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x01))) {
        slice.loadUint(8);
        let blackhole_addr: Maybe<Buffer> = loadMaybe<Buffer>(slice, ((slice: Slice) => {
            return slice.loadBuffer((256 / 8))

        }));
        let fee_burn_num: number = slice.loadUint(32);
        let fee_burn_denom: number = slice.loadUint(32);
        if ((!(fee_burn_num <= fee_burn_denom))) {
            throw new Error('Condition (fee_burn_num <= fee_burn_denom) is not satisfied while loading "BurningConfig" for type "BurningConfig"');
        }
        if ((!(fee_burn_denom >= 1))) {
            throw new Error('Condition (fee_burn_denom >= 1) is not satisfied while loading "BurningConfig" for type "BurningConfig"');
        }
        return {
            kind: 'BurningConfig',
            blackhole_addr: blackhole_addr,
            fee_burn_num: fee_burn_num,
            fee_burn_denom: fee_burn_denom,
        }

    }
    throw new Error('Expected one of "BurningConfig" in loading "BurningConfig", but data does not satisfy any constructor');
}

export function storeBurningConfig(burningConfig: BurningConfig): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x01, 8);
        storeMaybe<Buffer>(burningConfig.blackhole_addr, ((arg: Buffer) => {
            return ((builder: Builder) => {
                builder.storeBuffer(arg, (256 / 8));
            })

        }))(builder);
        builder.storeUint(burningConfig.fee_burn_num, 32);
        builder.storeUint(burningConfig.fee_burn_denom, 32);
        if ((!(burningConfig.fee_burn_num <= burningConfig.fee_burn_denom))) {
            throw new Error('Condition (burningConfig.fee_burn_num <= burningConfig.fee_burn_denom) is not satisfied while loading "BurningConfig" for type "BurningConfig"');
        }
        if ((!(burningConfig.fee_burn_denom >= 1))) {
            throw new Error('Condition (burningConfig.fee_burn_denom >= 1) is not satisfied while loading "BurningConfig" for type "BurningConfig"');
        }
    })

}

// capabilities#c4 version:uint32 capabilities:uint64 = GlobalVersion;

export function loadGlobalVersion(slice: Slice): GlobalVersion {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xc4))) {
        slice.loadUint(8);
        let version: number = slice.loadUint(32);
        let capabilities: bigint = slice.loadUintBig(64);
        return {
            kind: 'GlobalVersion',
            version: version,
            capabilities: capabilities,
        }

    }
    throw new Error('Expected one of "GlobalVersion" in loading "GlobalVersion", but data does not satisfy any constructor');
}

export function storeGlobalVersion(globalVersion: GlobalVersion): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0xc4, 8);
        builder.storeUint(globalVersion.version, 32);
        builder.storeUint(globalVersion.capabilities, 64);
    })

}

// cfg_vote_cfg#36 min_tot_rounds:uint8 max_tot_rounds:uint8 min_wins:uint8 max_losses:uint8 min_store_sec:uint32 max_store_sec:uint32 bit_price:uint32 cell_price:uint32 = ConfigProposalSetup;

export function loadConfigProposalSetup(slice: Slice): ConfigProposalSetup {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x36))) {
        slice.loadUint(8);
        let min_tot_rounds: number = slice.loadUint(8);
        let max_tot_rounds: number = slice.loadUint(8);
        let min_wins: number = slice.loadUint(8);
        let max_losses: number = slice.loadUint(8);
        let min_store_sec: number = slice.loadUint(32);
        let max_store_sec: number = slice.loadUint(32);
        let bit_price: number = slice.loadUint(32);
        let _cell_price: number = slice.loadUint(32);
        return {
            kind: 'ConfigProposalSetup',
            min_tot_rounds: min_tot_rounds,
            max_tot_rounds: max_tot_rounds,
            min_wins: min_wins,
            max_losses: max_losses,
            min_store_sec: min_store_sec,
            max_store_sec: max_store_sec,
            bit_price: bit_price,
            _cell_price: _cell_price,
        }

    }
    throw new Error('Expected one of "ConfigProposalSetup" in loading "ConfigProposalSetup", but data does not satisfy any constructor');
}

export function storeConfigProposalSetup(configProposalSetup: ConfigProposalSetup): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x36, 8);
        builder.storeUint(configProposalSetup.min_tot_rounds, 8);
        builder.storeUint(configProposalSetup.max_tot_rounds, 8);
        builder.storeUint(configProposalSetup.min_wins, 8);
        builder.storeUint(configProposalSetup.max_losses, 8);
        builder.storeUint(configProposalSetup.min_store_sec, 32);
        builder.storeUint(configProposalSetup.max_store_sec, 32);
        builder.storeUint(configProposalSetup.bit_price, 32);
        builder.storeUint(configProposalSetup._cell_price, 32);
    })

}

// cfg_vote_setup#91 normal_params:^ConfigProposalSetup critical_params:^ConfigProposalSetup = ConfigVotingSetup;

export function loadConfigVotingSetup(slice: Slice): ConfigVotingSetup {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x91))) {
        slice.loadUint(8);
        let slice1 = slice.loadRef().beginParse(true);
        let normal_params: ConfigProposalSetup = loadConfigProposalSetup(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let critical_params: ConfigProposalSetup = loadConfigProposalSetup(slice2);
        return {
            kind: 'ConfigVotingSetup',
            normal_params: normal_params,
            critical_params: critical_params,
        }

    }
    throw new Error('Expected one of "ConfigVotingSetup" in loading "ConfigVotingSetup", but data does not satisfy any constructor');
}

export function storeConfigVotingSetup(configVotingSetup: ConfigVotingSetup): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x91, 8);
        let cell1 = beginCell();
        storeConfigProposalSetup(configVotingSetup.normal_params)(cell1);
        builder.storeRef(cell1);
        let cell2 = beginCell();
        storeConfigProposalSetup(configVotingSetup.critical_params)(cell2);
        builder.storeRef(cell2);
    })

}

/*
cfg_proposal#f3 param_id:int32 param_value:(Maybe ^Cell) if_hash_equal:(Maybe uint256)
  = ConfigProposal;
*/

export function loadConfigProposal(slice: Slice): ConfigProposal {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xf3))) {
        slice.loadUint(8);
        let param_id: number = slice.loadInt(32);
        let param_value: Maybe<Cell> = loadMaybe<Cell>(slice, ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return slice1.asCell()

        }));
        let if_hash_equal: Maybe<bigint> = loadMaybe<bigint>(slice, ((slice: Slice) => {
            return slice.loadUintBig(256)

        }));
        return {
            kind: 'ConfigProposal',
            param_id: param_id,
            param_value: param_value,
            if_hash_equal: if_hash_equal,
        }

    }
    throw new Error('Expected one of "ConfigProposal" in loading "ConfigProposal", but data does not satisfy any constructor');
}

export function storeConfigProposal(configProposal: ConfigProposal): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0xf3, 8);
        builder.storeInt(configProposal.param_id, 32);
        storeMaybe<Cell>(configProposal.param_value, ((arg: Cell) => {
            return ((builder: Builder) => {
                let cell1 = beginCell();
                cell1.storeSlice(arg.beginParse(true));
                builder.storeRef(cell1);

            })

        }))(builder);
        storeMaybe<bigint>(configProposal.if_hash_equal, ((arg: bigint) => {
            return ((builder: Builder) => {
                builder.storeUint(arg, 256);
            })

        }))(builder);
    })

}

/*
cfg_proposal_status#ce expires:uint32 proposal:^ConfigProposal is_critical:Bool
  voters:(HashmapE 16 True) remaining_weight:int64 validator_set_id:uint256
  rounds_remaining:uint8 wins:uint8 losses:uint8 = ConfigProposalStatus;
*/

export function loadConfigProposalStatus(slice: Slice): ConfigProposalStatus {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xce))) {
        slice.loadUint(8);
        let expires: number = slice.loadUint(32);
        let slice1 = slice.loadRef().beginParse(true);
        let proposal: ConfigProposal = loadConfigProposal(slice1);
        let is_critical: Bool = loadBool(slice);
        let voters: Dictionary<number, True> = Dictionary.load(Dictionary.Keys.Uint(16), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadTrue,
        }, slice);
        let remaining_weight: bigint = slice.loadIntBig(64);
        let validator_set_id: bigint = slice.loadUintBig(256);
        let rounds_remaining: number = slice.loadUint(8);
        let wins: number = slice.loadUint(8);
        let losses: number = slice.loadUint(8);
        return {
            kind: 'ConfigProposalStatus',
            expires: expires,
            proposal: proposal,
            is_critical: is_critical,
            voters: voters,
            remaining_weight: remaining_weight,
            validator_set_id: validator_set_id,
            rounds_remaining: rounds_remaining,
            wins: wins,
            losses: losses,
        }

    }
    throw new Error('Expected one of "ConfigProposalStatus" in loading "ConfigProposalStatus", but data does not satisfy any constructor');
}

export function storeConfigProposalStatus(configProposalStatus: ConfigProposalStatus): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0xce, 8);
        builder.storeUint(configProposalStatus.expires, 32);
        let cell1 = beginCell();
        storeConfigProposal(configProposalStatus.proposal)(cell1);
        builder.storeRef(cell1);
        storeBool(configProposalStatus.is_critical)(builder);
        builder.storeDict(configProposalStatus.voters, Dictionary.Keys.Uint(16), {
            serialize: ((arg: True, builder: Builder) => {
            storeTrue(arg)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
        builder.storeInt(configProposalStatus.remaining_weight, 64);
        builder.storeUint(configProposalStatus.validator_set_id, 256);
        builder.storeUint(configProposalStatus.rounds_remaining, 8);
        builder.storeUint(configProposalStatus.wins, 8);
        builder.storeUint(configProposalStatus.losses, 8);
    })

}

// wfmt_basic#1 vm_version:int32 vm_mode:uint64 = WorkchainFormat 1;

/*
wfmt_ext#0 min_addr_len:(## 12) max_addr_len:(## 12) addr_len_step:(## 12)
  { min_addr_len >= 64 } { min_addr_len <= max_addr_len }
  { max_addr_len <= 1023 } { addr_len_step <= 1023 }
  workchain_type_id:(## 32) { workchain_type_id >= 1 }
  = WorkchainFormat 0;
*/

export function loadWorkchainFormat(slice: Slice, arg0: number): WorkchainFormat {
    if (((slice.remainingBits >= 4) && ((slice.preloadUint(4) == 0x1) && (arg0 == 1)))) {
        slice.loadUint(4);
        let vm_version: number = slice.loadInt(32);
        let vm_mode: bigint = slice.loadUintBig(64);
        return {
            kind: 'WorkchainFormat_wfmt_basic',
            vm_version: vm_version,
            vm_mode: vm_mode,
        }

    }
    if (((slice.remainingBits >= 4) && ((slice.preloadUint(4) == 0x0) && (arg0 == 0)))) {
        slice.loadUint(4);
        let min_addr_len: number = slice.loadUint(12);
        let max_addr_len: number = slice.loadUint(12);
        let addr_len_step: number = slice.loadUint(12);
        let workchain_type_id: number = slice.loadUint(32);
        if ((!(min_addr_len >= 64))) {
            throw new Error('Condition (min_addr_len >= 64) is not satisfied while loading "WorkchainFormat_wfmt_ext" for type "WorkchainFormat"');
        }
        if ((!(min_addr_len <= max_addr_len))) {
            throw new Error('Condition (min_addr_len <= max_addr_len) is not satisfied while loading "WorkchainFormat_wfmt_ext" for type "WorkchainFormat"');
        }
        if ((!(max_addr_len <= 1023))) {
            throw new Error('Condition (max_addr_len <= 1023) is not satisfied while loading "WorkchainFormat_wfmt_ext" for type "WorkchainFormat"');
        }
        if ((!(addr_len_step <= 1023))) {
            throw new Error('Condition (addr_len_step <= 1023) is not satisfied while loading "WorkchainFormat_wfmt_ext" for type "WorkchainFormat"');
        }
        if ((!(workchain_type_id >= 1))) {
            throw new Error('Condition (workchain_type_id >= 1) is not satisfied while loading "WorkchainFormat_wfmt_ext" for type "WorkchainFormat"');
        }
        return {
            kind: 'WorkchainFormat_wfmt_ext',
            min_addr_len: min_addr_len,
            max_addr_len: max_addr_len,
            addr_len_step: addr_len_step,
            workchain_type_id: workchain_type_id,
        }

    }
    throw new Error('Expected one of "WorkchainFormat_wfmt_basic", "WorkchainFormat_wfmt_ext" in loading "WorkchainFormat", but data does not satisfy any constructor');
}

export function storeWorkchainFormat(workchainFormat: WorkchainFormat): (builder: Builder) => void {
    if ((workchainFormat.kind == 'WorkchainFormat_wfmt_basic')) {
        return ((builder: Builder) => {
            builder.storeUint(0x1, 4);
            builder.storeInt(workchainFormat.vm_version, 32);
            builder.storeUint(workchainFormat.vm_mode, 64);
        })

    }
    if ((workchainFormat.kind == 'WorkchainFormat_wfmt_ext')) {
        return ((builder: Builder) => {
            builder.storeUint(0x0, 4);
            builder.storeUint(workchainFormat.min_addr_len, 12);
            builder.storeUint(workchainFormat.max_addr_len, 12);
            builder.storeUint(workchainFormat.addr_len_step, 12);
            builder.storeUint(workchainFormat.workchain_type_id, 32);
            if ((!(workchainFormat.min_addr_len >= 64))) {
                throw new Error('Condition (workchainFormat.min_addr_len >= 64) is not satisfied while loading "WorkchainFormat_wfmt_ext" for type "WorkchainFormat"');
            }
            if ((!(workchainFormat.min_addr_len <= workchainFormat.max_addr_len))) {
                throw new Error('Condition (workchainFormat.min_addr_len <= workchainFormat.max_addr_len) is not satisfied while loading "WorkchainFormat_wfmt_ext" for type "WorkchainFormat"');
            }
            if ((!(workchainFormat.max_addr_len <= 1023))) {
                throw new Error('Condition (workchainFormat.max_addr_len <= 1023) is not satisfied while loading "WorkchainFormat_wfmt_ext" for type "WorkchainFormat"');
            }
            if ((!(workchainFormat.addr_len_step <= 1023))) {
                throw new Error('Condition (workchainFormat.addr_len_step <= 1023) is not satisfied while loading "WorkchainFormat_wfmt_ext" for type "WorkchainFormat"');
            }
            if ((!(workchainFormat.workchain_type_id >= 1))) {
                throw new Error('Condition (workchainFormat.workchain_type_id >= 1) is not satisfied while loading "WorkchainFormat_wfmt_ext" for type "WorkchainFormat"');
            }
        })

    }
    throw new Error('Expected one of "WorkchainFormat_wfmt_basic", "WorkchainFormat_wfmt_ext" in loading "WorkchainFormat", but data does not satisfy any constructor');
}

/*
wc_split_merge_timings#0
  split_merge_delay:uint32 split_merge_interval:uint32
  min_split_merge_interval:uint32 max_split_merge_delay:uint32
  = WcSplitMergeTimings;
*/

export function loadWcSplitMergeTimings(slice: Slice): WcSplitMergeTimings {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0x0))) {
        slice.loadUint(4);
        let split_merge_delay: number = slice.loadUint(32);
        let split_merge_interval: number = slice.loadUint(32);
        let min_split_merge_interval: number = slice.loadUint(32);
        let max_split_merge_delay: number = slice.loadUint(32);
        return {
            kind: 'WcSplitMergeTimings',
            split_merge_delay: split_merge_delay,
            split_merge_interval: split_merge_interval,
            min_split_merge_interval: min_split_merge_interval,
            max_split_merge_delay: max_split_merge_delay,
        }

    }
    throw new Error('Expected one of "WcSplitMergeTimings" in loading "WcSplitMergeTimings", but data does not satisfy any constructor');
}

export function storeWcSplitMergeTimings(wcSplitMergeTimings: WcSplitMergeTimings): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x0, 4);
        builder.storeUint(wcSplitMergeTimings.split_merge_delay, 32);
        builder.storeUint(wcSplitMergeTimings.split_merge_interval, 32);
        builder.storeUint(wcSplitMergeTimings.min_split_merge_interval, 32);
        builder.storeUint(wcSplitMergeTimings.max_split_merge_delay, 32);
    })

}

/*
workchain#a6 enabled_since:uint32 monitor_min_split:(## 8)
  min_split:(## 8) max_split:(## 8) { monitor_min_split <= min_split }
  basic:(## 1) active:Bool accept_msgs:Bool flags:(## 13) { flags = 0 }
  zerostate_root_hash:bits256 zerostate_file_hash:bits256
  version:uint32 format:(WorkchainFormat basic)
  = WorkchainDescr;
*/

/*
workchain_v2#a7 enabled_since:uint32 monitor_min_split:(## 8)
  min_split:(## 8) max_split:(## 8) { monitor_min_split <= min_split }
  basic:(## 1) active:Bool accept_msgs:Bool flags:(## 13) { flags = 0 }
  zerostate_root_hash:bits256 zerostate_file_hash:bits256
  version:uint32 format:(WorkchainFormat basic)
  split_merge_timings:WcSplitMergeTimings
  = WorkchainDescr;
*/

export function loadWorkchainDescr(slice: Slice): WorkchainDescr {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xa6))) {
        slice.loadUint(8);
        let enabled_since: number = slice.loadUint(32);
        let monitor_min_split: number = slice.loadUint(8);
        let min_split: number = slice.loadUint(8);
        let max_split: number = slice.loadUint(8);
        let basic: number = slice.loadUint(1);
        let active: Bool = loadBool(slice);
        let accept_msgs: Bool = loadBool(slice);
        let flags: number = slice.loadUint(13);
        let zerostate_root_hash: Buffer = slice.loadBuffer((256 / 8));
        let zerostate_file_hash: Buffer = slice.loadBuffer((256 / 8));
        let version: number = slice.loadUint(32);
        let format: WorkchainFormat = loadWorkchainFormat(slice, basic);
        if ((!(monitor_min_split <= min_split))) {
            throw new Error('Condition (monitor_min_split <= min_split) is not satisfied while loading "WorkchainDescr_workchain" for type "WorkchainDescr"');
        }
        if ((!(flags == 0))) {
            throw new Error('Condition (flags == 0) is not satisfied while loading "WorkchainDescr_workchain" for type "WorkchainDescr"');
        }
        return {
            kind: 'WorkchainDescr_workchain',
            enabled_since: enabled_since,
            monitor_min_split: monitor_min_split,
            min_split: min_split,
            max_split: max_split,
            basic: basic,
            active: active,
            accept_msgs: accept_msgs,
            flags: flags,
            zerostate_root_hash: zerostate_root_hash,
            zerostate_file_hash: zerostate_file_hash,
            version: version,
            format: format,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xa7))) {
        slice.loadUint(8);
        let enabled_since: number = slice.loadUint(32);
        let monitor_min_split: number = slice.loadUint(8);
        let min_split: number = slice.loadUint(8);
        let max_split: number = slice.loadUint(8);
        let basic: number = slice.loadUint(1);
        let active: Bool = loadBool(slice);
        let accept_msgs: Bool = loadBool(slice);
        let flags: number = slice.loadUint(13);
        let zerostate_root_hash: Buffer = slice.loadBuffer((256 / 8));
        let zerostate_file_hash: Buffer = slice.loadBuffer((256 / 8));
        let version: number = slice.loadUint(32);
        let format: WorkchainFormat = loadWorkchainFormat(slice, basic);
        let split_merge_timings: WcSplitMergeTimings = loadWcSplitMergeTimings(slice);
        if ((!(monitor_min_split <= min_split))) {
            throw new Error('Condition (monitor_min_split <= min_split) is not satisfied while loading "WorkchainDescr_workchain_v2" for type "WorkchainDescr"');
        }
        if ((!(flags == 0))) {
            throw new Error('Condition (flags == 0) is not satisfied while loading "WorkchainDescr_workchain_v2" for type "WorkchainDescr"');
        }
        return {
            kind: 'WorkchainDescr_workchain_v2',
            enabled_since: enabled_since,
            monitor_min_split: monitor_min_split,
            min_split: min_split,
            max_split: max_split,
            basic: basic,
            active: active,
            accept_msgs: accept_msgs,
            flags: flags,
            zerostate_root_hash: zerostate_root_hash,
            zerostate_file_hash: zerostate_file_hash,
            version: version,
            format: format,
            split_merge_timings: split_merge_timings,
        }

    }
    throw new Error('Expected one of "WorkchainDescr_workchain", "WorkchainDescr_workchain_v2" in loading "WorkchainDescr", but data does not satisfy any constructor');
}

export function storeWorkchainDescr(workchainDescr: WorkchainDescr): (builder: Builder) => void {
    if ((workchainDescr.kind == 'WorkchainDescr_workchain')) {
        return ((builder: Builder) => {
            builder.storeUint(0xa6, 8);
            builder.storeUint(workchainDescr.enabled_since, 32);
            builder.storeUint(workchainDescr.monitor_min_split, 8);
            builder.storeUint(workchainDescr.min_split, 8);
            builder.storeUint(workchainDescr.max_split, 8);
            builder.storeUint(workchainDescr.basic, 1);
            storeBool(workchainDescr.active)(builder);
            storeBool(workchainDescr.accept_msgs)(builder);
            builder.storeUint(workchainDescr.flags, 13);
            builder.storeBuffer(workchainDescr.zerostate_root_hash, (256 / 8));
            builder.storeBuffer(workchainDescr.zerostate_file_hash, (256 / 8));
            builder.storeUint(workchainDescr.version, 32);
            storeWorkchainFormat(workchainDescr.format)(builder);
            if ((!(workchainDescr.monitor_min_split <= workchainDescr.min_split))) {
                throw new Error('Condition (workchainDescr.monitor_min_split <= workchainDescr.min_split) is not satisfied while loading "WorkchainDescr_workchain" for type "WorkchainDescr"');
            }
            if ((!(workchainDescr.flags == 0))) {
                throw new Error('Condition (workchainDescr.flags == 0) is not satisfied while loading "WorkchainDescr_workchain" for type "WorkchainDescr"');
            }
        })

    }
    if ((workchainDescr.kind == 'WorkchainDescr_workchain_v2')) {
        return ((builder: Builder) => {
            builder.storeUint(0xa7, 8);
            builder.storeUint(workchainDescr.enabled_since, 32);
            builder.storeUint(workchainDescr.monitor_min_split, 8);
            builder.storeUint(workchainDescr.min_split, 8);
            builder.storeUint(workchainDescr.max_split, 8);
            builder.storeUint(workchainDescr.basic, 1);
            storeBool(workchainDescr.active)(builder);
            storeBool(workchainDescr.accept_msgs)(builder);
            builder.storeUint(workchainDescr.flags, 13);
            builder.storeBuffer(workchainDescr.zerostate_root_hash, (256 / 8));
            builder.storeBuffer(workchainDescr.zerostate_file_hash, (256 / 8));
            builder.storeUint(workchainDescr.version, 32);
            storeWorkchainFormat(workchainDescr.format)(builder);
            storeWcSplitMergeTimings(workchainDescr.split_merge_timings)(builder);
            if ((!(workchainDescr.monitor_min_split <= workchainDescr.min_split))) {
                throw new Error('Condition (workchainDescr.monitor_min_split <= workchainDescr.min_split) is not satisfied while loading "WorkchainDescr_workchain_v2" for type "WorkchainDescr"');
            }
            if ((!(workchainDescr.flags == 0))) {
                throw new Error('Condition (workchainDescr.flags == 0) is not satisfied while loading "WorkchainDescr_workchain_v2" for type "WorkchainDescr"');
            }
        })

    }
    throw new Error('Expected one of "WorkchainDescr_workchain", "WorkchainDescr_workchain_v2" in loading "WorkchainDescr", but data does not satisfy any constructor');
}

// complaint_prices#1a deposit:Grams bit_price:Grams cell_price:Grams = ComplaintPricing;

export function loadComplaintPricing(slice: Slice): ComplaintPricing {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x1a))) {
        slice.loadUint(8);
        let deposit: bigint = slice.loadCoins();
        let bit_price: bigint = slice.loadCoins();
        let _cell_price: bigint = slice.loadCoins();
        return {
            kind: 'ComplaintPricing',
            deposit: deposit,
            bit_price: bit_price,
            _cell_price: _cell_price,
        }

    }
    throw new Error('Expected one of "ComplaintPricing" in loading "ComplaintPricing", but data does not satisfy any constructor');
}

export function storeComplaintPricing(complaintPricing: ComplaintPricing): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x1a, 8);
        builder.storeCoins(complaintPricing.deposit);
        builder.storeCoins(complaintPricing.bit_price);
        builder.storeCoins(complaintPricing._cell_price);
    })

}

/*
block_grams_created#6b masterchain_block_fee:Grams basechain_block_fee:Grams
  = BlockCreateFees;
*/

export function loadBlockCreateFees(slice: Slice): BlockCreateFees {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x6b))) {
        slice.loadUint(8);
        let masterchain_block_fee: bigint = slice.loadCoins();
        let basechain_block_fee: bigint = slice.loadCoins();
        return {
            kind: 'BlockCreateFees',
            masterchain_block_fee: masterchain_block_fee,
            basechain_block_fee: basechain_block_fee,
        }

    }
    throw new Error('Expected one of "BlockCreateFees" in loading "BlockCreateFees", but data does not satisfy any constructor');
}

export function storeBlockCreateFees(blockCreateFees: BlockCreateFees): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x6b, 8);
        builder.storeCoins(blockCreateFees.masterchain_block_fee);
        builder.storeCoins(blockCreateFees.basechain_block_fee);
    })

}

/*
_#cc utime_since:uint32 bit_price_ps:uint64 cell_price_ps:uint64
  mc_bit_price_ps:uint64 mc_cell_price_ps:uint64 = StoragePrices;
*/

export function loadStoragePrices(slice: Slice): StoragePrices {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xcc))) {
        slice.loadUint(8);
        let utime_since: number = slice.loadUint(32);
        let bit_price_ps: bigint = slice.loadUintBig(64);
        let _cell_price_ps: bigint = slice.loadUintBig(64);
        let mc_bit_price_ps: bigint = slice.loadUintBig(64);
        let mc_cell_price_ps: bigint = slice.loadUintBig(64);
        return {
            kind: 'StoragePrices',
            utime_since: utime_since,
            bit_price_ps: bit_price_ps,
            _cell_price_ps: _cell_price_ps,
            mc_bit_price_ps: mc_bit_price_ps,
            mc_cell_price_ps: mc_cell_price_ps,
        }

    }
    throw new Error('Expected one of "StoragePrices" in loading "StoragePrices", but data does not satisfy any constructor');
}

export function storeStoragePrices(storagePrices: StoragePrices): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0xcc, 8);
        builder.storeUint(storagePrices.utime_since, 32);
        builder.storeUint(storagePrices.bit_price_ps, 64);
        builder.storeUint(storagePrices._cell_price_ps, 64);
        builder.storeUint(storagePrices.mc_bit_price_ps, 64);
        builder.storeUint(storagePrices.mc_cell_price_ps, 64);
    })

}

/*
gas_prices#dd gas_price:uint64 gas_limit:uint64 gas_credit:uint64
  block_gas_limit:uint64 freeze_due_limit:uint64 delete_due_limit:uint64
  = GasLimitsPrices;
*/

/*
gas_prices_ext#de gas_price:uint64 gas_limit:uint64 special_gas_limit:uint64 gas_credit:uint64
  block_gas_limit:uint64 freeze_due_limit:uint64 delete_due_limit:uint64
  = GasLimitsPrices;
*/

/*
gas_flat_pfx#d1 flat_gas_limit:uint64 flat_gas_price:uint64 other:GasLimitsPrices
  = GasLimitsPrices;
*/

export function loadGasLimitsPrices(slice: Slice): GasLimitsPrices {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xdd))) {
        slice.loadUint(8);
        let gas_price: bigint = slice.loadUintBig(64);
        let gas_limit: bigint = slice.loadUintBig(64);
        let gas_credit: bigint = slice.loadUintBig(64);
        let block_gas_limit: bigint = slice.loadUintBig(64);
        let freeze_due_limit: bigint = slice.loadUintBig(64);
        let delete_due_limit: bigint = slice.loadUintBig(64);
        return {
            kind: 'GasLimitsPrices_gas_prices',
            gas_price: gas_price,
            gas_limit: gas_limit,
            gas_credit: gas_credit,
            block_gas_limit: block_gas_limit,
            freeze_due_limit: freeze_due_limit,
            delete_due_limit: delete_due_limit,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xde))) {
        slice.loadUint(8);
        let gas_price: bigint = slice.loadUintBig(64);
        let gas_limit: bigint = slice.loadUintBig(64);
        let special_gas_limit: bigint = slice.loadUintBig(64);
        let gas_credit: bigint = slice.loadUintBig(64);
        let block_gas_limit: bigint = slice.loadUintBig(64);
        let freeze_due_limit: bigint = slice.loadUintBig(64);
        let delete_due_limit: bigint = slice.loadUintBig(64);
        return {
            kind: 'GasLimitsPrices_gas_prices_ext',
            gas_price: gas_price,
            gas_limit: gas_limit,
            special_gas_limit: special_gas_limit,
            gas_credit: gas_credit,
            block_gas_limit: block_gas_limit,
            freeze_due_limit: freeze_due_limit,
            delete_due_limit: delete_due_limit,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xd1))) {
        slice.loadUint(8);
        let flat_gas_limit: bigint = slice.loadUintBig(64);
        let flat_gas_price: bigint = slice.loadUintBig(64);
        let other: GasLimitsPrices = loadGasLimitsPrices(slice);
        return {
            kind: 'GasLimitsPrices_gas_flat_pfx',
            flat_gas_limit: flat_gas_limit,
            flat_gas_price: flat_gas_price,
            other: other,
        }

    }
    throw new Error('Expected one of "GasLimitsPrices_gas_prices", "GasLimitsPrices_gas_prices_ext", "GasLimitsPrices_gas_flat_pfx" in loading "GasLimitsPrices", but data does not satisfy any constructor');
}

export function storeGasLimitsPrices(gasLimitsPrices: GasLimitsPrices): (builder: Builder) => void {
    if ((gasLimitsPrices.kind == 'GasLimitsPrices_gas_prices')) {
        return ((builder: Builder) => {
            builder.storeUint(0xdd, 8);
            builder.storeUint(gasLimitsPrices.gas_price, 64);
            builder.storeUint(gasLimitsPrices.gas_limit, 64);
            builder.storeUint(gasLimitsPrices.gas_credit, 64);
            builder.storeUint(gasLimitsPrices.block_gas_limit, 64);
            builder.storeUint(gasLimitsPrices.freeze_due_limit, 64);
            builder.storeUint(gasLimitsPrices.delete_due_limit, 64);
        })

    }
    if ((gasLimitsPrices.kind == 'GasLimitsPrices_gas_prices_ext')) {
        return ((builder: Builder) => {
            builder.storeUint(0xde, 8);
            builder.storeUint(gasLimitsPrices.gas_price, 64);
            builder.storeUint(gasLimitsPrices.gas_limit, 64);
            builder.storeUint(gasLimitsPrices.special_gas_limit, 64);
            builder.storeUint(gasLimitsPrices.gas_credit, 64);
            builder.storeUint(gasLimitsPrices.block_gas_limit, 64);
            builder.storeUint(gasLimitsPrices.freeze_due_limit, 64);
            builder.storeUint(gasLimitsPrices.delete_due_limit, 64);
        })

    }
    if ((gasLimitsPrices.kind == 'GasLimitsPrices_gas_flat_pfx')) {
        return ((builder: Builder) => {
            builder.storeUint(0xd1, 8);
            builder.storeUint(gasLimitsPrices.flat_gas_limit, 64);
            builder.storeUint(gasLimitsPrices.flat_gas_price, 64);
            storeGasLimitsPrices(gasLimitsPrices.other)(builder);
        })

    }
    throw new Error('Expected one of "GasLimitsPrices_gas_prices", "GasLimitsPrices_gas_prices_ext", "GasLimitsPrices_gas_flat_pfx" in loading "GasLimitsPrices", but data does not satisfy any constructor');
}

/*
param_limits#c3 underload:# soft_limit:# { underload <= soft_limit }
  hard_limit:# { soft_limit <= hard_limit } = ParamLimits;
*/

export function loadParamLimits(slice: Slice): ParamLimits {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xc3))) {
        slice.loadUint(8);
        let underload: number = slice.loadUint(32);
        let soft_limit: number = slice.loadUint(32);
        let hard_limit: number = slice.loadUint(32);
        if ((!(underload <= soft_limit))) {
            throw new Error('Condition (underload <= soft_limit) is not satisfied while loading "ParamLimits" for type "ParamLimits"');
        }
        if ((!(soft_limit <= hard_limit))) {
            throw new Error('Condition (soft_limit <= hard_limit) is not satisfied while loading "ParamLimits" for type "ParamLimits"');
        }
        return {
            kind: 'ParamLimits',
            underload: underload,
            soft_limit: soft_limit,
            hard_limit: hard_limit,
        }

    }
    throw new Error('Expected one of "ParamLimits" in loading "ParamLimits", but data does not satisfy any constructor');
}

export function storeParamLimits(paramLimits: ParamLimits): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0xc3, 8);
        builder.storeUint(paramLimits.underload, 32);
        builder.storeUint(paramLimits.soft_limit, 32);
        builder.storeUint(paramLimits.hard_limit, 32);
        if ((!(paramLimits.underload <= paramLimits.soft_limit))) {
            throw new Error('Condition (paramLimits.underload <= paramLimits.soft_limit) is not satisfied while loading "ParamLimits" for type "ParamLimits"');
        }
        if ((!(paramLimits.soft_limit <= paramLimits.hard_limit))) {
            throw new Error('Condition (paramLimits.soft_limit <= paramLimits.hard_limit) is not satisfied while loading "ParamLimits" for type "ParamLimits"');
        }
    })

}

/*
block_limits#5d bytes:ParamLimits gas:ParamLimits lt_delta:ParamLimits
  = BlockLimits;
*/

export function loadBlockLimits(slice: Slice): BlockLimits {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x5d))) {
        slice.loadUint(8);
        let bytes: ParamLimits = loadParamLimits(slice);
        let gas: ParamLimits = loadParamLimits(slice);
        let lt_delta: ParamLimits = loadParamLimits(slice);
        return {
            kind: 'BlockLimits',
            bytes: bytes,
            gas: gas,
            lt_delta: lt_delta,
        }

    }
    throw new Error('Expected one of "BlockLimits" in loading "BlockLimits", but data does not satisfy any constructor');
}

export function storeBlockLimits(blockLimits: BlockLimits): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x5d, 8);
        storeParamLimits(blockLimits.bytes)(builder);
        storeParamLimits(blockLimits.gas)(builder);
        storeParamLimits(blockLimits.lt_delta)(builder);
    })

}

/*
msg_forward_prices#ea lump_price:uint64 bit_price:uint64 cell_price:uint64
  ihr_price_factor:uint32 first_frac:uint16 next_frac:uint16 = MsgForwardPrices;
*/

export function loadMsgForwardPrices(slice: Slice): MsgForwardPrices {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xea))) {
        slice.loadUint(8);
        let lump_price: bigint = slice.loadUintBig(64);
        let bit_price: bigint = slice.loadUintBig(64);
        let _cell_price: bigint = slice.loadUintBig(64);
        let ihr_price_factor: number = slice.loadUint(32);
        let first_frac: number = slice.loadUint(16);
        let next_frac: number = slice.loadUint(16);
        return {
            kind: 'MsgForwardPrices',
            lump_price: lump_price,
            bit_price: bit_price,
            _cell_price: _cell_price,
            ihr_price_factor: ihr_price_factor,
            first_frac: first_frac,
            next_frac: next_frac,
        }

    }
    throw new Error('Expected one of "MsgForwardPrices" in loading "MsgForwardPrices", but data does not satisfy any constructor');
}

export function storeMsgForwardPrices(msgForwardPrices: MsgForwardPrices): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0xea, 8);
        builder.storeUint(msgForwardPrices.lump_price, 64);
        builder.storeUint(msgForwardPrices.bit_price, 64);
        builder.storeUint(msgForwardPrices._cell_price, 64);
        builder.storeUint(msgForwardPrices.ihr_price_factor, 32);
        builder.storeUint(msgForwardPrices.first_frac, 16);
        builder.storeUint(msgForwardPrices.next_frac, 16);
    })

}

/*
catchain_config#c1 mc_catchain_lifetime:uint32 shard_catchain_lifetime:uint32
  shard_validators_lifetime:uint32 shard_validators_num:uint32 = CatchainConfig;
*/

/*
catchain_config_new#c2 flags:(## 7) { flags = 0 } shuffle_mc_validators:Bool
  mc_catchain_lifetime:uint32 shard_catchain_lifetime:uint32
  shard_validators_lifetime:uint32 shard_validators_num:uint32 = CatchainConfig;
*/

export function loadCatchainConfig(slice: Slice): CatchainConfig {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xc1))) {
        slice.loadUint(8);
        let mc_catchain_lifetime: number = slice.loadUint(32);
        let shard_catchain_lifetime: number = slice.loadUint(32);
        let shard_validators_lifetime: number = slice.loadUint(32);
        let shard_validators_num: number = slice.loadUint(32);
        return {
            kind: 'CatchainConfig_catchain_config',
            mc_catchain_lifetime: mc_catchain_lifetime,
            shard_catchain_lifetime: shard_catchain_lifetime,
            shard_validators_lifetime: shard_validators_lifetime,
            shard_validators_num: shard_validators_num,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xc2))) {
        slice.loadUint(8);
        let flags: number = slice.loadUint(7);
        let shuffle_mc_validators: Bool = loadBool(slice);
        let mc_catchain_lifetime: number = slice.loadUint(32);
        let shard_catchain_lifetime: number = slice.loadUint(32);
        let shard_validators_lifetime: number = slice.loadUint(32);
        let shard_validators_num: number = slice.loadUint(32);
        if ((!(flags == 0))) {
            throw new Error('Condition (flags == 0) is not satisfied while loading "CatchainConfig_catchain_config_new" for type "CatchainConfig"');
        }
        return {
            kind: 'CatchainConfig_catchain_config_new',
            flags: flags,
            shuffle_mc_validators: shuffle_mc_validators,
            mc_catchain_lifetime: mc_catchain_lifetime,
            shard_catchain_lifetime: shard_catchain_lifetime,
            shard_validators_lifetime: shard_validators_lifetime,
            shard_validators_num: shard_validators_num,
        }

    }
    throw new Error('Expected one of "CatchainConfig_catchain_config", "CatchainConfig_catchain_config_new" in loading "CatchainConfig", but data does not satisfy any constructor');
}

export function storeCatchainConfig(catchainConfig: CatchainConfig): (builder: Builder) => void {
    if ((catchainConfig.kind == 'CatchainConfig_catchain_config')) {
        return ((builder: Builder) => {
            builder.storeUint(0xc1, 8);
            builder.storeUint(catchainConfig.mc_catchain_lifetime, 32);
            builder.storeUint(catchainConfig.shard_catchain_lifetime, 32);
            builder.storeUint(catchainConfig.shard_validators_lifetime, 32);
            builder.storeUint(catchainConfig.shard_validators_num, 32);
        })

    }
    if ((catchainConfig.kind == 'CatchainConfig_catchain_config_new')) {
        return ((builder: Builder) => {
            builder.storeUint(0xc2, 8);
            builder.storeUint(catchainConfig.flags, 7);
            storeBool(catchainConfig.shuffle_mc_validators)(builder);
            builder.storeUint(catchainConfig.mc_catchain_lifetime, 32);
            builder.storeUint(catchainConfig.shard_catchain_lifetime, 32);
            builder.storeUint(catchainConfig.shard_validators_lifetime, 32);
            builder.storeUint(catchainConfig.shard_validators_num, 32);
            if ((!(catchainConfig.flags == 0))) {
                throw new Error('Condition (catchainConfig.flags == 0) is not satisfied while loading "CatchainConfig_catchain_config_new" for type "CatchainConfig"');
            }
        })

    }
    throw new Error('Expected one of "CatchainConfig_catchain_config", "CatchainConfig_catchain_config_new" in loading "CatchainConfig", but data does not satisfy any constructor');
}

/*
consensus_config#d6 round_candidates:# { round_candidates >= 1 }
  next_candidate_delay_ms:uint32 consensus_timeout_ms:uint32
  fast_attempts:uint32 attempt_duration:uint32 catchain_max_deps:uint32
  max_block_bytes:uint32 max_collated_bytes:uint32 = ConsensusConfig;
*/

/*
consensus_config_new#d7 flags:(## 7) { flags = 0 } new_catchain_ids:Bool
  round_candidates:(## 8) { round_candidates >= 1 }
  next_candidate_delay_ms:uint32 consensus_timeout_ms:uint32
  fast_attempts:uint32 attempt_duration:uint32 catchain_max_deps:uint32
  max_block_bytes:uint32 max_collated_bytes:uint32 = ConsensusConfig;
*/

/*
consensus_config_v3#d8 flags:(## 7) { flags = 0 } new_catchain_ids:Bool
  round_candidates:(## 8) { round_candidates >= 1 }
  next_candidate_delay_ms:uint32 consensus_timeout_ms:uint32
  fast_attempts:uint32 attempt_duration:uint32 catchain_max_deps:uint32
  max_block_bytes:uint32 max_collated_bytes:uint32
  proto_version:uint16 = ConsensusConfig;
*/

/*
consensus_config_v4#d9 flags:(## 7) { flags = 0 } new_catchain_ids:Bool
  round_candidates:(## 8) { round_candidates >= 1 }
  next_candidate_delay_ms:uint32 consensus_timeout_ms:uint32
  fast_attempts:uint32 attempt_duration:uint32 catchain_max_deps:uint32
  max_block_bytes:uint32 max_collated_bytes:uint32
  proto_version:uint16 catchain_max_blocks_coeff:uint32 = ConsensusConfig;
*/

export function loadConsensusConfig(slice: Slice): ConsensusConfig {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xd6))) {
        slice.loadUint(8);
        let round_candidates: number = slice.loadUint(32);
        let next_candidate_delay_ms: number = slice.loadUint(32);
        let consensus_timeout_ms: number = slice.loadUint(32);
        let fast_attempts: number = slice.loadUint(32);
        let attempt_duration: number = slice.loadUint(32);
        let catchain_max_deps: number = slice.loadUint(32);
        let max_block_bytes: number = slice.loadUint(32);
        let max_collated_bytes: number = slice.loadUint(32);
        if ((!(round_candidates >= 1))) {
            throw new Error('Condition (round_candidates >= 1) is not satisfied while loading "ConsensusConfig_consensus_config" for type "ConsensusConfig"');
        }
        return {
            kind: 'ConsensusConfig_consensus_config',
            round_candidates: round_candidates,
            next_candidate_delay_ms: next_candidate_delay_ms,
            consensus_timeout_ms: consensus_timeout_ms,
            fast_attempts: fast_attempts,
            attempt_duration: attempt_duration,
            catchain_max_deps: catchain_max_deps,
            max_block_bytes: max_block_bytes,
            max_collated_bytes: max_collated_bytes,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xd7))) {
        slice.loadUint(8);
        let flags: number = slice.loadUint(7);
        let new_catchain_ids: Bool = loadBool(slice);
        let round_candidates: number = slice.loadUint(8);
        let next_candidate_delay_ms: number = slice.loadUint(32);
        let consensus_timeout_ms: number = slice.loadUint(32);
        let fast_attempts: number = slice.loadUint(32);
        let attempt_duration: number = slice.loadUint(32);
        let catchain_max_deps: number = slice.loadUint(32);
        let max_block_bytes: number = slice.loadUint(32);
        let max_collated_bytes: number = slice.loadUint(32);
        if ((!(flags == 0))) {
            throw new Error('Condition (flags == 0) is not satisfied while loading "ConsensusConfig_consensus_config_new" for type "ConsensusConfig"');
        }
        if ((!(round_candidates >= 1))) {
            throw new Error('Condition (round_candidates >= 1) is not satisfied while loading "ConsensusConfig_consensus_config_new" for type "ConsensusConfig"');
        }
        return {
            kind: 'ConsensusConfig_consensus_config_new',
            flags: flags,
            new_catchain_ids: new_catchain_ids,
            round_candidates: round_candidates,
            next_candidate_delay_ms: next_candidate_delay_ms,
            consensus_timeout_ms: consensus_timeout_ms,
            fast_attempts: fast_attempts,
            attempt_duration: attempt_duration,
            catchain_max_deps: catchain_max_deps,
            max_block_bytes: max_block_bytes,
            max_collated_bytes: max_collated_bytes,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xd8))) {
        slice.loadUint(8);
        let flags: number = slice.loadUint(7);
        let new_catchain_ids: Bool = loadBool(slice);
        let round_candidates: number = slice.loadUint(8);
        let next_candidate_delay_ms: number = slice.loadUint(32);
        let consensus_timeout_ms: number = slice.loadUint(32);
        let fast_attempts: number = slice.loadUint(32);
        let attempt_duration: number = slice.loadUint(32);
        let catchain_max_deps: number = slice.loadUint(32);
        let max_block_bytes: number = slice.loadUint(32);
        let max_collated_bytes: number = slice.loadUint(32);
        let proto_version: number = slice.loadUint(16);
        if ((!(flags == 0))) {
            throw new Error('Condition (flags == 0) is not satisfied while loading "ConsensusConfig_consensus_config_v3" for type "ConsensusConfig"');
        }
        if ((!(round_candidates >= 1))) {
            throw new Error('Condition (round_candidates >= 1) is not satisfied while loading "ConsensusConfig_consensus_config_v3" for type "ConsensusConfig"');
        }
        return {
            kind: 'ConsensusConfig_consensus_config_v3',
            flags: flags,
            new_catchain_ids: new_catchain_ids,
            round_candidates: round_candidates,
            next_candidate_delay_ms: next_candidate_delay_ms,
            consensus_timeout_ms: consensus_timeout_ms,
            fast_attempts: fast_attempts,
            attempt_duration: attempt_duration,
            catchain_max_deps: catchain_max_deps,
            max_block_bytes: max_block_bytes,
            max_collated_bytes: max_collated_bytes,
            proto_version: proto_version,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xd9))) {
        slice.loadUint(8);
        let flags: number = slice.loadUint(7);
        let new_catchain_ids: Bool = loadBool(slice);
        let round_candidates: number = slice.loadUint(8);
        let next_candidate_delay_ms: number = slice.loadUint(32);
        let consensus_timeout_ms: number = slice.loadUint(32);
        let fast_attempts: number = slice.loadUint(32);
        let attempt_duration: number = slice.loadUint(32);
        let catchain_max_deps: number = slice.loadUint(32);
        let max_block_bytes: number = slice.loadUint(32);
        let max_collated_bytes: number = slice.loadUint(32);
        let proto_version: number = slice.loadUint(16);
        let catchain_max_blocks_coeff: number = slice.loadUint(32);
        if ((!(flags == 0))) {
            throw new Error('Condition (flags == 0) is not satisfied while loading "ConsensusConfig_consensus_config_v4" for type "ConsensusConfig"');
        }
        if ((!(round_candidates >= 1))) {
            throw new Error('Condition (round_candidates >= 1) is not satisfied while loading "ConsensusConfig_consensus_config_v4" for type "ConsensusConfig"');
        }
        return {
            kind: 'ConsensusConfig_consensus_config_v4',
            flags: flags,
            new_catchain_ids: new_catchain_ids,
            round_candidates: round_candidates,
            next_candidate_delay_ms: next_candidate_delay_ms,
            consensus_timeout_ms: consensus_timeout_ms,
            fast_attempts: fast_attempts,
            attempt_duration: attempt_duration,
            catchain_max_deps: catchain_max_deps,
            max_block_bytes: max_block_bytes,
            max_collated_bytes: max_collated_bytes,
            proto_version: proto_version,
            catchain_max_blocks_coeff: catchain_max_blocks_coeff,
        }

    }
    throw new Error('Expected one of "ConsensusConfig_consensus_config", "ConsensusConfig_consensus_config_new", "ConsensusConfig_consensus_config_v3", "ConsensusConfig_consensus_config_v4" in loading "ConsensusConfig", but data does not satisfy any constructor');
}

export function storeConsensusConfig(consensusConfig: ConsensusConfig): (builder: Builder) => void {
    if ((consensusConfig.kind == 'ConsensusConfig_consensus_config')) {
        return ((builder: Builder) => {
            builder.storeUint(0xd6, 8);
            builder.storeUint(consensusConfig.round_candidates, 32);
            builder.storeUint(consensusConfig.next_candidate_delay_ms, 32);
            builder.storeUint(consensusConfig.consensus_timeout_ms, 32);
            builder.storeUint(consensusConfig.fast_attempts, 32);
            builder.storeUint(consensusConfig.attempt_duration, 32);
            builder.storeUint(consensusConfig.catchain_max_deps, 32);
            builder.storeUint(consensusConfig.max_block_bytes, 32);
            builder.storeUint(consensusConfig.max_collated_bytes, 32);
            if ((!(consensusConfig.round_candidates >= 1))) {
                throw new Error('Condition (consensusConfig.round_candidates >= 1) is not satisfied while loading "ConsensusConfig_consensus_config" for type "ConsensusConfig"');
            }
        })

    }
    if ((consensusConfig.kind == 'ConsensusConfig_consensus_config_new')) {
        return ((builder: Builder) => {
            builder.storeUint(0xd7, 8);
            builder.storeUint(consensusConfig.flags, 7);
            storeBool(consensusConfig.new_catchain_ids)(builder);
            builder.storeUint(consensusConfig.round_candidates, 8);
            builder.storeUint(consensusConfig.next_candidate_delay_ms, 32);
            builder.storeUint(consensusConfig.consensus_timeout_ms, 32);
            builder.storeUint(consensusConfig.fast_attempts, 32);
            builder.storeUint(consensusConfig.attempt_duration, 32);
            builder.storeUint(consensusConfig.catchain_max_deps, 32);
            builder.storeUint(consensusConfig.max_block_bytes, 32);
            builder.storeUint(consensusConfig.max_collated_bytes, 32);
            if ((!(consensusConfig.flags == 0))) {
                throw new Error('Condition (consensusConfig.flags == 0) is not satisfied while loading "ConsensusConfig_consensus_config_new" for type "ConsensusConfig"');
            }
            if ((!(consensusConfig.round_candidates >= 1))) {
                throw new Error('Condition (consensusConfig.round_candidates >= 1) is not satisfied while loading "ConsensusConfig_consensus_config_new" for type "ConsensusConfig"');
            }
        })

    }
    if ((consensusConfig.kind == 'ConsensusConfig_consensus_config_v3')) {
        return ((builder: Builder) => {
            builder.storeUint(0xd8, 8);
            builder.storeUint(consensusConfig.flags, 7);
            storeBool(consensusConfig.new_catchain_ids)(builder);
            builder.storeUint(consensusConfig.round_candidates, 8);
            builder.storeUint(consensusConfig.next_candidate_delay_ms, 32);
            builder.storeUint(consensusConfig.consensus_timeout_ms, 32);
            builder.storeUint(consensusConfig.fast_attempts, 32);
            builder.storeUint(consensusConfig.attempt_duration, 32);
            builder.storeUint(consensusConfig.catchain_max_deps, 32);
            builder.storeUint(consensusConfig.max_block_bytes, 32);
            builder.storeUint(consensusConfig.max_collated_bytes, 32);
            builder.storeUint(consensusConfig.proto_version, 16);
            if ((!(consensusConfig.flags == 0))) {
                throw new Error('Condition (consensusConfig.flags == 0) is not satisfied while loading "ConsensusConfig_consensus_config_v3" for type "ConsensusConfig"');
            }
            if ((!(consensusConfig.round_candidates >= 1))) {
                throw new Error('Condition (consensusConfig.round_candidates >= 1) is not satisfied while loading "ConsensusConfig_consensus_config_v3" for type "ConsensusConfig"');
            }
        })

    }
    if ((consensusConfig.kind == 'ConsensusConfig_consensus_config_v4')) {
        return ((builder: Builder) => {
            builder.storeUint(0xd9, 8);
            builder.storeUint(consensusConfig.flags, 7);
            storeBool(consensusConfig.new_catchain_ids)(builder);
            builder.storeUint(consensusConfig.round_candidates, 8);
            builder.storeUint(consensusConfig.next_candidate_delay_ms, 32);
            builder.storeUint(consensusConfig.consensus_timeout_ms, 32);
            builder.storeUint(consensusConfig.fast_attempts, 32);
            builder.storeUint(consensusConfig.attempt_duration, 32);
            builder.storeUint(consensusConfig.catchain_max_deps, 32);
            builder.storeUint(consensusConfig.max_block_bytes, 32);
            builder.storeUint(consensusConfig.max_collated_bytes, 32);
            builder.storeUint(consensusConfig.proto_version, 16);
            builder.storeUint(consensusConfig.catchain_max_blocks_coeff, 32);
            if ((!(consensusConfig.flags == 0))) {
                throw new Error('Condition (consensusConfig.flags == 0) is not satisfied while loading "ConsensusConfig_consensus_config_v4" for type "ConsensusConfig"');
            }
            if ((!(consensusConfig.round_candidates >= 1))) {
                throw new Error('Condition (consensusConfig.round_candidates >= 1) is not satisfied while loading "ConsensusConfig_consensus_config_v4" for type "ConsensusConfig"');
            }
        })

    }
    throw new Error('Expected one of "ConsensusConfig_consensus_config", "ConsensusConfig_consensus_config_new", "ConsensusConfig_consensus_config_v3", "ConsensusConfig_consensus_config_v4" in loading "ConsensusConfig", but data does not satisfy any constructor');
}

// validator_temp_key#3 adnl_addr:bits256 temp_public_key:SigPubKey seqno:# valid_until:uint32 = ValidatorTempKey;

export function loadValidatorTempKey(slice: Slice): ValidatorTempKey {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0x3))) {
        slice.loadUint(4);
        let adnl_addr: Buffer = slice.loadBuffer((256 / 8));
        let temp_public_key: SigPubKey = loadSigPubKey(slice);
        let seqno: number = slice.loadUint(32);
        let valid_until: number = slice.loadUint(32);
        return {
            kind: 'ValidatorTempKey',
            adnl_addr: adnl_addr,
            temp_public_key: temp_public_key,
            seqno: seqno,
            valid_until: valid_until,
        }

    }
    throw new Error('Expected one of "ValidatorTempKey" in loading "ValidatorTempKey", but data does not satisfy any constructor');
}

export function storeValidatorTempKey(validatorTempKey: ValidatorTempKey): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x3, 4);
        builder.storeBuffer(validatorTempKey.adnl_addr, (256 / 8));
        storeSigPubKey(validatorTempKey.temp_public_key)(builder);
        builder.storeUint(validatorTempKey.seqno, 32);
        builder.storeUint(validatorTempKey.valid_until, 32);
    })

}

// signed_temp_key#4 key:^ValidatorTempKey signature:CryptoSignature = ValidatorSignedTempKey;

export function loadValidatorSignedTempKey(slice: Slice): ValidatorSignedTempKey {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0x4))) {
        slice.loadUint(4);
        let slice1 = slice.loadRef().beginParse(true);
        let key: ValidatorTempKey = loadValidatorTempKey(slice1);
        let signature: CryptoSignature = loadCryptoSignature(slice);
        return {
            kind: 'ValidatorSignedTempKey',
            key: key,
            signature: signature,
        }

    }
    throw new Error('Expected one of "ValidatorSignedTempKey" in loading "ValidatorSignedTempKey", but data does not satisfy any constructor');
}

export function storeValidatorSignedTempKey(validatorSignedTempKey: ValidatorSignedTempKey): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x4, 4);
        let cell1 = beginCell();
        storeValidatorTempKey(validatorSignedTempKey.key)(cell1);
        builder.storeRef(cell1);
        storeCryptoSignature(validatorSignedTempKey.signature)(builder);
    })

}

/*
misbehaviour_punishment_config_v1#01
  default_flat_fine:Grams default_proportional_fine:uint32
  severity_flat_mult:uint16 severity_proportional_mult:uint16
  unpunishable_interval:uint16
  long_interval:uint16 long_flat_mult:uint16 long_proportional_mult:uint16
  medium_interval:uint16 medium_flat_mult:uint16 medium_proportional_mult:uint16
   = MisbehaviourPunishmentConfig;
*/

export function loadMisbehaviourPunishmentConfig(slice: Slice): MisbehaviourPunishmentConfig {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x01))) {
        slice.loadUint(8);
        let default_flat_fine: bigint = slice.loadCoins();
        let default_proportional_fine: number = slice.loadUint(32);
        let severity_flat_mult: number = slice.loadUint(16);
        let severity_proportional_mult: number = slice.loadUint(16);
        let unpunishable_interval: number = slice.loadUint(16);
        let long_interval: number = slice.loadUint(16);
        let long_flat_mult: number = slice.loadUint(16);
        let long_proportional_mult: number = slice.loadUint(16);
        let medium_interval: number = slice.loadUint(16);
        let medium_flat_mult: number = slice.loadUint(16);
        let medium_proportional_mult: number = slice.loadUint(16);
        return {
            kind: 'MisbehaviourPunishmentConfig',
            default_flat_fine: default_flat_fine,
            default_proportional_fine: default_proportional_fine,
            severity_flat_mult: severity_flat_mult,
            severity_proportional_mult: severity_proportional_mult,
            unpunishable_interval: unpunishable_interval,
            long_interval: long_interval,
            long_flat_mult: long_flat_mult,
            long_proportional_mult: long_proportional_mult,
            medium_interval: medium_interval,
            medium_flat_mult: medium_flat_mult,
            medium_proportional_mult: medium_proportional_mult,
        }

    }
    throw new Error('Expected one of "MisbehaviourPunishmentConfig" in loading "MisbehaviourPunishmentConfig", but data does not satisfy any constructor');
}

export function storeMisbehaviourPunishmentConfig(misbehaviourPunishmentConfig: MisbehaviourPunishmentConfig): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x01, 8);
        builder.storeCoins(misbehaviourPunishmentConfig.default_flat_fine);
        builder.storeUint(misbehaviourPunishmentConfig.default_proportional_fine, 32);
        builder.storeUint(misbehaviourPunishmentConfig.severity_flat_mult, 16);
        builder.storeUint(misbehaviourPunishmentConfig.severity_proportional_mult, 16);
        builder.storeUint(misbehaviourPunishmentConfig.unpunishable_interval, 16);
        builder.storeUint(misbehaviourPunishmentConfig.long_interval, 16);
        builder.storeUint(misbehaviourPunishmentConfig.long_flat_mult, 16);
        builder.storeUint(misbehaviourPunishmentConfig.long_proportional_mult, 16);
        builder.storeUint(misbehaviourPunishmentConfig.medium_interval, 16);
        builder.storeUint(misbehaviourPunishmentConfig.medium_flat_mult, 16);
        builder.storeUint(misbehaviourPunishmentConfig.medium_proportional_mult, 16);
    })

}

/*
size_limits_config#01 max_msg_bits:uint32 max_msg_cells:uint32 max_library_cells:uint32 max_vm_data_depth:uint16
  max_ext_msg_size:uint32 max_ext_msg_depth:uint16 = SizeLimitsConfig;
*/

/*
size_limits_config_v2#02 max_msg_bits:uint32 max_msg_cells:uint32 max_library_cells:uint32 max_vm_data_depth:uint16
  max_ext_msg_size:uint32 max_ext_msg_depth:uint16 max_acc_state_cells:uint32 max_acc_state_bits:uint32
  max_acc_public_libraries:uint32 defer_out_queue_size_limit:uint32 max_msg_extra_currencies:uint32
  max_acc_fixed_prefix_length:uint8 = SizeLimitsConfig;
*/

export function loadSizeLimitsConfig(slice: Slice): SizeLimitsConfig {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x01))) {
        slice.loadUint(8);
        let max_msg_bits: number = slice.loadUint(32);
        let max_msg_cells: number = slice.loadUint(32);
        let max_library_cells: number = slice.loadUint(32);
        let max_vm_data_depth: number = slice.loadUint(16);
        let max_ext_msg_size: number = slice.loadUint(32);
        let max_ext_msg_depth: number = slice.loadUint(16);
        return {
            kind: 'SizeLimitsConfig_size_limits_config',
            max_msg_bits: max_msg_bits,
            max_msg_cells: max_msg_cells,
            max_library_cells: max_library_cells,
            max_vm_data_depth: max_vm_data_depth,
            max_ext_msg_size: max_ext_msg_size,
            max_ext_msg_depth: max_ext_msg_depth,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x02))) {
        slice.loadUint(8);
        let max_msg_bits: number = slice.loadUint(32);
        let max_msg_cells: number = slice.loadUint(32);
        let max_library_cells: number = slice.loadUint(32);
        let max_vm_data_depth: number = slice.loadUint(16);
        let max_ext_msg_size: number = slice.loadUint(32);
        let max_ext_msg_depth: number = slice.loadUint(16);
        let max_acc_state_cells: number = slice.loadUint(32);
        let max_acc_state_bits: number = slice.loadUint(32);
        let max_acc_public_libraries: number = slice.loadUint(32);
        let defer_out_queue_size_limit: number = slice.loadUint(32);
        let max_msg_extra_currencies: number = slice.loadUint(32);
        let max_acc_fixed_prefix_length: number = slice.loadUint(8);
        return {
            kind: 'SizeLimitsConfig_size_limits_config_v2',
            max_msg_bits: max_msg_bits,
            max_msg_cells: max_msg_cells,
            max_library_cells: max_library_cells,
            max_vm_data_depth: max_vm_data_depth,
            max_ext_msg_size: max_ext_msg_size,
            max_ext_msg_depth: max_ext_msg_depth,
            max_acc_state_cells: max_acc_state_cells,
            max_acc_state_bits: max_acc_state_bits,
            max_acc_public_libraries: max_acc_public_libraries,
            defer_out_queue_size_limit: defer_out_queue_size_limit,
            max_msg_extra_currencies: max_msg_extra_currencies,
            max_acc_fixed_prefix_length: max_acc_fixed_prefix_length,
        }

    }
    throw new Error('Expected one of "SizeLimitsConfig_size_limits_config", "SizeLimitsConfig_size_limits_config_v2" in loading "SizeLimitsConfig", but data does not satisfy any constructor');
}

export function storeSizeLimitsConfig(sizeLimitsConfig: SizeLimitsConfig): (builder: Builder) => void {
    if ((sizeLimitsConfig.kind == 'SizeLimitsConfig_size_limits_config')) {
        return ((builder: Builder) => {
            builder.storeUint(0x01, 8);
            builder.storeUint(sizeLimitsConfig.max_msg_bits, 32);
            builder.storeUint(sizeLimitsConfig.max_msg_cells, 32);
            builder.storeUint(sizeLimitsConfig.max_library_cells, 32);
            builder.storeUint(sizeLimitsConfig.max_vm_data_depth, 16);
            builder.storeUint(sizeLimitsConfig.max_ext_msg_size, 32);
            builder.storeUint(sizeLimitsConfig.max_ext_msg_depth, 16);
        })

    }
    if ((sizeLimitsConfig.kind == 'SizeLimitsConfig_size_limits_config_v2')) {
        return ((builder: Builder) => {
            builder.storeUint(0x02, 8);
            builder.storeUint(sizeLimitsConfig.max_msg_bits, 32);
            builder.storeUint(sizeLimitsConfig.max_msg_cells, 32);
            builder.storeUint(sizeLimitsConfig.max_library_cells, 32);
            builder.storeUint(sizeLimitsConfig.max_vm_data_depth, 16);
            builder.storeUint(sizeLimitsConfig.max_ext_msg_size, 32);
            builder.storeUint(sizeLimitsConfig.max_ext_msg_depth, 16);
            builder.storeUint(sizeLimitsConfig.max_acc_state_cells, 32);
            builder.storeUint(sizeLimitsConfig.max_acc_state_bits, 32);
            builder.storeUint(sizeLimitsConfig.max_acc_public_libraries, 32);
            builder.storeUint(sizeLimitsConfig.defer_out_queue_size_limit, 32);
            builder.storeUint(sizeLimitsConfig.max_msg_extra_currencies, 32);
            builder.storeUint(sizeLimitsConfig.max_acc_fixed_prefix_length, 8);
        })

    }
    throw new Error('Expected one of "SizeLimitsConfig_size_limits_config", "SizeLimitsConfig_size_limits_config_v2" in loading "SizeLimitsConfig", but data does not satisfy any constructor');
}

// suspended_address_list#00 addresses:(HashmapE 288 Unit) suspended_until:uint32 = SuspendedAddressList;

export function loadSuspendedAddressList(slice: Slice): SuspendedAddressList {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x00))) {
        slice.loadUint(8);
        let addresses: Dictionary<bigint, Unit> = Dictionary.load(Dictionary.Keys.BigUint(288), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadUnit,
        }, slice);
        let suspended_until: number = slice.loadUint(32);
        return {
            kind: 'SuspendedAddressList',
            addresses: addresses,
            suspended_until: suspended_until,
        }

    }
    throw new Error('Expected one of "SuspendedAddressList" in loading "SuspendedAddressList", but data does not satisfy any constructor');
}

export function storeSuspendedAddressList(suspendedAddressList: SuspendedAddressList): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x00, 8);
        builder.storeDict(suspendedAddressList.addresses, Dictionary.Keys.BigUint(288), {
            serialize: ((arg: Unit, builder: Builder) => {
            storeUnit(arg)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
        builder.storeUint(suspendedAddressList.suspended_until, 32);
    })

}

// precompiled_smc#b0 gas_usage:uint64 = PrecompiledSmc;

export function loadPrecompiledSmc(slice: Slice): PrecompiledSmc {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xb0))) {
        slice.loadUint(8);
        let gas_usage: bigint = slice.loadUintBig(64);
        return {
            kind: 'PrecompiledSmc',
            gas_usage: gas_usage,
        }

    }
    throw new Error('Expected one of "PrecompiledSmc" in loading "PrecompiledSmc", but data does not satisfy any constructor');
}

export function storePrecompiledSmc(precompiledSmc: PrecompiledSmc): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0xb0, 8);
        builder.storeUint(precompiledSmc.gas_usage, 64);
    })

}

// precompiled_contracts_config#c0 list:(HashmapE 256 PrecompiledSmc) = PrecompiledContractsConfig;

export function loadPrecompiledContractsConfig(slice: Slice): PrecompiledContractsConfig {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0xc0))) {
        slice.loadUint(8);
        let list: Dictionary<bigint, PrecompiledSmc> = Dictionary.load(Dictionary.Keys.BigUint(256), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadPrecompiledSmc,
        }, slice);
        return {
            kind: 'PrecompiledContractsConfig',
            list: list,
        }

    }
    throw new Error('Expected one of "PrecompiledContractsConfig" in loading "PrecompiledContractsConfig", but data does not satisfy any constructor');
}

export function storePrecompiledContractsConfig(precompiledContractsConfig: PrecompiledContractsConfig): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0xc0, 8);
        builder.storeDict(precompiledContractsConfig.list, Dictionary.Keys.BigUint(256), {
            serialize: ((arg: PrecompiledSmc, builder: Builder) => {
            storePrecompiledSmc(arg)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
    })

}

// oracle_bridge_params#_ bridge_address:bits256 oracle_mutlisig_address:bits256 oracles:(HashmapE 256 uint256) external_chain_address:bits256 = OracleBridgeParams;

export function loadOracleBridgeParams(slice: Slice): OracleBridgeParams {
    let bridge_address: Buffer = slice.loadBuffer((256 / 8));
    let oracle_mutlisig_address: Buffer = slice.loadBuffer((256 / 8));
    let oracles: Dictionary<bigint, bigint> = Dictionary.load(Dictionary.Keys.BigUint(256), {
        serialize: () => { throw new Error('Not implemented') },
        parse: ((slice: Slice) => {
        return slice.loadUintBig(256)

    }),
    }, slice);
    let external_chain_address: Buffer = slice.loadBuffer((256 / 8));
    return {
        kind: 'OracleBridgeParams',
        bridge_address: bridge_address,
        oracle_mutlisig_address: oracle_mutlisig_address,
        oracles: oracles,
        external_chain_address: external_chain_address,
    }

}

export function storeOracleBridgeParams(oracleBridgeParams: OracleBridgeParams): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeBuffer(oracleBridgeParams.bridge_address, (256 / 8));
        builder.storeBuffer(oracleBridgeParams.oracle_mutlisig_address, (256 / 8));
        builder.storeDict(oracleBridgeParams.oracles, Dictionary.Keys.BigUint(256), {
            serialize: ((arg: bigint, builder: Builder) => {
            ((arg: bigint) => {
                return ((builder: Builder) => {
                    builder.storeUint(arg, 256);
                })

            })(arg)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
        builder.storeBuffer(oracleBridgeParams.external_chain_address, (256 / 8));
    })

}

/*
jetton_bridge_prices#_ bridge_burn_fee:Coins bridge_mint_fee:Coins
                       wallet_min_tons_for_storage:Coins
                       wallet_gas_consumption:Coins
                       minter_min_tons_for_storage:Coins
                       discover_gas_consumption:Coins = JettonBridgePrices;
*/

export function loadJettonBridgePrices(slice: Slice): JettonBridgePrices {
    let bridge_burn_fee: bigint = slice.loadCoins();
    let bridge_mint_fee: bigint = slice.loadCoins();
    let wallet_min_tons_for_storage: bigint = slice.loadCoins();
    let wallet_gas_consumption: bigint = slice.loadCoins();
    let minter_min_tons_for_storage: bigint = slice.loadCoins();
    let discover_gas_consumption: bigint = slice.loadCoins();
    return {
        kind: 'JettonBridgePrices',
        bridge_burn_fee: bridge_burn_fee,
        bridge_mint_fee: bridge_mint_fee,
        wallet_min_tons_for_storage: wallet_min_tons_for_storage,
        wallet_gas_consumption: wallet_gas_consumption,
        minter_min_tons_for_storage: minter_min_tons_for_storage,
        discover_gas_consumption: discover_gas_consumption,
    }

}

export function storeJettonBridgePrices(jettonBridgePrices: JettonBridgePrices): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeCoins(jettonBridgePrices.bridge_burn_fee);
        builder.storeCoins(jettonBridgePrices.bridge_mint_fee);
        builder.storeCoins(jettonBridgePrices.wallet_min_tons_for_storage);
        builder.storeCoins(jettonBridgePrices.wallet_gas_consumption);
        builder.storeCoins(jettonBridgePrices.minter_min_tons_for_storage);
        builder.storeCoins(jettonBridgePrices.discover_gas_consumption);
    })

}

// jetton_bridge_params_v0#00 bridge_address:bits256 oracles_address:bits256 oracles:(HashmapE 256 uint256) state_flags:uint8 burn_bridge_fee:Coins = JettonBridgeParams;

// jetton_bridge_params_v1#01 bridge_address:bits256 oracles_address:bits256 oracles:(HashmapE 256 uint256) state_flags:uint8 prices:^JettonBridgePrices external_chain_address:bits256 = JettonBridgeParams;

export function loadJettonBridgeParams(slice: Slice): JettonBridgeParams {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x00))) {
        slice.loadUint(8);
        let bridge_address: Buffer = slice.loadBuffer((256 / 8));
        let oracles_address: Buffer = slice.loadBuffer((256 / 8));
        let oracles: Dictionary<bigint, bigint> = Dictionary.load(Dictionary.Keys.BigUint(256), {
            serialize: () => { throw new Error('Not implemented') },
            parse: ((slice: Slice) => {
            return slice.loadUintBig(256)

        }),
        }, slice);
        let state_flags: number = slice.loadUint(8);
        let burn_bridge_fee: bigint = slice.loadCoins();
        return {
            kind: 'JettonBridgeParams_jetton_bridge_params_v0',
            bridge_address: bridge_address,
            oracles_address: oracles_address,
            oracles: oracles,
            state_flags: state_flags,
            burn_bridge_fee: burn_bridge_fee,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x01))) {
        slice.loadUint(8);
        let bridge_address: Buffer = slice.loadBuffer((256 / 8));
        let oracles_address: Buffer = slice.loadBuffer((256 / 8));
        let oracles: Dictionary<bigint, bigint> = Dictionary.load(Dictionary.Keys.BigUint(256), {
            serialize: () => { throw new Error('Not implemented') },
            parse: ((slice: Slice) => {
            return slice.loadUintBig(256)

        }),
        }, slice);
        let state_flags: number = slice.loadUint(8);
        let slice1 = slice.loadRef().beginParse(true);
        let prices: JettonBridgePrices = loadJettonBridgePrices(slice1);
        let external_chain_address: Buffer = slice.loadBuffer((256 / 8));
        return {
            kind: 'JettonBridgeParams_jetton_bridge_params_v1',
            bridge_address: bridge_address,
            oracles_address: oracles_address,
            oracles: oracles,
            state_flags: state_flags,
            prices: prices,
            external_chain_address: external_chain_address,
        }

    }
    throw new Error('Expected one of "JettonBridgeParams_jetton_bridge_params_v0", "JettonBridgeParams_jetton_bridge_params_v1" in loading "JettonBridgeParams", but data does not satisfy any constructor');
}

export function storeJettonBridgeParams(jettonBridgeParams: JettonBridgeParams): (builder: Builder) => void {
    if ((jettonBridgeParams.kind == 'JettonBridgeParams_jetton_bridge_params_v0')) {
        return ((builder: Builder) => {
            builder.storeUint(0x00, 8);
            builder.storeBuffer(jettonBridgeParams.bridge_address, (256 / 8));
            builder.storeBuffer(jettonBridgeParams.oracles_address, (256 / 8));
            builder.storeDict(jettonBridgeParams.oracles, Dictionary.Keys.BigUint(256), {
                serialize: ((arg: bigint, builder: Builder) => {
                ((arg: bigint) => {
                    return ((builder: Builder) => {
                        builder.storeUint(arg, 256);
                    })

                })(arg)(builder);
            }),
                parse: () => { throw new Error('Not implemented') },
            });
            builder.storeUint(jettonBridgeParams.state_flags, 8);
            builder.storeCoins(jettonBridgeParams.burn_bridge_fee);
        })

    }
    if ((jettonBridgeParams.kind == 'JettonBridgeParams_jetton_bridge_params_v1')) {
        return ((builder: Builder) => {
            builder.storeUint(0x01, 8);
            builder.storeBuffer(jettonBridgeParams.bridge_address, (256 / 8));
            builder.storeBuffer(jettonBridgeParams.oracles_address, (256 / 8));
            builder.storeDict(jettonBridgeParams.oracles, Dictionary.Keys.BigUint(256), {
                serialize: ((arg: bigint, builder: Builder) => {
                ((arg: bigint) => {
                    return ((builder: Builder) => {
                        builder.storeUint(arg, 256);
                    })

                })(arg)(builder);
            }),
                parse: () => { throw new Error('Not implemented') },
            });
            builder.storeUint(jettonBridgeParams.state_flags, 8);
            let cell1 = beginCell();
            storeJettonBridgePrices(jettonBridgeParams.prices)(cell1);
            builder.storeRef(cell1);
            builder.storeBuffer(jettonBridgeParams.external_chain_address, (256 / 8));
        })

    }
    throw new Error('Expected one of "JettonBridgeParams_jetton_bridge_params_v0", "JettonBridgeParams_jetton_bridge_params_v1" in loading "JettonBridgeParams", but data does not satisfy any constructor');
}

