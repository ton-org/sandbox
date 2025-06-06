/* eslint-disable */
import { Builder } from '@ton/core'
import { Slice } from '@ton/core'
import { beginCell } from '@ton/core'
import { BitString } from '@ton/core'
import { Cell } from '@ton/core'
import { Address } from '@ton/core'
import { ExternalAddress } from '@ton/core'
import { Dictionary } from '@ton/core'
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

// left$0 {X:Type} {Y:Type} value:X = Either X Y;

// right$1 {X:Type} {Y:Type} value:Y = Either X Y;

export type Either<X, Y> = Either_left<X, Y> | Either_right<X, Y>;

export interface Either_left<X, Y> {
    readonly kind: 'Either_left';
    readonly value: X;
}

export interface Either_right<X, Y> {
    readonly kind: 'Either_right';
    readonly value: Y;
}

// pair$_ {X:Type} {Y:Type} first:X second:Y = Both X Y;

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

// _ {n:#} _:(Hashmap n True) = BitstringSet n;

/*
ahm_edge#_ {n:#} {X:Type} {Y:Type} {l:#} {m:#}
  label:(HmLabel ~l n) {n = (~m) + l}
  node:(HashmapAugNode m X Y) = HashmapAug n X Y;
*/

export interface HashmapAug<X, Y> {
    readonly kind: 'HashmapAug';
    readonly n: number;
    readonly l: number;
    readonly m: number;
    readonly label: HmLabel;
    readonly node: HashmapAugNode<X, Y>;
}

// ahmn_leaf#_ {X:Type} {Y:Type} extra:Y value:X = HashmapAugNode 0 X Y;

/*
ahmn_fork#_ {n:#} {X:Type} {Y:Type} left:^(HashmapAug n X Y)
  right:^(HashmapAug n X Y) extra:Y = HashmapAugNode (n + 1) X Y;
*/

export type HashmapAugNode<X, Y> = HashmapAugNode_ahmn_leaf<X, Y> | HashmapAugNode_ahmn_fork<X, Y>;

export interface HashmapAugNode_ahmn_leaf<X, Y> {
    readonly kind: 'HashmapAugNode_ahmn_leaf';
    readonly extra: Y;
    readonly value: X;
}

export interface HashmapAugNode_ahmn_fork<X, Y> {
    readonly kind: 'HashmapAugNode_ahmn_fork';
    readonly n: number;
    readonly left: HashmapAug<X, Y>;
    readonly right: HashmapAug<X, Y>;
    readonly extra: Y;
}

/*
vhm_edge#_ {n:#} {X:Type} {l:#} {m:#} label:(HmLabel ~l n)
           {n = (~m) + l} node:(VarHashmapNode m X)
           = VarHashmap n X;
*/

export interface VarHashmap<X> {
    readonly kind: 'VarHashmap';
    readonly n: number;
    readonly l: number;
    readonly m: number;
    readonly label: HmLabel;
    readonly node: VarHashmapNode<X>;
}

// vhmn_leaf$00 {n:#} {X:Type} value:X = VarHashmapNode n X;

/*
vhmn_fork$01 {n:#} {X:Type} left:^(VarHashmap n X)
             right:^(VarHashmap n X) value:(Maybe X)
             = VarHashmapNode (n + 1) X;
*/

/*
vhmn_cont$1 {n:#} {X:Type} branch:Bit child:^(VarHashmap n X)
            value:X = VarHashmapNode (n + 1) X;
*/

export type VarHashmapNode<X> = VarHashmapNode_vhmn_leaf<X> | VarHashmapNode_vhmn_fork<X> | VarHashmapNode_vhmn_cont<X>;

export interface VarHashmapNode_vhmn_leaf<X> {
    readonly kind: 'VarHashmapNode_vhmn_leaf';
    readonly n: number;
    readonly value: X;
}

export interface VarHashmapNode_vhmn_fork<X> {
    readonly kind: 'VarHashmapNode_vhmn_fork';
    readonly n: number;
    readonly left: VarHashmap<X>;
    readonly right: VarHashmap<X>;
    readonly value: Maybe<X>;
}

export interface VarHashmapNode_vhmn_cont<X> {
    readonly kind: 'VarHashmapNode_vhmn_cont';
    readonly n: number;
    readonly branch: boolean;
    readonly child: VarHashmap<X>;
    readonly value: X;
}

// vhme_empty$0 {n:#} {X:Type} = VarHashmapE n X;

/*
vhme_root$1 {n:#} {X:Type} root:^(VarHashmap n X)
            = VarHashmapE n X;
*/

/*
phm_edge#_ {n:#} {X:Type} {l:#} {m:#} label:(HmLabel ~l n)
           {n = (~m) + l} node:(PfxHashmapNode m X)
           = PfxHashmap n X;
*/

export interface PfxHashmap<X> {
    readonly kind: 'PfxHashmap';
    readonly n: number;
    readonly l: number;
    readonly m: number;
    readonly label: HmLabel;
    readonly node: PfxHashmapNode<X>;
}

// phmn_leaf$0 {n:#} {X:Type} value:X = PfxHashmapNode n X;

/*
phmn_fork$1 {n:#} {X:Type} left:^(PfxHashmap n X)
            right:^(PfxHashmap n X) = PfxHashmapNode (n + 1) X;
*/

export type PfxHashmapNode<X> = PfxHashmapNode_phmn_leaf<X> | PfxHashmapNode_phmn_fork<X>;

export interface PfxHashmapNode_phmn_leaf<X> {
    readonly kind: 'PfxHashmapNode_phmn_leaf';
    readonly n: number;
    readonly value: X;
}

export interface PfxHashmapNode_phmn_fork<X> {
    readonly kind: 'PfxHashmapNode_phmn_fork';
    readonly n: number;
    readonly left: PfxHashmap<X>;
    readonly right: PfxHashmap<X>;
}

// phme_empty$0 {n:#} {X:Type} = PfxHashmapE n X;

/*
phme_root$1 {n:#} {X:Type} root:^(PfxHashmap n X)
            = PfxHashmapE n X;
*/

/*
anycast_info$_ depth:(#<= 30) { depth >= 1 }
   rewrite_pfx:(bits depth) = Anycast;
*/

// _ grams:Grams = Coins;

/*
extra_currencies$_ dict:(HashmapE 32 (VarUInteger 32))
                 = ExtraCurrencyCollection;
*/

export interface ExtraCurrencyCollection {
    readonly kind: 'ExtraCurrencyCollection';
    readonly dict: Dictionary<number, bigint>;
}

/*
currencies$_ grams:Grams other:ExtraCurrencyCollection
           = CurrencyCollection;
*/

export interface CurrencyCollection {
    readonly kind: 'CurrencyCollection';
    readonly grams: bigint;
    readonly other: ExtraCurrencyCollection;
}

/*
int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool
  src:MsgAddressInt dest:MsgAddressInt
  value:CurrencyCollection ihr_fee:Grams fwd_fee:Grams
  created_lt:uint64 created_at:uint32 = CommonMsgInfo;
*/

/*
ext_in_msg_info$10 src:MsgAddressExt dest:MsgAddressInt
  import_fee:Grams = CommonMsgInfo;
*/

/*
ext_out_msg_info$11 src:MsgAddressInt dest:MsgAddressExt
  created_lt:uint64 created_at:uint32 = CommonMsgInfo;
*/

export type CommonMsgInfo = CommonMsgInfo_int_msg_info | CommonMsgInfo_ext_in_msg_info | CommonMsgInfo_ext_out_msg_info;

export interface CommonMsgInfo_int_msg_info {
    readonly kind: 'CommonMsgInfo_int_msg_info';
    readonly ihr_disabled: Bool;
    readonly bounce: Bool;
    readonly bounced: Bool;
    readonly src: Address;
    readonly dest: Address;
    readonly value: CurrencyCollection;
    readonly ihr_fee: bigint;
    readonly fwd_fee: bigint;
    readonly created_lt: bigint;
    readonly created_at: number;
}

export interface CommonMsgInfo_ext_in_msg_info {
    readonly kind: 'CommonMsgInfo_ext_in_msg_info';
    readonly src: ExternalAddress | null;
    readonly dest: Address;
    readonly import_fee: bigint;
}

export interface CommonMsgInfo_ext_out_msg_info {
    readonly kind: 'CommonMsgInfo_ext_out_msg_info';
    readonly src: Address;
    readonly dest: ExternalAddress | null;
    readonly created_lt: bigint;
    readonly created_at: number;
}

/*
int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool
  src:MsgAddress dest:MsgAddressInt
  value:CurrencyCollection ihr_fee:Grams fwd_fee:Grams
  created_lt:uint64 created_at:uint32 = CommonMsgInfoRelaxed;
*/

/*
ext_out_msg_info$11 src:MsgAddress dest:MsgAddressExt
  created_lt:uint64 created_at:uint32 = CommonMsgInfoRelaxed;
*/

export type CommonMsgInfoRelaxed = CommonMsgInfoRelaxed_int_msg_info | CommonMsgInfoRelaxed_ext_out_msg_info;

export interface CommonMsgInfoRelaxed_int_msg_info {
    readonly kind: 'CommonMsgInfoRelaxed_int_msg_info';
    readonly ihr_disabled: Bool;
    readonly bounce: Bool;
    readonly bounced: Bool;
    readonly src: Address | ExternalAddress | null;
    readonly dest: Address;
    readonly value: CurrencyCollection;
    readonly ihr_fee: bigint;
    readonly fwd_fee: bigint;
    readonly created_lt: bigint;
    readonly created_at: number;
}

export interface CommonMsgInfoRelaxed_ext_out_msg_info {
    readonly kind: 'CommonMsgInfoRelaxed_ext_out_msg_info';
    readonly src: Address | ExternalAddress | null;
    readonly dest: ExternalAddress | null;
    readonly created_lt: bigint;
    readonly created_at: number;
}

// tick_tock$_ tick:Bool tock:Bool = TickTock;

export interface TickTock {
    readonly kind: 'TickTock';
    readonly tick: Bool;
    readonly tock: Bool;
}

/*
_ fixed_prefix_length:(Maybe (## 5)) special:(Maybe TickTock)
  code:(Maybe ^Cell) data:(Maybe ^Cell)
  library:(Maybe ^Cell) = StateInit;
*/

export interface StateInit {
    readonly kind: 'StateInit';
    readonly fixed_prefix_length: Maybe<number>;
    readonly special: Maybe<TickTock>;
    readonly code: Maybe<Cell>;
    readonly data: Maybe<Cell>;
    readonly library: Maybe<Cell>;
}

/*
_ fixed_prefix_length:(Maybe (## 5)) special:(Maybe TickTock)
  code:(Maybe ^Cell) data:(Maybe ^Cell)
  library:(HashmapE 256 SimpleLib) = StateInitWithLibs;
*/

// simple_lib$_ public:Bool root:^Cell = SimpleLib;

/*
message$_ {X:Type} info:CommonMsgInfo
  init:(Maybe (Either StateInit ^StateInit))
  body:(Either X ^X) = Message X;
*/

export interface Message<X> {
    readonly kind: 'Message';
    readonly info: CommonMsgInfo;
    readonly init: Maybe<Either<StateInit, StateInit>>;
    readonly body: Either<X, X>;
}

/*
message$_ {X:Type} info:CommonMsgInfoRelaxed
  init:(Maybe (Either StateInit ^StateInit))
  body:(Either X ^X) = MessageRelaxed X;
*/

export interface MessageRelaxed<X> {
    readonly kind: 'MessageRelaxed';
    readonly info: CommonMsgInfoRelaxed;
    readonly init: Maybe<Either<StateInit, StateInit>>;
    readonly body: Either<X, X>;
}

// _ (Message Any) = MessageAny;

/*
interm_addr_regular$0 use_dest_bits:(#<= 96)
  = IntermediateAddress;
*/

/*
interm_addr_simple$10 workchain_id:int8 addr_pfx:uint64
  = IntermediateAddress;
*/

/*
interm_addr_ext$11 workchain_id:int32 addr_pfx:uint64
  = IntermediateAddress;
*/

export type IntermediateAddress = IntermediateAddress_interm_addr_regular | IntermediateAddress_interm_addr_simple | IntermediateAddress_interm_addr_ext;

export interface IntermediateAddress_interm_addr_regular {
    readonly kind: 'IntermediateAddress_interm_addr_regular';
    readonly use_dest_bits: number;
}

export interface IntermediateAddress_interm_addr_simple {
    readonly kind: 'IntermediateAddress_interm_addr_simple';
    readonly workchain_id: number;
    readonly addr_pfx: bigint;
}

export interface IntermediateAddress_interm_addr_ext {
    readonly kind: 'IntermediateAddress_interm_addr_ext';
    readonly workchain_id: number;
    readonly addr_pfx: bigint;
}

/*
msg_envelope#4 cur_addr:IntermediateAddress
  next_addr:IntermediateAddress fwd_fee_remaining:Grams
  msg:^(Message Any) = MsgEnvelope;
*/

/*
msg_envelope_v2#5 cur_addr:IntermediateAddress
  next_addr:IntermediateAddress fwd_fee_remaining:Grams
  msg:^(Message Any)
  emitted_lt:(Maybe uint64)
  metadata:(Maybe MsgMetadata) = MsgEnvelope;
*/

export type MsgEnvelope = MsgEnvelope_msg_envelope | MsgEnvelope_msg_envelope_v2;

export interface MsgEnvelope_msg_envelope {
    readonly kind: 'MsgEnvelope_msg_envelope';
    readonly cur_addr: IntermediateAddress;
    readonly next_addr: IntermediateAddress;
    readonly fwd_fee_remaining: bigint;
    readonly msg: Message<Cell>;
}

export interface MsgEnvelope_msg_envelope_v2 {
    readonly kind: 'MsgEnvelope_msg_envelope_v2';
    readonly cur_addr: IntermediateAddress;
    readonly next_addr: IntermediateAddress;
    readonly fwd_fee_remaining: bigint;
    readonly msg: Message<Cell>;
    readonly emitted_lt: Maybe<bigint>;
    readonly metadata: Maybe<MsgMetadata>;
}

// msg_metadata#0 depth:uint32 initiator_addr:MsgAddressInt initiator_lt:uint64 = MsgMetadata;

export interface MsgMetadata {
    readonly kind: 'MsgMetadata';
    readonly depth: number;
    readonly initiator_addr: Address;
    readonly initiator_lt: bigint;
}

/*
msg_import_ext$000 msg:^(Message Any) transaction:^Transaction
              = InMsg;
*/

/*
msg_import_ihr$010 msg:^(Message Any) transaction:^Transaction
    ihr_fee:Grams proof_created:^Cell = InMsg;
*/

/*
msg_import_imm$011 in_msg:^MsgEnvelope
    transaction:^Transaction fwd_fee:Grams = InMsg;
*/

/*
msg_import_fin$100 in_msg:^MsgEnvelope
    transaction:^Transaction fwd_fee:Grams = InMsg;
*/

/*
msg_import_tr$101  in_msg:^MsgEnvelope out_msg:^MsgEnvelope
    transit_fee:Grams = InMsg;
*/

/*
msg_discard_fin$110 in_msg:^MsgEnvelope transaction_id:uint64
    fwd_fee:Grams = InMsg;
*/

/*
msg_discard_tr$111 in_msg:^MsgEnvelope transaction_id:uint64
    fwd_fee:Grams proof_delivered:^Cell = InMsg;
*/

/*
msg_import_deferred_fin$00100 in_msg:^MsgEnvelope
    transaction:^Transaction fwd_fee:Grams = InMsg;
*/

// msg_import_deferred_tr$00101 in_msg:^MsgEnvelope out_msg:^MsgEnvelope = InMsg;

export type InMsg = InMsg_msg_import_ext | InMsg_msg_import_ihr | InMsg_msg_import_imm | InMsg_msg_import_fin | InMsg_msg_import_tr | InMsg_msg_discard_fin | InMsg_msg_discard_tr | InMsg_msg_import_deferred_fin | InMsg_msg_import_deferred_tr;

export interface InMsg_msg_import_ext {
    readonly kind: 'InMsg_msg_import_ext';
    readonly msg: Message<Cell>;
    readonly transaction: Transaction;
}

export interface InMsg_msg_import_ihr {
    readonly kind: 'InMsg_msg_import_ihr';
    readonly msg: Message<Cell>;
    readonly transaction: Transaction;
    readonly ihr_fee: bigint;
    readonly proof_created: Cell;
}

export interface InMsg_msg_import_imm {
    readonly kind: 'InMsg_msg_import_imm';
    readonly in_msg: MsgEnvelope;
    readonly transaction: Transaction;
    readonly fwd_fee: bigint;
}

export interface InMsg_msg_import_fin {
    readonly kind: 'InMsg_msg_import_fin';
    readonly in_msg: MsgEnvelope;
    readonly transaction: Transaction;
    readonly fwd_fee: bigint;
}

export interface InMsg_msg_import_tr {
    readonly kind: 'InMsg_msg_import_tr';
    readonly in_msg: MsgEnvelope;
    readonly out_msg: MsgEnvelope;
    readonly transit_fee: bigint;
}

export interface InMsg_msg_discard_fin {
    readonly kind: 'InMsg_msg_discard_fin';
    readonly in_msg: MsgEnvelope;
    readonly transaction_id: bigint;
    readonly fwd_fee: bigint;
}

export interface InMsg_msg_discard_tr {
    readonly kind: 'InMsg_msg_discard_tr';
    readonly in_msg: MsgEnvelope;
    readonly transaction_id: bigint;
    readonly fwd_fee: bigint;
    readonly proof_delivered: Cell;
}

export interface InMsg_msg_import_deferred_fin {
    readonly kind: 'InMsg_msg_import_deferred_fin';
    readonly in_msg: MsgEnvelope;
    readonly transaction: Transaction;
    readonly fwd_fee: bigint;
}

export interface InMsg_msg_import_deferred_tr {
    readonly kind: 'InMsg_msg_import_deferred_tr';
    readonly in_msg: MsgEnvelope;
    readonly out_msg: MsgEnvelope;
}

/*
import_fees$_ fees_collected:Grams
  value_imported:CurrencyCollection = ImportFees;
*/

export interface ImportFees {
    readonly kind: 'ImportFees';
    readonly fees_collected: bigint;
    readonly value_imported: CurrencyCollection;
}

// _ (HashmapAugE 256 InMsg ImportFees) = InMsgDescr;

export interface InMsgDescr {
    readonly kind: 'InMsgDescr';
    readonly anon0: Dictionary<bigint, {value: InMsg, extra: ImportFees}>;
}

/*
msg_export_ext$000 msg:^(Message Any)
    transaction:^Transaction = OutMsg;
*/

/*
msg_export_imm$010 out_msg:^MsgEnvelope
    transaction:^Transaction reimport:^InMsg = OutMsg;
*/

/*
msg_export_new$001 out_msg:^MsgEnvelope
    transaction:^Transaction = OutMsg;
*/

/*
msg_export_tr$011  out_msg:^MsgEnvelope
    imported:^InMsg = OutMsg;
*/

/*
msg_export_deq$1100 out_msg:^MsgEnvelope
    import_block_lt:uint63 = OutMsg;
*/

/*
msg_export_deq_short$1101 msg_env_hash:bits256
    next_workchain:int32 next_addr_pfx:uint64
    import_block_lt:uint64 = OutMsg;
*/

/*
msg_export_tr_req$111 out_msg:^MsgEnvelope
    imported:^InMsg = OutMsg;
*/

/*
msg_export_deq_imm$100 out_msg:^MsgEnvelope
    reimport:^InMsg = OutMsg;
*/

/*
msg_export_new_defer$10100 out_msg:^MsgEnvelope
    transaction:^Transaction = OutMsg;
*/

/*
msg_export_deferred_tr$10101  out_msg:^MsgEnvelope
    imported:^InMsg = OutMsg;
*/

export type OutMsg = OutMsg_msg_export_ext | OutMsg_msg_export_imm | OutMsg_msg_export_new | OutMsg_msg_export_tr | OutMsg_msg_export_deq | OutMsg_msg_export_deq_short | OutMsg_msg_export_tr_req | OutMsg_msg_export_deq_imm | OutMsg_msg_export_new_defer | OutMsg_msg_export_deferred_tr;

export interface OutMsg_msg_export_ext {
    readonly kind: 'OutMsg_msg_export_ext';
    readonly msg: Message<Cell>;
    readonly transaction: Transaction;
}

export interface OutMsg_msg_export_imm {
    readonly kind: 'OutMsg_msg_export_imm';
    readonly out_msg: MsgEnvelope;
    readonly transaction: Transaction;
    readonly reimport: InMsg;
}

export interface OutMsg_msg_export_new {
    readonly kind: 'OutMsg_msg_export_new';
    readonly out_msg: MsgEnvelope;
    readonly transaction: Transaction;
}

export interface OutMsg_msg_export_tr {
    readonly kind: 'OutMsg_msg_export_tr';
    readonly out_msg: MsgEnvelope;
    readonly imported: InMsg;
}

export interface OutMsg_msg_export_deq {
    readonly kind: 'OutMsg_msg_export_deq';
    readonly out_msg: MsgEnvelope;
    readonly import_block_lt: bigint;
}

export interface OutMsg_msg_export_deq_short {
    readonly kind: 'OutMsg_msg_export_deq_short';
    readonly msg_env_hash: Buffer;
    readonly next_workchain: number;
    readonly next_addr_pfx: bigint;
    readonly import_block_lt: bigint;
}

export interface OutMsg_msg_export_tr_req {
    readonly kind: 'OutMsg_msg_export_tr_req';
    readonly out_msg: MsgEnvelope;
    readonly imported: InMsg;
}

export interface OutMsg_msg_export_deq_imm {
    readonly kind: 'OutMsg_msg_export_deq_imm';
    readonly out_msg: MsgEnvelope;
    readonly reimport: InMsg;
}

export interface OutMsg_msg_export_new_defer {
    readonly kind: 'OutMsg_msg_export_new_defer';
    readonly out_msg: MsgEnvelope;
    readonly transaction: Transaction;
}

export interface OutMsg_msg_export_deferred_tr {
    readonly kind: 'OutMsg_msg_export_deferred_tr';
    readonly out_msg: MsgEnvelope;
    readonly imported: InMsg;
}

// _ enqueued_lt:uint64 out_msg:^MsgEnvelope = EnqueuedMsg;

export interface EnqueuedMsg {
    readonly kind: 'EnqueuedMsg';
    readonly enqueued_lt: bigint;
    readonly out_msg: MsgEnvelope;
}

// _ (HashmapAugE 256 OutMsg CurrencyCollection) = OutMsgDescr;

export interface OutMsgDescr {
    readonly kind: 'OutMsgDescr';
    readonly anon0: Dictionary<bigint, {value: OutMsg, extra: CurrencyCollection}>;
}

// _ (HashmapAugE 352 EnqueuedMsg uint64) = OutMsgQueue;

export interface OutMsgQueue {
    readonly kind: 'OutMsgQueue';
    readonly anon0: Dictionary<bigint, {value: EnqueuedMsg, extra: bigint}>;
}

// processed_upto$_ last_msg_lt:uint64 last_msg_hash:bits256 = ProcessedUpto;

export interface ProcessedUpto {
    readonly kind: 'ProcessedUpto';
    readonly last_msg_lt: bigint;
    readonly last_msg_hash: Buffer;
}

// _ (HashmapE 96 ProcessedUpto) = ProcessedInfo;

export interface ProcessedInfo {
    readonly kind: 'ProcessedInfo';
    readonly anon0: Dictionary<bigint, ProcessedUpto>;
}

// ihr_pending$_ import_lt:uint64 = IhrPendingSince;

// _ (HashmapE 320 IhrPendingSince) = IhrPendingInfo;

// _ messages:(HashmapE 64 EnqueuedMsg) count:uint48 = AccountDispatchQueue;

export interface AccountDispatchQueue {
    readonly kind: 'AccountDispatchQueue';
    readonly messages: Dictionary<bigint, EnqueuedMsg>;
    readonly count: bigint;
}

// _ (HashmapAugE 256 AccountDispatchQueue uint64) = DispatchQueue;

export interface DispatchQueue {
    readonly kind: 'DispatchQueue';
    readonly anon0: Dictionary<bigint, {value: AccountDispatchQueue, extra: bigint}>;
}

// out_msg_queue_extra#0 dispatch_queue:DispatchQueue out_queue_size:(Maybe uint48) = OutMsgQueueExtra;

export interface OutMsgQueueExtra {
    readonly kind: 'OutMsgQueueExtra';
    readonly dispatch_queue: DispatchQueue;
    readonly out_queue_size: Maybe<bigint>;
}

/*
_ out_queue:OutMsgQueue proc_info:ProcessedInfo
  extra:(Maybe OutMsgQueueExtra) = OutMsgQueueInfo;
*/

export interface OutMsgQueueInfo {
    readonly kind: 'OutMsgQueueInfo';
    readonly out_queue: OutMsgQueue;
    readonly proc_info: ProcessedInfo;
    readonly extra: Maybe<OutMsgQueueExtra>;
}

// storage_extra_none$000 = StorageExtraInfo;

// storage_extra_info$001 dict_hash:uint256 = StorageExtraInfo;

export type StorageExtraInfo = StorageExtraInfo_storage_extra_none | StorageExtraInfo_storage_extra_info;

export interface StorageExtraInfo_storage_extra_none {
    readonly kind: 'StorageExtraInfo_storage_extra_none';
}

export interface StorageExtraInfo_storage_extra_info {
    readonly kind: 'StorageExtraInfo_storage_extra_info';
    readonly dict_hash: bigint;
}

// storage_used$_ cells:(VarUInteger 7) bits:(VarUInteger 7) = StorageUsed;

export interface StorageUsed {
    readonly kind: 'StorageUsed';
    readonly _cells: bigint;
    readonly bits: bigint;
}

/*
storage_info$_ used:StorageUsed storage_extra:StorageExtraInfo last_paid:uint32
              due_payment:(Maybe Grams) = StorageInfo;
*/

export interface StorageInfo {
    readonly kind: 'StorageInfo';
    readonly used: StorageUsed;
    readonly storage_extra: StorageExtraInfo;
    readonly last_paid: number;
    readonly due_payment: Maybe<bigint>;
}

// account_none$0 = Account;

/*
account$1 addr:MsgAddressInt storage_stat:StorageInfo
          storage:AccountStorage = Account;
*/

export type Account = Account_account_none | Account_account;

export interface Account_account_none {
    readonly kind: 'Account_account_none';
}

export interface Account_account {
    readonly kind: 'Account_account';
    readonly addr: Address;
    readonly storage_stat: StorageInfo;
    readonly storage: AccountStorage;
}

/*
account_storage$_ last_trans_lt:uint64
    balance:CurrencyCollection state:AccountState
  = AccountStorage;
*/

export interface AccountStorage {
    readonly kind: 'AccountStorage';
    readonly last_trans_lt: bigint;
    readonly balance: CurrencyCollection;
    readonly state: AccountState;
}

// account_uninit$00 = AccountState;

// account_active$1 _:StateInit = AccountState;

// account_frozen$01 state_hash:bits256 = AccountState;

export type AccountState = AccountState_account_uninit | AccountState_account_active | AccountState_account_frozen;

export interface AccountState_account_uninit {
    readonly kind: 'AccountState_account_uninit';
}

export interface AccountState_account_active {
    readonly kind: 'AccountState_account_active';
    readonly _: StateInit;
}

export interface AccountState_account_frozen {
    readonly kind: 'AccountState_account_frozen';
    readonly state_hash: Buffer;
}

// acc_state_uninit$00 = AccountStatus;

// acc_state_frozen$01 = AccountStatus;

// acc_state_active$10 = AccountStatus;

// acc_state_nonexist$11 = AccountStatus;

export type AccountStatus = AccountStatus_acc_state_uninit | AccountStatus_acc_state_frozen | AccountStatus_acc_state_active | AccountStatus_acc_state_nonexist;

export interface AccountStatus_acc_state_uninit {
    readonly kind: 'AccountStatus_acc_state_uninit';
}

export interface AccountStatus_acc_state_frozen {
    readonly kind: 'AccountStatus_acc_state_frozen';
}

export interface AccountStatus_acc_state_active {
    readonly kind: 'AccountStatus_acc_state_active';
}

export interface AccountStatus_acc_state_nonexist {
    readonly kind: 'AccountStatus_acc_state_nonexist';
}

/*
account_descr$_ account:^Account last_trans_hash:bits256
  last_trans_lt:uint64 = ShardAccount;
*/

export interface ShardAccount {
    readonly kind: 'ShardAccount';
    readonly account: Account;
    readonly last_trans_hash: Buffer;
    readonly last_trans_lt: bigint;
}

// depth_balance$_ split_depth:(#<= 30) balance:CurrencyCollection = DepthBalanceInfo;

export interface DepthBalanceInfo {
    readonly kind: 'DepthBalanceInfo';
    readonly split_depth: number;
    readonly balance: CurrencyCollection;
}

// _ (HashmapAugE 256 ShardAccount DepthBalanceInfo) = ShardAccounts;

export interface ShardAccounts {
    readonly kind: 'ShardAccounts';
    readonly anon0: Dictionary<bigint, {value: ShardAccount, extra: DepthBalanceInfo}>;
}

/*
transaction$0111 account_addr:bits256 lt:uint64
  prev_trans_hash:bits256 prev_trans_lt:uint64 now:uint32
  outmsg_cnt:uint15
  orig_status:AccountStatus end_status:AccountStatus
  ^[ in_msg:(Maybe ^(Message Any)) out_msgs:(HashmapE 15 ^(Message Any)) ]
  total_fees:CurrencyCollection state_update:^(HASH_UPDATE Account)
  description:^TransactionDescr = Transaction;
*/

export interface Transaction {
    readonly kind: 'Transaction';
    readonly account_addr: Buffer;
    readonly lt: bigint;
    readonly prev_trans_hash: Buffer;
    readonly prev_trans_lt: bigint;
    readonly now: number;
    readonly outmsg_cnt: number;
    readonly orig_status: AccountStatus;
    readonly end_status: AccountStatus;
    readonly in_msg: Maybe<Message<Cell>>;
    readonly out_msgs: Dictionary<number, Message<Cell>>;
    readonly total_fees: CurrencyCollection;
    readonly state_update: HASH_UPDATE<Account>;
    readonly description: TransactionDescr;
}

/*
!merkle_update#04 {X:Type} old_hash:bits256 new_hash:bits256 old_depth:uint16 new_depth:uint16
  old:^X new:^X = MERKLE_UPDATE X;
*/

/*
update_hashes#72 {X:Type} old_hash:bits256 new_hash:bits256
  = HASH_UPDATE X;
*/

export interface HASH_UPDATE<X> {
    readonly kind: 'HASH_UPDATE';
    readonly old_hash: Buffer;
    readonly new_hash: Buffer;
}

// !merkle_proof#03 {X:Type} virtual_hash:bits256 depth:uint16 virtual_root:^X = MERKLE_PROOF X;

export interface MERKLE_PROOF<X> {
    readonly kind: 'MERKLE_PROOF';
    readonly virtual_hash: Buffer;
    readonly depth: number;
    readonly virtual_root: X;
}

/*
acc_trans#5 account_addr:bits256
            transactions:(HashmapAug 64 ^Transaction CurrencyCollection)
            state_update:^(HASH_UPDATE Account)
          = AccountBlock;
*/

export interface AccountBlock {
    readonly kind: 'AccountBlock';
    readonly account_addr: Buffer;
    readonly transactions: HashmapAug<Transaction, CurrencyCollection>;
    readonly state_update: HASH_UPDATE<Account>;
}

// _ (HashmapAugE 256 AccountBlock CurrencyCollection) = ShardAccountBlocks;

export interface ShardAccountBlocks {
    readonly kind: 'ShardAccountBlocks';
    readonly anon0: Dictionary<bigint, {value: AccountBlock, extra: CurrencyCollection}>;
}

/*
tr_phase_storage$_ storage_fees_collected:Grams
  storage_fees_due:(Maybe Grams)
  status_change:AccStatusChange
  = TrStoragePhase;
*/

export interface TrStoragePhase {
    readonly kind: 'TrStoragePhase';
    readonly storage_fees_collected: bigint;
    readonly storage_fees_due: Maybe<bigint>;
    readonly status_change: AccStatusChange;
}

// acst_unchanged$0 = AccStatusChange;

// acst_frozen$10 = AccStatusChange;

// acst_deleted$11 = AccStatusChange;

export type AccStatusChange = AccStatusChange_acst_unchanged | AccStatusChange_acst_frozen | AccStatusChange_acst_deleted;

export interface AccStatusChange_acst_unchanged {
    readonly kind: 'AccStatusChange_acst_unchanged';
}

export interface AccStatusChange_acst_frozen {
    readonly kind: 'AccStatusChange_acst_frozen';
}

export interface AccStatusChange_acst_deleted {
    readonly kind: 'AccStatusChange_acst_deleted';
}

/*
tr_phase_credit$_ due_fees_collected:(Maybe Grams)
  credit:CurrencyCollection = TrCreditPhase;
*/

export interface TrCreditPhase {
    readonly kind: 'TrCreditPhase';
    readonly due_fees_collected: Maybe<bigint>;
    readonly credit: CurrencyCollection;
}

/*
tr_phase_compute_skipped$0 reason:ComputeSkipReason
  = TrComputePhase;
*/

/*
tr_phase_compute_vm$1 success:Bool msg_state_used:Bool
  account_activated:Bool gas_fees:Grams
  ^[ gas_used:(VarUInteger 7)
  gas_limit:(VarUInteger 7) gas_credit:(Maybe (VarUInteger 3))
  mode:int8 exit_code:int32 exit_arg:(Maybe int32)
  vm_steps:uint32
  vm_init_state_hash:bits256 vm_final_state_hash:bits256 ]
  = TrComputePhase;
*/

export type TrComputePhase = TrComputePhase_tr_phase_compute_skipped | TrComputePhase_tr_phase_compute_vm;

export interface TrComputePhase_tr_phase_compute_skipped {
    readonly kind: 'TrComputePhase_tr_phase_compute_skipped';
    readonly reason: ComputeSkipReason;
}

export interface TrComputePhase_tr_phase_compute_vm {
    readonly kind: 'TrComputePhase_tr_phase_compute_vm';
    readonly success: Bool;
    readonly msg_state_used: Bool;
    readonly account_activated: Bool;
    readonly gas_fees: bigint;
    readonly gas_used: bigint;
    readonly gas_limit: bigint;
    readonly gas_credit: Maybe<bigint>;
    readonly mode: number;
    readonly exit_code: number;
    readonly exit_arg: Maybe<number>;
    readonly vm_steps: number;
    readonly vm_init_state_hash: Buffer;
    readonly vm_final_state_hash: Buffer;
}

// cskip_no_state$00 = ComputeSkipReason;

// cskip_bad_state$01 = ComputeSkipReason;

// cskip_no_gas$10 = ComputeSkipReason;

// cskip_suspended$110 = ComputeSkipReason;

export type ComputeSkipReason = ComputeSkipReason_cskip_no_state | ComputeSkipReason_cskip_bad_state | ComputeSkipReason_cskip_no_gas | ComputeSkipReason_cskip_suspended;

export interface ComputeSkipReason_cskip_no_state {
    readonly kind: 'ComputeSkipReason_cskip_no_state';
}

export interface ComputeSkipReason_cskip_bad_state {
    readonly kind: 'ComputeSkipReason_cskip_bad_state';
}

export interface ComputeSkipReason_cskip_no_gas {
    readonly kind: 'ComputeSkipReason_cskip_no_gas';
}

export interface ComputeSkipReason_cskip_suspended {
    readonly kind: 'ComputeSkipReason_cskip_suspended';
}

/*
tr_phase_action$_ success:Bool valid:Bool no_funds:Bool
  status_change:AccStatusChange
  total_fwd_fees:(Maybe Grams) total_action_fees:(Maybe Grams)
  result_code:int32 result_arg:(Maybe int32) tot_actions:uint16
  spec_actions:uint16 skipped_actions:uint16 msgs_created:uint16
  action_list_hash:bits256 tot_msg_size:StorageUsed
  = TrActionPhase;
*/

export interface TrActionPhase {
    readonly kind: 'TrActionPhase';
    readonly success: Bool;
    readonly valid: Bool;
    readonly no_funds: Bool;
    readonly status_change: AccStatusChange;
    readonly total_fwd_fees: Maybe<bigint>;
    readonly total_action_fees: Maybe<bigint>;
    readonly result_code: number;
    readonly result_arg: Maybe<number>;
    readonly tot_actions: number;
    readonly spec_actions: number;
    readonly skipped_actions: number;
    readonly msgs_created: number;
    readonly action_list_hash: Buffer;
    readonly tot_msg_size: StorageUsed;
}

// tr_phase_bounce_negfunds$00 = TrBouncePhase;

/*
tr_phase_bounce_nofunds$01 msg_size:StorageUsed
  req_fwd_fees:Grams = TrBouncePhase;
*/

/*
tr_phase_bounce_ok$1 msg_size:StorageUsed
  msg_fees:Grams fwd_fees:Grams = TrBouncePhase;
*/

export type TrBouncePhase = TrBouncePhase_tr_phase_bounce_negfunds | TrBouncePhase_tr_phase_bounce_nofunds | TrBouncePhase_tr_phase_bounce_ok;

export interface TrBouncePhase_tr_phase_bounce_negfunds {
    readonly kind: 'TrBouncePhase_tr_phase_bounce_negfunds';
}

export interface TrBouncePhase_tr_phase_bounce_nofunds {
    readonly kind: 'TrBouncePhase_tr_phase_bounce_nofunds';
    readonly msg_size: StorageUsed;
    readonly req_fwd_fees: bigint;
}

export interface TrBouncePhase_tr_phase_bounce_ok {
    readonly kind: 'TrBouncePhase_tr_phase_bounce_ok';
    readonly msg_size: StorageUsed;
    readonly msg_fees: bigint;
    readonly fwd_fees: bigint;
}

/*
trans_ord$0000 credit_first:Bool
  storage_ph:(Maybe TrStoragePhase)
  credit_ph:(Maybe TrCreditPhase)
  compute_ph:TrComputePhase action:(Maybe ^TrActionPhase)
  aborted:Bool bounce:(Maybe TrBouncePhase)
  destroyed:Bool
  = TransactionDescr;
*/

/*
trans_storage$0001 storage_ph:TrStoragePhase
  = TransactionDescr;
*/

/*
trans_tick_tock$001 is_tock:Bool storage_ph:TrStoragePhase
  compute_ph:TrComputePhase action:(Maybe ^TrActionPhase)
  aborted:Bool destroyed:Bool = TransactionDescr;
*/

/*
trans_split_prepare$0100 split_info:SplitMergeInfo
  storage_ph:(Maybe TrStoragePhase)
  compute_ph:TrComputePhase action:(Maybe ^TrActionPhase)
  aborted:Bool destroyed:Bool
  = TransactionDescr;
*/

/*
trans_split_install$0101 split_info:SplitMergeInfo
  prepare_transaction:^Transaction
  installed:Bool = TransactionDescr;
*/

/*
trans_merge_prepare$0110 split_info:SplitMergeInfo
  storage_ph:TrStoragePhase aborted:Bool
  = TransactionDescr;
*/

/*
trans_merge_install$0111 split_info:SplitMergeInfo
  prepare_transaction:^Transaction
  storage_ph:(Maybe TrStoragePhase)
  credit_ph:(Maybe TrCreditPhase)
  compute_ph:TrComputePhase action:(Maybe ^TrActionPhase)
  aborted:Bool destroyed:Bool
  = TransactionDescr;
*/

export type TransactionDescr = TransactionDescr_trans_ord | TransactionDescr_trans_storage | TransactionDescr_trans_tick_tock | TransactionDescr_trans_split_prepare | TransactionDescr_trans_split_install | TransactionDescr_trans_merge_prepare | TransactionDescr_trans_merge_install;

export interface TransactionDescr_trans_ord {
    readonly kind: 'TransactionDescr_trans_ord';
    readonly credit_first: Bool;
    readonly storage_ph: Maybe<TrStoragePhase>;
    readonly credit_ph: Maybe<TrCreditPhase>;
    readonly compute_ph: TrComputePhase;
    readonly action: Maybe<TrActionPhase>;
    readonly aborted: Bool;
    readonly bounce: Maybe<TrBouncePhase>;
    readonly destroyed: Bool;
}

export interface TransactionDescr_trans_storage {
    readonly kind: 'TransactionDescr_trans_storage';
    readonly storage_ph: TrStoragePhase;
}

export interface TransactionDescr_trans_tick_tock {
    readonly kind: 'TransactionDescr_trans_tick_tock';
    readonly is_tock: Bool;
    readonly storage_ph: TrStoragePhase;
    readonly compute_ph: TrComputePhase;
    readonly action: Maybe<TrActionPhase>;
    readonly aborted: Bool;
    readonly destroyed: Bool;
}

export interface TransactionDescr_trans_split_prepare {
    readonly kind: 'TransactionDescr_trans_split_prepare';
    readonly split_info: SplitMergeInfo;
    readonly storage_ph: Maybe<TrStoragePhase>;
    readonly compute_ph: TrComputePhase;
    readonly action: Maybe<TrActionPhase>;
    readonly aborted: Bool;
    readonly destroyed: Bool;
}

export interface TransactionDescr_trans_split_install {
    readonly kind: 'TransactionDescr_trans_split_install';
    readonly split_info: SplitMergeInfo;
    readonly prepare_transaction: Transaction;
    readonly installed: Bool;
}

export interface TransactionDescr_trans_merge_prepare {
    readonly kind: 'TransactionDescr_trans_merge_prepare';
    readonly split_info: SplitMergeInfo;
    readonly storage_ph: TrStoragePhase;
    readonly aborted: Bool;
}

export interface TransactionDescr_trans_merge_install {
    readonly kind: 'TransactionDescr_trans_merge_install';
    readonly split_info: SplitMergeInfo;
    readonly prepare_transaction: Transaction;
    readonly storage_ph: Maybe<TrStoragePhase>;
    readonly credit_ph: Maybe<TrCreditPhase>;
    readonly compute_ph: TrComputePhase;
    readonly action: Maybe<TrActionPhase>;
    readonly aborted: Bool;
    readonly destroyed: Bool;
}

/*
split_merge_info$_ cur_shard_pfx_len:(## 6)
  acc_split_depth:(## 6) this_addr:bits256 sibling_addr:bits256
  = SplitMergeInfo;
*/

export interface SplitMergeInfo {
    readonly kind: 'SplitMergeInfo';
    readonly cur_shard_pfx_len: number;
    readonly acc_split_depth: number;
    readonly this_addr: Buffer;
    readonly sibling_addr: Buffer;
}

/*
smc_info#076ef1ea actions:uint16 msgs_sent:uint16
  unixtime:uint32 block_lt:uint64 trans_lt:uint64
  rand_seed:bits256 balance_remaining:CurrencyCollection
  myself:MsgAddressInt global_config:(Maybe Cell) = SmartContractInfo;
*/

// out_list_empty$_ = OutList 0;

/*
out_list$_ {n:#} prev:^(OutList n) action:OutAction
  = OutList (n + 1);
*/

export type OutList = OutList_out_list_empty | OutList_out_list;

export interface OutList_out_list_empty {
    readonly kind: 'OutList_out_list_empty';
}

export interface OutList_out_list {
    readonly kind: 'OutList_out_list';
    readonly n: number;
    readonly prev: OutList;
    readonly action: OutAction;
}

/*
action_send_msg#0ec3c86d mode:(## 8)
  out_msg:^(MessageRelaxed Any) = OutAction;
*/

// action_set_code#ad4de08e new_code:^Cell = OutAction;

/*
action_reserve_currency#36e6b809 mode:(## 8)
  currency:CurrencyCollection = OutAction;
*/

/*
action_change_library#26fa1dd4 mode:(## 7)
  libref:LibRef = OutAction;
*/

export type OutAction = OutAction_action_send_msg | OutAction_action_set_code | OutAction_action_reserve_currency | OutAction_action_change_library;

export interface OutAction_action_send_msg {
    readonly kind: 'OutAction_action_send_msg';
    readonly mode: number;
    readonly out_msg: MessageRelaxed<Cell>;
}

export interface OutAction_action_set_code {
    readonly kind: 'OutAction_action_set_code';
    readonly new_code: Cell;
}

export interface OutAction_action_reserve_currency {
    readonly kind: 'OutAction_action_reserve_currency';
    readonly mode: number;
    readonly currency: CurrencyCollection;
}

export interface OutAction_action_change_library {
    readonly kind: 'OutAction_action_change_library';
    readonly mode: number;
    readonly libref: LibRef;
}

// libref_hash$0 lib_hash:bits256 = LibRef;

// libref_ref$1 library:^Cell = LibRef;

export type LibRef = LibRef_libref_hash | LibRef_libref_ref;

export interface LibRef_libref_hash {
    readonly kind: 'LibRef_libref_hash';
    readonly lib_hash: Buffer;
}

export interface LibRef_libref_ref {
    readonly kind: 'LibRef_libref_ref';
    readonly library: Cell;
}

// out_list_node$_ prev:^Cell action:OutAction = OutListNode;

/*
shard_ident$00 shard_pfx_bits:(#<= 60)
  workchain_id:int32 shard_prefix:uint64 = ShardIdent;
*/

export interface ShardIdent {
    readonly kind: 'ShardIdent';
    readonly shard_pfx_bits: number;
    readonly workchain_id: number;
    readonly shard_prefix: bigint;
}

/*
ext_blk_ref$_ end_lt:uint64
  seq_no:uint32 root_hash:bits256 file_hash:bits256
  = ExtBlkRef;
*/

export interface ExtBlkRef {
    readonly kind: 'ExtBlkRef';
    readonly end_lt: bigint;
    readonly seq_no: number;
    readonly root_hash: Buffer;
    readonly file_hash: Buffer;
}

/*
block_id_ext$_ shard_id:ShardIdent seq_no:uint32
  root_hash:bits256 file_hash:bits256 = BlockIdExt;
*/

// master_info$_ master:ExtBlkRef = BlkMasterInfo;

export interface BlkMasterInfo {
    readonly kind: 'BlkMasterInfo';
    readonly master: ExtBlkRef;
}

/*
shard_state#9023afe2 global_id:int32
  shard_id:ShardIdent
  seq_no:uint32 vert_seq_no:#
  gen_utime:uint32 gen_lt:uint64
  min_ref_mc_seqno:uint32
  out_msg_queue_info:^OutMsgQueueInfo
  before_split:(## 1)
  accounts:^ShardAccounts
  ^[ overload_history:uint64 underload_history:uint64
  total_balance:CurrencyCollection
  total_validator_fees:CurrencyCollection
  libraries:(HashmapE 256 LibDescr)
  master_ref:(Maybe BlkMasterInfo) ]
  custom:(Maybe ^McStateExtra)
  = ShardStateUnsplit;
*/

export interface ShardStateUnsplit {
    readonly kind: 'ShardStateUnsplit';
    readonly global_id: number;
    readonly shard_id: ShardIdent;
    readonly seq_no: number;
    readonly vert_seq_no: number;
    readonly gen_utime: number;
    readonly gen_lt: bigint;
    readonly min_ref_mc_seqno: number;
    readonly out_msg_queue_info: OutMsgQueueInfo;
    readonly before_split: number;
    readonly accounts: ShardAccounts;
    readonly overload_history: bigint;
    readonly underload_history: bigint;
    readonly total_balance: CurrencyCollection;
    readonly total_validator_fees: CurrencyCollection;
    readonly libraries: Dictionary<bigint, LibDescr>;
    readonly master_ref: Maybe<BlkMasterInfo>;
    readonly custom: Maybe<McStateExtra>;
}

// split_state#5f327da5 left:^ShardStateUnsplit right:^ShardStateUnsplit = ShardState;

// _ ShardStateUnsplit = ShardState;

export type ShardState = ShardState_split_state | ShardState__;

export interface ShardState_split_state {
    readonly kind: 'ShardState_split_state';
    readonly left: ShardStateUnsplit;
    readonly right: ShardStateUnsplit;
}

export interface ShardState__ {
    readonly kind: 'ShardState__';
    readonly anon0: ShardStateUnsplit;
}

/*
shared_lib_descr$00 lib:^Cell publishers:(Hashmap 256 True)
  = LibDescr;
*/

export interface LibDescr {
    readonly kind: 'LibDescr';
    readonly lib: Cell;
    readonly publishers: Dictionary<bigint, True>;
}

/*
block_info#9bc7a987 version:uint32
  not_master:(## 1)
  after_merge:(## 1) before_split:(## 1)
  after_split:(## 1)
  want_split:Bool want_merge:Bool
  key_block:Bool vert_seqno_incr:(## 1)
  flags:(## 8) { flags <= 1 }
  seq_no:# vert_seq_no:# { vert_seq_no >= vert_seqno_incr }
  { prev_seq_no:# } { ~prev_seq_no + 1 = seq_no }
  shard:ShardIdent gen_utime:uint32
  start_lt:uint64 end_lt:uint64
  gen_validator_list_hash_short:uint32
  gen_catchain_seqno:uint32
  min_ref_mc_seqno:uint32
  prev_key_block_seqno:uint32
  gen_software:flags . 0?GlobalVersion
  master_ref:not_master?^BlkMasterInfo
  prev_ref:^(BlkPrevInfo after_merge)
  prev_vert_ref:vert_seqno_incr?^(BlkPrevInfo 0)
  = BlockInfo;
*/

export interface BlockInfo {
    readonly kind: 'BlockInfo';
    readonly prev_seq_no: number;
    readonly version: number;
    readonly not_master: number;
    readonly after_merge: number;
    readonly before_split: number;
    readonly after_split: number;
    readonly want_split: Bool;
    readonly want_merge: Bool;
    readonly key_block: Bool;
    readonly vert_seqno_incr: number;
    readonly flags: number;
    readonly seq_no: number;
    readonly vert_seq_no: number;
    readonly shard: ShardIdent;
    readonly gen_utime: number;
    readonly start_lt: bigint;
    readonly end_lt: bigint;
    readonly gen_validator_list_hash_short: number;
    readonly gen_catchain_seqno: number;
    readonly min_ref_mc_seqno: number;
    readonly prev_key_block_seqno: number;
    readonly gen_software: GlobalVersion | undefined;
    readonly master_ref: BlkMasterInfo | undefined;
    readonly prev_ref: BlkPrevInfo;
    readonly prev_vert_ref: BlkPrevInfo | undefined;
}

// prev_blk_info$_ prev:ExtBlkRef = BlkPrevInfo 0;

// prev_blks_info$_ prev1:^ExtBlkRef prev2:^ExtBlkRef = BlkPrevInfo 1;

export type BlkPrevInfo = BlkPrevInfo_prev_blk_info | BlkPrevInfo_prev_blks_info;

export interface BlkPrevInfo_prev_blk_info {
    readonly kind: 'BlkPrevInfo_prev_blk_info';
    readonly prev: ExtBlkRef;
}

export interface BlkPrevInfo_prev_blks_info {
    readonly kind: 'BlkPrevInfo_prev_blks_info';
    readonly prev1: ExtBlkRef;
    readonly prev2: ExtBlkRef;
}

/*
block#11ef55aa global_id:int32
  info:^BlockInfo value_flow:^ValueFlow
  state_update:^(MERKLE_UPDATE ShardState)
  extra:^BlockExtra = Block;
*/

export interface Block {
    readonly kind: 'Block';
    readonly global_id: number;
    readonly info: BlockInfo;
    readonly value_flow: ValueFlow;
    readonly state_update: Cell;
    readonly extra: BlockExtra;
}

/*
block_extra in_msg_descr:^InMsgDescr
  out_msg_descr:^OutMsgDescr
  account_blocks:^ShardAccountBlocks
  rand_seed:bits256
  created_by:bits256
  custom:(Maybe ^McBlockExtra) = BlockExtra;
*/

export interface BlockExtra {
    readonly kind: 'BlockExtra';
    readonly in_msg_descr: InMsgDescr;
    readonly out_msg_descr: OutMsgDescr;
    readonly account_blocks: ShardAccountBlocks;
    readonly rand_seed: Buffer;
    readonly created_by: Buffer;
    readonly custom: Maybe<McBlockExtra>;
}

/*
value_flow#b8e48dfb ^[ from_prev_blk:CurrencyCollection
  to_next_blk:CurrencyCollection
  imported:CurrencyCollection
  exported:CurrencyCollection ]
  fees_collected:CurrencyCollection
  ^[
  fees_imported:CurrencyCollection
  recovered:CurrencyCollection
  created:CurrencyCollection
  minted:CurrencyCollection
  ] = ValueFlow;
*/

/*
value_flow_v2#3ebf98b7 ^[ from_prev_blk:CurrencyCollection
  to_next_blk:CurrencyCollection
  imported:CurrencyCollection
  exported:CurrencyCollection ]
  fees_collected:CurrencyCollection
  burned:CurrencyCollection
  ^[
  fees_imported:CurrencyCollection
  recovered:CurrencyCollection
  created:CurrencyCollection
  minted:CurrencyCollection
  ] = ValueFlow;
*/

export type ValueFlow = ValueFlow_value_flow | ValueFlow_value_flow_v2;

export interface ValueFlow_value_flow {
    readonly kind: 'ValueFlow_value_flow';
    readonly from_prev_blk: CurrencyCollection;
    readonly to_next_blk: CurrencyCollection;
    readonly imported: CurrencyCollection;
    readonly exported: CurrencyCollection;
    readonly fees_collected: CurrencyCollection;
    readonly fees_imported: CurrencyCollection;
    readonly recovered: CurrencyCollection;
    readonly created: CurrencyCollection;
    readonly minted: CurrencyCollection;
}

export interface ValueFlow_value_flow_v2 {
    readonly kind: 'ValueFlow_value_flow_v2';
    readonly from_prev_blk: CurrencyCollection;
    readonly to_next_blk: CurrencyCollection;
    readonly imported: CurrencyCollection;
    readonly exported: CurrencyCollection;
    readonly fees_collected: CurrencyCollection;
    readonly burned: CurrencyCollection;
    readonly fees_imported: CurrencyCollection;
    readonly recovered: CurrencyCollection;
    readonly created: CurrencyCollection;
    readonly minted: CurrencyCollection;
}

// bt_leaf$0 {X:Type} leaf:X = BinTree X;

/*
bt_fork$1 {X:Type} left:^(BinTree X) right:^(BinTree X)
          = BinTree X;
*/

export type BinTree<X> = BinTree_bt_leaf<X> | BinTree_bt_fork<X>;

export interface BinTree_bt_leaf<X> {
    readonly kind: 'BinTree_bt_leaf';
    readonly leaf: X;
}

export interface BinTree_bt_fork<X> {
    readonly kind: 'BinTree_bt_fork';
    readonly left: BinTree<X>;
    readonly right: BinTree<X>;
}

// fsm_none$0 = FutureSplitMerge;

// fsm_split$10 split_utime:uint32 interval:uint32 = FutureSplitMerge;

// fsm_merge$11 merge_utime:uint32 interval:uint32 = FutureSplitMerge;

export type FutureSplitMerge = FutureSplitMerge_fsm_none | FutureSplitMerge_fsm_split | FutureSplitMerge_fsm_merge;

export interface FutureSplitMerge_fsm_none {
    readonly kind: 'FutureSplitMerge_fsm_none';
}

export interface FutureSplitMerge_fsm_split {
    readonly kind: 'FutureSplitMerge_fsm_split';
    readonly split_utime: number;
    readonly interval: number;
}

export interface FutureSplitMerge_fsm_merge {
    readonly kind: 'FutureSplitMerge_fsm_merge';
    readonly merge_utime: number;
    readonly interval: number;
}

/*
shard_descr#b seq_no:uint32 reg_mc_seqno:uint32
  start_lt:uint64 end_lt:uint64
  root_hash:bits256 file_hash:bits256
  before_split:Bool before_merge:Bool
  want_split:Bool want_merge:Bool
  nx_cc_updated:Bool flags:(## 3) { flags = 0 }
  next_catchain_seqno:uint32 next_validator_shard:uint64
  min_ref_mc_seqno:uint32 gen_utime:uint32
  split_merge_at:FutureSplitMerge
  fees_collected:CurrencyCollection
  funds_created:CurrencyCollection = ShardDescr;
*/

/*
shard_descr_new#a seq_no:uint32 reg_mc_seqno:uint32
  start_lt:uint64 end_lt:uint64
  root_hash:bits256 file_hash:bits256
  before_split:Bool before_merge:Bool
  want_split:Bool want_merge:Bool
  nx_cc_updated:Bool flags:(## 3) { flags = 0 }
  next_catchain_seqno:uint32 next_validator_shard:uint64
  min_ref_mc_seqno:uint32 gen_utime:uint32
  split_merge_at:FutureSplitMerge
  ^[ fees_collected:CurrencyCollection
     funds_created:CurrencyCollection ] = ShardDescr;
*/

export type ShardDescr = ShardDescr_shard_descr | ShardDescr_shard_descr_new;

export interface ShardDescr_shard_descr {
    readonly kind: 'ShardDescr_shard_descr';
    readonly seq_no: number;
    readonly reg_mc_seqno: number;
    readonly start_lt: bigint;
    readonly end_lt: bigint;
    readonly root_hash: Buffer;
    readonly file_hash: Buffer;
    readonly before_split: Bool;
    readonly before_merge: Bool;
    readonly want_split: Bool;
    readonly want_merge: Bool;
    readonly nx_cc_updated: Bool;
    readonly flags: number;
    readonly next_catchain_seqno: number;
    readonly next_validator_shard: bigint;
    readonly min_ref_mc_seqno: number;
    readonly gen_utime: number;
    readonly split_merge_at: FutureSplitMerge;
    readonly fees_collected: CurrencyCollection;
    readonly funds_created: CurrencyCollection;
}

export interface ShardDescr_shard_descr_new {
    readonly kind: 'ShardDescr_shard_descr_new';
    readonly seq_no: number;
    readonly reg_mc_seqno: number;
    readonly start_lt: bigint;
    readonly end_lt: bigint;
    readonly root_hash: Buffer;
    readonly file_hash: Buffer;
    readonly before_split: Bool;
    readonly before_merge: Bool;
    readonly want_split: Bool;
    readonly want_merge: Bool;
    readonly nx_cc_updated: Bool;
    readonly flags: number;
    readonly next_catchain_seqno: number;
    readonly next_validator_shard: bigint;
    readonly min_ref_mc_seqno: number;
    readonly gen_utime: number;
    readonly split_merge_at: FutureSplitMerge;
    readonly fees_collected: CurrencyCollection;
    readonly funds_created: CurrencyCollection;
}

// _ (HashmapE 32 ^(BinTree ShardDescr)) = ShardHashes;

export interface ShardHashes {
    readonly kind: 'ShardHashes';
    readonly anon0: Dictionary<number, BinTree<ShardDescr>>;
}

// bta_leaf$0 {X:Type} {Y:Type} extra:Y leaf:X = BinTreeAug X Y;

/*
bta_fork$1 {X:Type} {Y:Type} left:^(BinTreeAug X Y)
           right:^(BinTreeAug X Y) extra:Y = BinTreeAug X Y;
*/

export type BinTreeAug<X, Y> = BinTreeAug_bta_leaf<X, Y> | BinTreeAug_bta_fork<X, Y>;

export interface BinTreeAug_bta_leaf<X, Y> {
    readonly kind: 'BinTreeAug_bta_leaf';
    readonly extra: Y;
    readonly leaf: X;
}

export interface BinTreeAug_bta_fork<X, Y> {
    readonly kind: 'BinTreeAug_bta_fork';
    readonly left: BinTreeAug<X, Y>;
    readonly right: BinTreeAug<X, Y>;
    readonly extra: Y;
}

// _ fees:CurrencyCollection create:CurrencyCollection = ShardFeeCreated;

export interface ShardFeeCreated {
    readonly kind: 'ShardFeeCreated';
    readonly fees: CurrencyCollection;
    readonly create: CurrencyCollection;
}

// _ (HashmapAugE 96 ShardFeeCreated ShardFeeCreated) = ShardFees;

export interface ShardFees {
    readonly kind: 'ShardFees';
    readonly anon0: Dictionary<bigint, {value: ShardFeeCreated, extra: ShardFeeCreated}>;
}

/*
_ config_addr:bits256 config:^(Hashmap 32 ^Cell)
  = ConfigParams;
*/

export interface ConfigParams {
    readonly kind: 'ConfigParams';
    readonly config_addr: Buffer;
    readonly config: Dictionary<number, Cell>;
}

/*
validator_info$_
  validator_list_hash_short:uint32
  catchain_seqno:uint32
  nx_cc_updated:Bool
= ValidatorInfo;
*/

export interface ValidatorInfo {
    readonly kind: 'ValidatorInfo';
    readonly validator_list_hash_short: number;
    readonly catchain_seqno: number;
    readonly nx_cc_updated: Bool;
}

/*
validator_base_info$_
  validator_list_hash_short:uint32
  catchain_seqno:uint32
= ValidatorBaseInfo;
*/

export interface ValidatorBaseInfo {
    readonly kind: 'ValidatorBaseInfo';
    readonly validator_list_hash_short: number;
    readonly catchain_seqno: number;
}

// _ key:Bool max_end_lt:uint64 = KeyMaxLt;

export interface KeyMaxLt {
    readonly kind: 'KeyMaxLt';
    readonly key: Bool;
    readonly max_end_lt: bigint;
}

// _ key:Bool blk_ref:ExtBlkRef = KeyExtBlkRef;

export interface KeyExtBlkRef {
    readonly kind: 'KeyExtBlkRef';
    readonly key: Bool;
    readonly blk_ref: ExtBlkRef;
}

// _ (HashmapAugE 32 KeyExtBlkRef KeyMaxLt) = OldMcBlocksInfo;

export interface OldMcBlocksInfo {
    readonly kind: 'OldMcBlocksInfo';
    readonly anon0: Dictionary<number, {value: KeyExtBlkRef, extra: KeyMaxLt}>;
}

// counters#_ last_updated:uint32 total:uint64 cnt2048:uint64 cnt65536:uint64 = Counters;

export interface Counters {
    readonly kind: 'Counters';
    readonly last_updated: number;
    readonly total: bigint;
    readonly cnt2048: bigint;
    readonly cnt65536: bigint;
}

// creator_info#4 mc_blocks:Counters shard_blocks:Counters = CreatorStats;

export interface CreatorStats {
    readonly kind: 'CreatorStats';
    readonly mc_blocks: Counters;
    readonly shard_blocks: Counters;
}

// block_create_stats#17 counters:(HashmapE 256 CreatorStats) = BlockCreateStats;

// block_create_stats_ext#34 counters:(HashmapAugE 256 CreatorStats uint32) = BlockCreateStats;

export type BlockCreateStats = BlockCreateStats_block_create_stats | BlockCreateStats_block_create_stats_ext;

export interface BlockCreateStats_block_create_stats {
    readonly kind: 'BlockCreateStats_block_create_stats';
    readonly counters: Dictionary<bigint, CreatorStats>;
}

export interface BlockCreateStats_block_create_stats_ext {
    readonly kind: 'BlockCreateStats_block_create_stats_ext';
    readonly counters: Dictionary<bigint, {value: CreatorStats, extra: number}>;
}

/*
masterchain_state_extra#cc26
  shard_hashes:ShardHashes
  config:ConfigParams
  ^[ flags:(## 16) { flags <= 1 }
     validator_info:ValidatorInfo
     prev_blocks:OldMcBlocksInfo
     after_key_block:Bool
     last_key_block:(Maybe ExtBlkRef)
     block_create_stats:(flags . 0)?BlockCreateStats ]
  global_balance:CurrencyCollection
= McStateExtra;
*/

export interface McStateExtra {
    readonly kind: 'McStateExtra';
    readonly shard_hashes: ShardHashes;
    readonly config: ConfigParams;
    readonly flags: number;
    readonly validator_info: ValidatorInfo;
    readonly prev_blocks: OldMcBlocksInfo;
    readonly after_key_block: Bool;
    readonly last_key_block: Maybe<ExtBlkRef>;
    readonly block_create_stats: BlockCreateStats | undefined;
    readonly global_balance: CurrencyCollection;
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

// sig_pair$_ node_id_short:bits256 sign:CryptoSignature = CryptoSignaturePair;

export interface CryptoSignaturePair {
    readonly kind: 'CryptoSignaturePair';
    readonly node_id_short: Buffer;
    readonly sign: CryptoSignature;
}

// certificate#4 temp_key:SigPubKey valid_since:uint32 valid_until:uint32 = Certificate;

export interface Certificate {
    readonly kind: 'Certificate';
    readonly temp_key: SigPubKey;
    readonly valid_since: number;
    readonly valid_until: number;
}

// certificate_env#a419b7d certificate:Certificate = CertificateEnv;

/*
signed_certificate$_ certificate:Certificate certificate_signature:CryptoSignature
  = SignedCertificate;
*/

export interface SignedCertificate {
    readonly kind: 'SignedCertificate';
    readonly certificate: Certificate;
    readonly certificate_signature: CryptoSignature;
}

/*
masterchain_block_extra#cca5
  key_block:(## 1)
  shard_hashes:ShardHashes
  shard_fees:ShardFees
  ^[ prev_blk_signatures:(HashmapE 16 CryptoSignaturePair)
     recover_create_msg:(Maybe ^InMsg)
     mint_msg:(Maybe ^InMsg) ]
  config:key_block?ConfigParams
= McBlockExtra;
*/

export interface McBlockExtra {
    readonly kind: 'McBlockExtra';
    readonly key_block: number;
    readonly shard_hashes: ShardHashes;
    readonly shard_fees: ShardFees;
    readonly prev_blk_signatures: Dictionary<number, CryptoSignaturePair>;
    readonly recover_create_msg: Maybe<InMsg>;
    readonly mint_msg: Maybe<InMsg>;
    readonly config: ConfigParams | undefined;
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

/*
cfg_proposal_status#ce expires:uint32 proposal:^ConfigProposal is_critical:Bool
  voters:(HashmapE 16 True) remaining_weight:int64 validator_set_id:uint256
  rounds_remaining:uint8 wins:uint8 losses:uint8 = ConfigProposalStatus;
*/

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

/*
block_signatures_pure#_ sig_count:uint32 sig_weight:uint64
  signatures:(HashmapE 16 CryptoSignaturePair) = BlockSignaturesPure;
*/

export interface BlockSignaturesPure {
    readonly kind: 'BlockSignaturesPure';
    readonly sig_count: number;
    readonly sig_weight: bigint;
    readonly signatures: Dictionary<number, CryptoSignaturePair>;
}

// block_signatures#11 validator_info:ValidatorBaseInfo pure_signatures:BlockSignaturesPure = BlockSignatures;

// block_proof#c3 proof_for:BlockIdExt root:^Cell signatures:(Maybe ^BlockSignatures) = BlockProof;

// chain_empty$_ = ProofChain 0;

// chain_link$_ {n:#} root:^Cell prev:n?^(ProofChain n) = ProofChain (n + 1);

export type ProofChain = ProofChain_chain_empty | ProofChain_chain_link;

export interface ProofChain_chain_empty {
    readonly kind: 'ProofChain_chain_empty';
}

export interface ProofChain_chain_link {
    readonly kind: 'ProofChain_chain_link';
    readonly n: number;
    readonly root: Cell;
    readonly prev: ProofChain | undefined;
}

/*
top_block_descr#d5 proof_for:BlockIdExt signatures:(Maybe ^BlockSignatures)
  len:(## 8) { len >= 1 } { len <= 8 } chain:(ProofChain len) = TopBlockDescr;
*/

// top_block_descr_set#4ac789f3 collection:(HashmapE 96 ^TopBlockDescr) = TopBlockDescrSet;

/*
prod_info#34 utime:uint32 mc_blk_ref:ExtBlkRef state_proof:^(MERKLE_PROOF Block)
  prod_proof:^(MERKLE_PROOF ShardState) = ProducerInfo;
*/

export interface ProducerInfo {
    readonly kind: 'ProducerInfo';
    readonly utime: number;
    readonly mc_blk_ref: ExtBlkRef;
    readonly state_proof: MERKLE_PROOF<Block>;
    readonly prod_proof: MERKLE_PROOF<ShardState>;
}

// no_blk_gen from_utime:uint32 prod_info:^ProducerInfo = ComplaintDescr;

// no_blk_gen_diff prod_info_old:^ProducerInfo prod_info_new:^ProducerInfo = ComplaintDescr;

export interface ComplaintDescr_no_blk_gen {
    readonly kind: 'ComplaintDescr_no_blk_gen';
    readonly from_utime: number;
    readonly prod_info: ProducerInfo;
}

export interface ComplaintDescr_no_blk_gen_diff {
    readonly kind: 'ComplaintDescr_no_blk_gen_diff';
    readonly prod_info_old: ProducerInfo;
    readonly prod_info_new: ProducerInfo;
}

// validator_complaint#bc validator_pubkey:bits256 description:^ComplaintDescr created_at:uint32 severity:uint8 reward_addr:uint256 paid:Grams suggested_fine:Grams suggested_fine_part:uint32 = ValidatorComplaint;

// complaint_status#2d complaint:^ValidatorComplaint voters:(HashmapE 16 True) vset_id:uint256 weight_remaining:int64 = ValidatorComplaintStatus;

// vm_stk_null#00 = VmStackValue;

// vm_stk_tinyint#01 value:int64 = VmStackValue;

// vm_stk_int#0201 value:int257 = VmStackValue;

// vm_stk_nan#02ff = VmStackValue;

// vm_stk_cell#03 cell:^Cell = VmStackValue;

// vm_stk_slice#04 _:VmCellSlice = VmStackValue;

// vm_stk_builder#05 cell:^Cell = VmStackValue;

// vm_stk_cont#06 cont:VmCont = VmStackValue;

// vm_stk_tuple#07 len:(## 16) data:(VmTuple len) = VmStackValue;

export type VmStackValue = VmStackValue_vm_stk_null | VmStackValue_vm_stk_tinyint | VmStackValue_vm_stk_int | VmStackValue_vm_stk_nan | VmStackValue_vm_stk_cell | VmStackValue_vm_stk_slice | VmStackValue_vm_stk_builder | VmStackValue_vm_stk_cont | VmStackValue_vm_stk_tuple;

export interface VmStackValue_vm_stk_null {
    readonly kind: 'VmStackValue_vm_stk_null';
}

export interface VmStackValue_vm_stk_tinyint {
    readonly kind: 'VmStackValue_vm_stk_tinyint';
    readonly value: bigint;
}

export interface VmStackValue_vm_stk_int {
    readonly kind: 'VmStackValue_vm_stk_int';
    readonly value: bigint;
}

export interface VmStackValue_vm_stk_nan {
    readonly kind: 'VmStackValue_vm_stk_nan';
}

export interface VmStackValue_vm_stk_cell {
    readonly kind: 'VmStackValue_vm_stk_cell';
    readonly _cell: Cell;
}

export interface VmStackValue_vm_stk_slice {
    readonly kind: 'VmStackValue_vm_stk_slice';
    readonly _: VmCellSlice;
}

export interface VmStackValue_vm_stk_builder {
    readonly kind: 'VmStackValue_vm_stk_builder';
    readonly _cell: Cell;
}

export interface VmStackValue_vm_stk_cont {
    readonly kind: 'VmStackValue_vm_stk_cont';
    readonly cont: VmCont;
}

export interface VmStackValue_vm_stk_tuple {
    readonly kind: 'VmStackValue_vm_stk_tuple';
    readonly len: number;
    readonly data: VmTuple;
}

/*
_ cell:^Cell st_bits:(## 10) end_bits:(## 10) { st_bits <= end_bits }
  st_ref:(#<= 4) end_ref:(#<= 4) { st_ref <= end_ref } = VmCellSlice;
*/

export interface VmCellSlice {
    readonly kind: 'VmCellSlice';
    readonly _cell: Cell;
    readonly st_bits: number;
    readonly end_bits: number;
    readonly st_ref: number;
    readonly end_ref: number;
}

// vm_tupref_nil$_ = VmTupleRef 0;

// vm_tupref_single$_ entry:^VmStackValue = VmTupleRef 1;

// vm_tupref_any$_ {n:#} ref:^(VmTuple (n + 2)) = VmTupleRef (n + 2);

export type VmTupleRef = VmTupleRef_vm_tupref_nil | VmTupleRef_vm_tupref_single | VmTupleRef_vm_tupref_any;

export interface VmTupleRef_vm_tupref_nil {
    readonly kind: 'VmTupleRef_vm_tupref_nil';
}

export interface VmTupleRef_vm_tupref_single {
    readonly kind: 'VmTupleRef_vm_tupref_single';
    readonly entry: VmStackValue;
}

export interface VmTupleRef_vm_tupref_any {
    readonly kind: 'VmTupleRef_vm_tupref_any';
    readonly n: number;
    readonly ref: VmTuple;
}

// vm_tuple_nil$_ = VmTuple 0;

// vm_tuple_tcons$_ {n:#} head:(VmTupleRef n) tail:^VmStackValue = VmTuple (n + 1);

export type VmTuple = VmTuple_vm_tuple_nil | VmTuple_vm_tuple_tcons;

export interface VmTuple_vm_tuple_nil {
    readonly kind: 'VmTuple_vm_tuple_nil';
}

export interface VmTuple_vm_tuple_tcons {
    readonly kind: 'VmTuple_vm_tuple_tcons';
    readonly n: number;
    readonly head: VmTupleRef;
    readonly tail: VmStackValue;
}

// vm_stack#_ depth:(## 24) stack:(VmStackList depth) = VmStack;

// vm_stk_nil#_ = VmStackList 0;

// vm_stk_cons#_ {n:#} rest:^(VmStackList n) tos:VmStackValue = VmStackList (n + 1);

export type VmStackList = VmStackList_vm_stk_nil | VmStackList_vm_stk_cons;

export interface VmStackList_vm_stk_nil {
    readonly kind: 'VmStackList_vm_stk_nil';
}

export interface VmStackList_vm_stk_cons {
    readonly kind: 'VmStackList_vm_stk_cons';
    readonly n: number;
    readonly rest: VmStackList;
    readonly tos: VmStackValue;
}

// _ cregs:(HashmapE 4 VmStackValue) = VmSaveList;

export interface VmSaveList {
    readonly kind: 'VmSaveList';
    readonly cregs: Dictionary<number, VmStackValue>;
}

/*
gas_limits#_ remaining:int64 _:^[ max_limit:int64 cur_limit:int64 credit:int64 ]
  = VmGasLimits;
*/

// _ libraries:(HashmapE 256 ^Cell) = VmLibraries;

/*
vm_ctl_data$_ nargs:(Maybe uint13) stack:(Maybe VmStack) save:VmSaveList
cp:(Maybe int16) = VmControlData;
*/

export interface VmControlData {
    readonly kind: 'VmControlData';
    readonly nargs: Maybe<number>;
    readonly stack: Maybe<TupleItem[]>;
    readonly save: VmSaveList;
    readonly cp: Maybe<number>;
}

// vmc_std$00 cdata:VmControlData code:VmCellSlice = VmCont;

// vmc_envelope$01 cdata:VmControlData next:^VmCont = VmCont;

// vmc_quit$1000 exit_code:int32 = VmCont;

// vmc_quit_exc$1001 = VmCont;

// vmc_repeat$10100 count:uint63 body:^VmCont after:^VmCont = VmCont;

// vmc_until$110000 body:^VmCont after:^VmCont = VmCont;

// vmc_again$110001 body:^VmCont = VmCont;

/*
vmc_while_cond$110010 cond:^VmCont body:^VmCont
after:^VmCont = VmCont;
*/

/*
vmc_while_body$110011 cond:^VmCont body:^VmCont
after:^VmCont = VmCont;
*/

// vmc_pushint$1111 value:int32 next:^VmCont = VmCont;

export type VmCont = VmCont_vmc_std | VmCont_vmc_envelope | VmCont_vmc_quit | VmCont_vmc_quit_exc | VmCont_vmc_repeat | VmCont_vmc_until | VmCont_vmc_again | VmCont_vmc_while_cond | VmCont_vmc_while_body | VmCont_vmc_pushint;

export interface VmCont_vmc_std {
    readonly kind: 'VmCont_vmc_std';
    readonly cdata: VmControlData;
    readonly code: VmCellSlice;
}

export interface VmCont_vmc_envelope {
    readonly kind: 'VmCont_vmc_envelope';
    readonly cdata: VmControlData;
    readonly next: VmCont;
}

export interface VmCont_vmc_quit {
    readonly kind: 'VmCont_vmc_quit';
    readonly exit_code: number;
}

export interface VmCont_vmc_quit_exc {
    readonly kind: 'VmCont_vmc_quit_exc';
}

export interface VmCont_vmc_repeat {
    readonly kind: 'VmCont_vmc_repeat';
    readonly count: bigint;
    readonly body: VmCont;
    readonly after: VmCont;
}

export interface VmCont_vmc_until {
    readonly kind: 'VmCont_vmc_until';
    readonly body: VmCont;
    readonly after: VmCont;
}

export interface VmCont_vmc_again {
    readonly kind: 'VmCont_vmc_again';
    readonly body: VmCont;
}

export interface VmCont_vmc_while_cond {
    readonly kind: 'VmCont_vmc_while_cond';
    readonly cond: VmCont;
    readonly body: VmCont;
    readonly after: VmCont;
}

export interface VmCont_vmc_while_body {
    readonly kind: 'VmCont_vmc_while_body';
    readonly cond: VmCont;
    readonly body: VmCont;
    readonly after: VmCont;
}

export interface VmCont_vmc_pushint {
    readonly kind: 'VmCont_vmc_pushint';
    readonly value: number;
    readonly next: VmCont;
}

// _ (HashmapE 256 ^DNSRecord) = DNS_RecordSet;

// chunk_ref_empty$_ = TextChunkRef 0;

// chunk_ref$_ {n:#} ref:^(TextChunks (n + 1)) = TextChunkRef (n + 1);

export type TextChunkRef = TextChunkRef_chunk_ref_empty | TextChunkRef_chunk_ref;

export interface TextChunkRef_chunk_ref_empty {
    readonly kind: 'TextChunkRef_chunk_ref_empty';
}

export interface TextChunkRef_chunk_ref {
    readonly kind: 'TextChunkRef_chunk_ref';
    readonly n: number;
    readonly ref: TextChunks;
}

// text_chunk_empty$_ = TextChunks 0;

// text_chunk$_ {n:#} len:(## 8) data:(bits (len * 8)) next:(TextChunkRef n) = TextChunks (n + 1);

export type TextChunks = TextChunks_text_chunk_empty | TextChunks_text_chunk;

export interface TextChunks_text_chunk_empty {
    readonly kind: 'TextChunks_text_chunk_empty';
}

export interface TextChunks_text_chunk {
    readonly kind: 'TextChunks_text_chunk';
    readonly n: number;
    readonly len: number;
    readonly data: BitString;
    readonly next: TextChunkRef;
}

// text$_ chunks:(## 8) rest:(TextChunks chunks) = Text;

export interface Text {
    readonly kind: 'Text';
    readonly chunks: number;
    readonly rest: TextChunks;
}

// dns_text#1eda _:Text = DNSRecord;

// dns_next_resolver#ba93 resolver:MsgAddressInt = DNSRecord;

/*
dns_adnl_address#ad01 adnl_addr:bits256 flags:(## 8) { flags <= 1 }
  proto_list:flags . 0?ProtoList = DNSRecord;
*/

/*
dns_smc_address#9fd3 smc_addr:MsgAddressInt flags:(## 8) { flags <= 1 }
  cap_list:flags . 0?SmcCapList = DNSRecord;
*/

// dns_storage_address#7473 bag_id:bits256 = DNSRecord;

// proto_list_nil$0 = ProtoList;

// proto_list_next$1 head:Protocol tail:ProtoList = ProtoList;

export type ProtoList = ProtoList_proto_list_nil | ProtoList_proto_list_next;

export interface ProtoList_proto_list_nil {
    readonly kind: 'ProtoList_proto_list_nil';
}

export interface ProtoList_proto_list_next {
    readonly kind: 'ProtoList_proto_list_next';
    readonly head: Protocol;
    readonly tail: ProtoList;
}

// proto_http#4854 = Protocol;

export interface Protocol {
    readonly kind: 'Protocol';
}

// cap_list_nil$0 = SmcCapList;

// cap_list_next$1 head:SmcCapability tail:SmcCapList = SmcCapList;

export type SmcCapList = SmcCapList_cap_list_nil | SmcCapList_cap_list_next;

export interface SmcCapList_cap_list_nil {
    readonly kind: 'SmcCapList_cap_list_nil';
}

export interface SmcCapList_cap_list_next {
    readonly kind: 'SmcCapList_cap_list_next';
    readonly head: SmcCapability;
    readonly tail: SmcCapList;
}

// cap_method_seqno#5371 = SmcCapability;

// cap_method_pubkey#71f4 = SmcCapability;

// cap_is_wallet#2177 = SmcCapability;

// cap_name#ff name:Text = SmcCapability;

export type SmcCapability = SmcCapability_cap_method_seqno | SmcCapability_cap_method_pubkey | SmcCapability_cap_is_wallet | SmcCapability_cap_name;

export interface SmcCapability_cap_method_seqno {
    readonly kind: 'SmcCapability_cap_method_seqno';
}

export interface SmcCapability_cap_method_pubkey {
    readonly kind: 'SmcCapability_cap_method_pubkey';
}

export interface SmcCapability_cap_is_wallet {
    readonly kind: 'SmcCapability_cap_is_wallet';
}

export interface SmcCapability_cap_name {
    readonly kind: 'SmcCapability_cap_name';
    readonly name: Text;
}

/*
chan_config$_  init_timeout:uint32 close_timeout:uint32 a_key:bits256 b_key:bits256
  a_addr:^MsgAddressInt b_addr:^MsgAddressInt channel_id:uint64 min_A_extra:Grams = ChanConfig;
*/

// chan_state_init$000  signed_A:Bool signed_B:Bool min_A:Grams min_B:Grams expire_at:uint32 A:Grams B:Grams = ChanState;

// chan_state_close$001 signed_A:Bool signed_B:Bool promise_A:Grams promise_B:Grams expire_at:uint32 A:Grams B:Grams = ChanState;

// chan_state_payout$010 A:Grams B:Grams = ChanState;

// chan_promise$_ channel_id:uint64 promise_A:Grams promise_B:Grams = ChanPromise;

export interface ChanPromise {
    readonly kind: 'ChanPromise';
    readonly channel_id: bigint;
    readonly promise_A: bigint;
    readonly promise_B: bigint;
}

// chan_signed_promise#_ sig:(Maybe ^bits512) promise:ChanPromise = ChanSignedPromise;

export interface ChanSignedPromise {
    readonly kind: 'ChanSignedPromise';
    readonly sig: Maybe<Buffer>;
    readonly promise: ChanPromise;
}

// chan_msg_init#27317822 inc_A:Grams inc_B:Grams min_A:Grams min_B:Grams channel_id:uint64 = ChanMsg;

// chan_msg_close#f28ae183 extra_A:Grams extra_B:Grams promise:ChanSignedPromise  = ChanMsg;

// chan_msg_timeout#43278a28 = ChanMsg;

// chan_msg_payout#37fe7810 = ChanMsg;

export interface ChanMsg_chan_msg_init {
    readonly kind: 'ChanMsg_chan_msg_init';
    readonly inc_A: bigint;
    readonly inc_B: bigint;
    readonly min_A: bigint;
    readonly min_B: bigint;
    readonly channel_id: bigint;
}

export interface ChanMsg_chan_msg_close {
    readonly kind: 'ChanMsg_chan_msg_close';
    readonly extra_A: bigint;
    readonly extra_B: bigint;
    readonly promise: ChanSignedPromise;
}

export interface ChanMsg_chan_msg_timeout {
    readonly kind: 'ChanMsg_chan_msg_timeout';
}

export interface ChanMsg_chan_msg_payout {
    readonly kind: 'ChanMsg_chan_msg_payout';
}

// chan_signed_msg$_ sig_A:(Maybe ^bits512) sig_B:(Maybe ^bits512) msg:ChanMsg = ChanSignedMsg;

// chan_op_cmd#912838d1 msg:ChanSignedMsg = ChanOp;

// chan_data$_ config:^ChanConfig state:^ChanState = ChanData;

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

// left$0 {X:Type} {Y:Type} value:X = Either X Y;

// right$1 {X:Type} {Y:Type} value:Y = Either X Y;

export function loadEither<X, Y>(slice: Slice, loadX: (slice: Slice) => X, loadY: (slice: Slice) => Y): Either<X, Y> {
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b0))) {
        slice.loadUint(1);
        let value: X = loadX(slice);
        return {
            kind: 'Either_left',
            value: value,
        }

    }
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b1))) {
        slice.loadUint(1);
        let value: Y = loadY(slice);
        return {
            kind: 'Either_right',
            value: value,
        }

    }
    throw new Error('Expected one of "Either_left", "Either_right" in loading "Either", but data does not satisfy any constructor');
}

export function storeEither<X, Y>(either: Either<X, Y>, storeX: (x: X) => (builder: Builder) => void, storeY: (y: Y) => (builder: Builder) => void): (builder: Builder) => void {
    if ((either.kind == 'Either_left')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
            storeX(either.value)(builder);
        })

    }
    if ((either.kind == 'Either_right')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1, 1);
            storeY(either.value)(builder);
        })

    }
    throw new Error('Expected one of "Either_left", "Either_right" in loading "Either", but data does not satisfy any constructor');
}

// pair$_ {X:Type} {Y:Type} first:X second:Y = Both X Y;

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

// _ {n:#} _:(Hashmap n True) = BitstringSet n;

export function hashmapAug_get_l(label: HmLabel): number {
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
ahm_edge#_ {n:#} {X:Type} {Y:Type} {l:#} {m:#}
  label:(HmLabel ~l n) {n = (~m) + l}
  node:(HashmapAugNode m X Y) = HashmapAug n X Y;
*/

export function loadHashmapAug<X, Y>(slice: Slice, n: number, loadX: (slice: Slice) => X, loadY: (slice: Slice) => Y): HashmapAug<X, Y> {
    let label: HmLabel = loadHmLabel(slice, n);
    let l = hashmapAug_get_l(label);
    let node: HashmapAugNode<X, Y> = loadHashmapAugNode<X, Y>(slice, (n - l), loadX, loadY);
    return {
        kind: 'HashmapAug',
        n: n,
        m: (n - l),
        label: label,
        l: l,
        node: node,
    }

}

export function storeHashmapAug<X, Y>(hashmapAug: HashmapAug<X, Y>, storeX: (x: X) => (builder: Builder) => void, storeY: (y: Y) => (builder: Builder) => void): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeHmLabel(hashmapAug.label)(builder);
        storeHashmapAugNode<X, Y>(hashmapAug.node, storeX, storeY)(builder);
    })

}

// ahmn_leaf#_ {X:Type} {Y:Type} extra:Y value:X = HashmapAugNode 0 X Y;

/*
ahmn_fork#_ {n:#} {X:Type} {Y:Type} left:^(HashmapAug n X Y)
  right:^(HashmapAug n X Y) extra:Y = HashmapAugNode (n + 1) X Y;
*/

export function loadHashmapAugNode<X, Y>(slice: Slice, arg0: number, loadX: (slice: Slice) => X, loadY: (slice: Slice) => Y): HashmapAugNode<X, Y> {
    if ((arg0 == 0)) {
        let extra: Y = loadY(slice);
        let value: X = loadX(slice);
        return {
            kind: 'HashmapAugNode_ahmn_leaf',
            extra: extra,
            value: value,
        }

    }
    if (true) {
        let slice1 = slice.loadRef().beginParse(true);
        let left: HashmapAug<X, Y> = loadHashmapAug<X, Y>(slice1, (arg0 - 1), loadX, loadY);
        let slice2 = slice.loadRef().beginParse(true);
        let right: HashmapAug<X, Y> = loadHashmapAug<X, Y>(slice2, (arg0 - 1), loadX, loadY);
        let extra: Y = loadY(slice);
        return {
            kind: 'HashmapAugNode_ahmn_fork',
            n: (arg0 - 1),
            left: left,
            right: right,
            extra: extra,
        }

    }
    throw new Error('Expected one of "HashmapAugNode_ahmn_leaf", "HashmapAugNode_ahmn_fork" in loading "HashmapAugNode", but data does not satisfy any constructor');
}

export function storeHashmapAugNode<X, Y>(hashmapAugNode: HashmapAugNode<X, Y>, storeX: (x: X) => (builder: Builder) => void, storeY: (y: Y) => (builder: Builder) => void): (builder: Builder) => void {
    if ((hashmapAugNode.kind == 'HashmapAugNode_ahmn_leaf')) {
        return ((builder: Builder) => {
            storeY(hashmapAugNode.extra)(builder);
            storeX(hashmapAugNode.value)(builder);
        })

    }
    if ((hashmapAugNode.kind == 'HashmapAugNode_ahmn_fork')) {
        return ((builder: Builder) => {
            let cell1 = beginCell();
            storeHashmapAug<X, Y>(hashmapAugNode.left, storeX, storeY)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeHashmapAug<X, Y>(hashmapAugNode.right, storeX, storeY)(cell2);
            builder.storeRef(cell2);
            storeY(hashmapAugNode.extra)(builder);
        })

    }
    throw new Error('Expected one of "HashmapAugNode_ahmn_leaf", "HashmapAugNode_ahmn_fork" in loading "HashmapAugNode", but data does not satisfy any constructor');
}

export function varHashmap_get_l(label: HmLabel): number {
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
vhm_edge#_ {n:#} {X:Type} {l:#} {m:#} label:(HmLabel ~l n)
           {n = (~m) + l} node:(VarHashmapNode m X)
           = VarHashmap n X;
*/

export function loadVarHashmap<X>(slice: Slice, n: number, loadX: (slice: Slice) => X): VarHashmap<X> {
    let label: HmLabel = loadHmLabel(slice, n);
    let l = varHashmap_get_l(label);
    let node: VarHashmapNode<X> = loadVarHashmapNode<X>(slice, (n - l), loadX);
    return {
        kind: 'VarHashmap',
        n: n,
        m: (n - l),
        label: label,
        l: l,
        node: node,
    }

}

export function storeVarHashmap<X>(varHashmap: VarHashmap<X>, storeX: (x: X) => (builder: Builder) => void): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeHmLabel(varHashmap.label)(builder);
        storeVarHashmapNode<X>(varHashmap.node, storeX)(builder);
    })

}

// vhmn_leaf$00 {n:#} {X:Type} value:X = VarHashmapNode n X;

/*
vhmn_fork$01 {n:#} {X:Type} left:^(VarHashmap n X)
             right:^(VarHashmap n X) value:(Maybe X)
             = VarHashmapNode (n + 1) X;
*/

/*
vhmn_cont$1 {n:#} {X:Type} branch:Bit child:^(VarHashmap n X)
            value:X = VarHashmapNode (n + 1) X;
*/

export function loadVarHashmapNode<X>(slice: Slice, arg0: number, loadX: (slice: Slice) => X): VarHashmapNode<X> {
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b00))) {
        slice.loadUint(2);
        let value: X = loadX(slice);
        return {
            kind: 'VarHashmapNode_vhmn_leaf',
            n: arg0,
            value: value,
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b01))) {
        slice.loadUint(2);
        let slice1 = slice.loadRef().beginParse(true);
        let left: VarHashmap<X> = loadVarHashmap<X>(slice1, (arg0 - 1), loadX);
        let slice2 = slice.loadRef().beginParse(true);
        let right: VarHashmap<X> = loadVarHashmap<X>(slice2, (arg0 - 1), loadX);
        let value: Maybe<X> = loadMaybe<X>(slice, loadX);
        return {
            kind: 'VarHashmapNode_vhmn_fork',
            n: (arg0 - 1),
            left: left,
            right: right,
            value: value,
        }

    }
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b1))) {
        slice.loadUint(1);
        let branch: boolean = slice.loadBit();
        let slice1 = slice.loadRef().beginParse(true);
        let child: VarHashmap<X> = loadVarHashmap<X>(slice1, (arg0 - 1), loadX);
        let value: X = loadX(slice);
        return {
            kind: 'VarHashmapNode_vhmn_cont',
            n: (arg0 - 1),
            branch: branch,
            child: child,
            value: value,
        }

    }
    throw new Error('Expected one of "VarHashmapNode_vhmn_leaf", "VarHashmapNode_vhmn_fork", "VarHashmapNode_vhmn_cont" in loading "VarHashmapNode", but data does not satisfy any constructor');
}

export function storeVarHashmapNode<X>(varHashmapNode: VarHashmapNode<X>, storeX: (x: X) => (builder: Builder) => void): (builder: Builder) => void {
    if ((varHashmapNode.kind == 'VarHashmapNode_vhmn_leaf')) {
        return ((builder: Builder) => {
            builder.storeUint(0b00, 2);
            storeX(varHashmapNode.value)(builder);
        })

    }
    if ((varHashmapNode.kind == 'VarHashmapNode_vhmn_fork')) {
        return ((builder: Builder) => {
            builder.storeUint(0b01, 2);
            let cell1 = beginCell();
            storeVarHashmap<X>(varHashmapNode.left, storeX)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeVarHashmap<X>(varHashmapNode.right, storeX)(cell2);
            builder.storeRef(cell2);
            storeMaybe<X>(varHashmapNode.value, storeX)(builder);
        })

    }
    if ((varHashmapNode.kind == 'VarHashmapNode_vhmn_cont')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1, 1);
            builder.storeBit(varHashmapNode.branch);
            let cell1 = beginCell();
            storeVarHashmap<X>(varHashmapNode.child, storeX)(cell1);
            builder.storeRef(cell1);
            storeX(varHashmapNode.value)(builder);
        })

    }
    throw new Error('Expected one of "VarHashmapNode_vhmn_leaf", "VarHashmapNode_vhmn_fork", "VarHashmapNode_vhmn_cont" in loading "VarHashmapNode", but data does not satisfy any constructor');
}

// vhme_empty$0 {n:#} {X:Type} = VarHashmapE n X;

/*
vhme_root$1 {n:#} {X:Type} root:^(VarHashmap n X)
            = VarHashmapE n X;
*/

export function pfxHashmap_get_l(label: HmLabel): number {
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
phm_edge#_ {n:#} {X:Type} {l:#} {m:#} label:(HmLabel ~l n)
           {n = (~m) + l} node:(PfxHashmapNode m X)
           = PfxHashmap n X;
*/

export function loadPfxHashmap<X>(slice: Slice, n: number, loadX: (slice: Slice) => X): PfxHashmap<X> {
    let label: HmLabel = loadHmLabel(slice, n);
    let l = pfxHashmap_get_l(label);
    let node: PfxHashmapNode<X> = loadPfxHashmapNode<X>(slice, (n - l), loadX);
    return {
        kind: 'PfxHashmap',
        n: n,
        m: (n - l),
        label: label,
        l: l,
        node: node,
    }

}

export function storePfxHashmap<X>(pfxHashmap: PfxHashmap<X>, storeX: (x: X) => (builder: Builder) => void): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeHmLabel(pfxHashmap.label)(builder);
        storePfxHashmapNode<X>(pfxHashmap.node, storeX)(builder);
    })

}

// phmn_leaf$0 {n:#} {X:Type} value:X = PfxHashmapNode n X;

/*
phmn_fork$1 {n:#} {X:Type} left:^(PfxHashmap n X)
            right:^(PfxHashmap n X) = PfxHashmapNode (n + 1) X;
*/

export function loadPfxHashmapNode<X>(slice: Slice, arg0: number, loadX: (slice: Slice) => X): PfxHashmapNode<X> {
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b0))) {
        slice.loadUint(1);
        let value: X = loadX(slice);
        return {
            kind: 'PfxHashmapNode_phmn_leaf',
            n: arg0,
            value: value,
        }

    }
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b1))) {
        slice.loadUint(1);
        let slice1 = slice.loadRef().beginParse(true);
        let left: PfxHashmap<X> = loadPfxHashmap<X>(slice1, (arg0 - 1), loadX);
        let slice2 = slice.loadRef().beginParse(true);
        let right: PfxHashmap<X> = loadPfxHashmap<X>(slice2, (arg0 - 1), loadX);
        return {
            kind: 'PfxHashmapNode_phmn_fork',
            n: (arg0 - 1),
            left: left,
            right: right,
        }

    }
    throw new Error('Expected one of "PfxHashmapNode_phmn_leaf", "PfxHashmapNode_phmn_fork" in loading "PfxHashmapNode", but data does not satisfy any constructor');
}

export function storePfxHashmapNode<X>(pfxHashmapNode: PfxHashmapNode<X>, storeX: (x: X) => (builder: Builder) => void): (builder: Builder) => void {
    if ((pfxHashmapNode.kind == 'PfxHashmapNode_phmn_leaf')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
            storeX(pfxHashmapNode.value)(builder);
        })

    }
    if ((pfxHashmapNode.kind == 'PfxHashmapNode_phmn_fork')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1, 1);
            let cell1 = beginCell();
            storePfxHashmap<X>(pfxHashmapNode.left, storeX)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storePfxHashmap<X>(pfxHashmapNode.right, storeX)(cell2);
            builder.storeRef(cell2);
        })

    }
    throw new Error('Expected one of "PfxHashmapNode_phmn_leaf", "PfxHashmapNode_phmn_fork" in loading "PfxHashmapNode", but data does not satisfy any constructor');
}

// phme_empty$0 {n:#} {X:Type} = PfxHashmapE n X;

/*
phme_root$1 {n:#} {X:Type} root:^(PfxHashmap n X)
            = PfxHashmapE n X;
*/

/*
anycast_info$_ depth:(#<= 30) { depth >= 1 }
   rewrite_pfx:(bits depth) = Anycast;
*/

// _ grams:Grams = Coins;

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

/*
currencies$_ grams:Grams other:ExtraCurrencyCollection
           = CurrencyCollection;
*/

export function loadCurrencyCollection(slice: Slice): CurrencyCollection {
    let grams: bigint = slice.loadCoins();
    let other: ExtraCurrencyCollection = loadExtraCurrencyCollection(slice);
    return {
        kind: 'CurrencyCollection',
        grams: grams,
        other: other,
    }

}

export function storeCurrencyCollection(currencyCollection: CurrencyCollection): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeCoins(currencyCollection.grams);
        storeExtraCurrencyCollection(currencyCollection.other)(builder);
    })

}

/*
int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool
  src:MsgAddressInt dest:MsgAddressInt
  value:CurrencyCollection ihr_fee:Grams fwd_fee:Grams
  created_lt:uint64 created_at:uint32 = CommonMsgInfo;
*/

/*
ext_in_msg_info$10 src:MsgAddressExt dest:MsgAddressInt
  import_fee:Grams = CommonMsgInfo;
*/

/*
ext_out_msg_info$11 src:MsgAddressInt dest:MsgAddressExt
  created_lt:uint64 created_at:uint32 = CommonMsgInfo;
*/

export function loadCommonMsgInfo(slice: Slice): CommonMsgInfo {
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b0))) {
        slice.loadUint(1);
        let ihr_disabled: Bool = loadBool(slice);
        let bounce: Bool = loadBool(slice);
        let bounced: Bool = loadBool(slice);
        let src: Address = slice.loadAddress();
        let dest: Address = slice.loadAddress();
        let value: CurrencyCollection = loadCurrencyCollection(slice);
        let ihr_fee: bigint = slice.loadCoins();
        let fwd_fee: bigint = slice.loadCoins();
        let created_lt: bigint = slice.loadUintBig(64);
        let created_at: number = slice.loadUint(32);
        return {
            kind: 'CommonMsgInfo_int_msg_info',
            ihr_disabled: ihr_disabled,
            bounce: bounce,
            bounced: bounced,
            src: src,
            dest: dest,
            value: value,
            ihr_fee: ihr_fee,
            fwd_fee: fwd_fee,
            created_lt: created_lt,
            created_at: created_at,
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b10))) {
        slice.loadUint(2);
        let src: ExternalAddress | null = slice.loadMaybeExternalAddress();
        let dest: Address = slice.loadAddress();
        let import_fee: bigint = slice.loadCoins();
        return {
            kind: 'CommonMsgInfo_ext_in_msg_info',
            src: src,
            dest: dest,
            import_fee: import_fee,
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b11))) {
        slice.loadUint(2);
        let src: Address = slice.loadAddress();
        let dest: ExternalAddress | null = slice.loadMaybeExternalAddress();
        let created_lt: bigint = slice.loadUintBig(64);
        let created_at: number = slice.loadUint(32);
        return {
            kind: 'CommonMsgInfo_ext_out_msg_info',
            src: src,
            dest: dest,
            created_lt: created_lt,
            created_at: created_at,
        }

    }
    throw new Error('Expected one of "CommonMsgInfo_int_msg_info", "CommonMsgInfo_ext_in_msg_info", "CommonMsgInfo_ext_out_msg_info" in loading "CommonMsgInfo", but data does not satisfy any constructor');
}

export function storeCommonMsgInfo(commonMsgInfo: CommonMsgInfo): (builder: Builder) => void {
    if ((commonMsgInfo.kind == 'CommonMsgInfo_int_msg_info')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
            storeBool(commonMsgInfo.ihr_disabled)(builder);
            storeBool(commonMsgInfo.bounce)(builder);
            storeBool(commonMsgInfo.bounced)(builder);
            builder.storeAddress(commonMsgInfo.src);
            builder.storeAddress(commonMsgInfo.dest);
            storeCurrencyCollection(commonMsgInfo.value)(builder);
            builder.storeCoins(commonMsgInfo.ihr_fee);
            builder.storeCoins(commonMsgInfo.fwd_fee);
            builder.storeUint(commonMsgInfo.created_lt, 64);
            builder.storeUint(commonMsgInfo.created_at, 32);
        })

    }
    if ((commonMsgInfo.kind == 'CommonMsgInfo_ext_in_msg_info')) {
        return ((builder: Builder) => {
            builder.storeUint(0b10, 2);
            builder.storeAddress(commonMsgInfo.src);
            builder.storeAddress(commonMsgInfo.dest);
            builder.storeCoins(commonMsgInfo.import_fee);
        })

    }
    if ((commonMsgInfo.kind == 'CommonMsgInfo_ext_out_msg_info')) {
        return ((builder: Builder) => {
            builder.storeUint(0b11, 2);
            builder.storeAddress(commonMsgInfo.src);
            builder.storeAddress(commonMsgInfo.dest);
            builder.storeUint(commonMsgInfo.created_lt, 64);
            builder.storeUint(commonMsgInfo.created_at, 32);
        })

    }
    throw new Error('Expected one of "CommonMsgInfo_int_msg_info", "CommonMsgInfo_ext_in_msg_info", "CommonMsgInfo_ext_out_msg_info" in loading "CommonMsgInfo", but data does not satisfy any constructor');
}

/*
int_msg_info$0 ihr_disabled:Bool bounce:Bool bounced:Bool
  src:MsgAddress dest:MsgAddressInt
  value:CurrencyCollection ihr_fee:Grams fwd_fee:Grams
  created_lt:uint64 created_at:uint32 = CommonMsgInfoRelaxed;
*/

/*
ext_out_msg_info$11 src:MsgAddress dest:MsgAddressExt
  created_lt:uint64 created_at:uint32 = CommonMsgInfoRelaxed;
*/

export function storeCommonMsgInfoRelaxed(commonMsgInfoRelaxed: CommonMsgInfoRelaxed): (builder: Builder) => void {
    if ((commonMsgInfoRelaxed.kind == 'CommonMsgInfoRelaxed_int_msg_info')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
            storeBool(commonMsgInfoRelaxed.ihr_disabled)(builder);
            storeBool(commonMsgInfoRelaxed.bounce)(builder);
            storeBool(commonMsgInfoRelaxed.bounced)(builder);
            builder.storeAddress(commonMsgInfoRelaxed.src);
            builder.storeAddress(commonMsgInfoRelaxed.dest);
            storeCurrencyCollection(commonMsgInfoRelaxed.value)(builder);
            builder.storeCoins(commonMsgInfoRelaxed.ihr_fee);
            builder.storeCoins(commonMsgInfoRelaxed.fwd_fee);
            builder.storeUint(commonMsgInfoRelaxed.created_lt, 64);
            builder.storeUint(commonMsgInfoRelaxed.created_at, 32);
        })

    }
    if ((commonMsgInfoRelaxed.kind == 'CommonMsgInfoRelaxed_ext_out_msg_info')) {
        return ((builder: Builder) => {
            builder.storeUint(0b11, 2);
            builder.storeAddress(commonMsgInfoRelaxed.src);
            builder.storeAddress(commonMsgInfoRelaxed.dest);
            builder.storeUint(commonMsgInfoRelaxed.created_lt, 64);
            builder.storeUint(commonMsgInfoRelaxed.created_at, 32);
        })

    }
    throw new Error('Expected one of "CommonMsgInfoRelaxed_int_msg_info", "CommonMsgInfoRelaxed_ext_out_msg_info" in loading "CommonMsgInfoRelaxed", but data does not satisfy any constructor');
}

// tick_tock$_ tick:Bool tock:Bool = TickTock;

export function loadTickTock(slice: Slice): TickTock {
    let tick: Bool = loadBool(slice);
    let tock: Bool = loadBool(slice);
    return {
        kind: 'TickTock',
        tick: tick,
        tock: tock,
    }

}

export function storeTickTock(tickTock: TickTock): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeBool(tickTock.tick)(builder);
        storeBool(tickTock.tock)(builder);
    })

}

/*
_ fixed_prefix_length:(Maybe (## 5)) special:(Maybe TickTock)
  code:(Maybe ^Cell) data:(Maybe ^Cell)
  library:(Maybe ^Cell) = StateInit;
*/

export function loadStateInit(slice: Slice): StateInit {
    let fixed_prefix_length: Maybe<number> = loadMaybe<number>(slice, ((slice: Slice) => {
        return slice.loadUint(5)

    }));
    let special: Maybe<TickTock> = loadMaybe<TickTock>(slice, loadTickTock);
    let code: Maybe<Cell> = loadMaybe<Cell>(slice, ((slice: Slice) => {
        let slice1 = slice.loadRef().beginParse(true);
        return slice1.asCell()

    }));
    let data: Maybe<Cell> = loadMaybe<Cell>(slice, ((slice: Slice) => {
        let slice1 = slice.loadRef().beginParse(true);
        return slice1.asCell()

    }));
    let library: Maybe<Cell> = loadMaybe<Cell>(slice, ((slice: Slice) => {
        let slice1 = slice.loadRef().beginParse(true);
        return slice1.asCell()

    }));
    return {
        kind: 'StateInit',
        fixed_prefix_length: fixed_prefix_length,
        special: special,
        code: code,
        data: data,
        library: library,
    }

}

export function storeStateInit(stateInit: StateInit): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeMaybe<number>(stateInit.fixed_prefix_length, ((arg: number) => {
            return ((builder: Builder) => {
                builder.storeUint(arg, 5);
            })

        }))(builder);
        storeMaybe<TickTock>(stateInit.special, storeTickTock)(builder);
        storeMaybe<Cell>(stateInit.code, ((arg: Cell) => {
            return ((builder: Builder) => {
                let cell1 = beginCell();
                cell1.storeSlice(arg.beginParse(true));
                builder.storeRef(cell1);

            })

        }))(builder);
        storeMaybe<Cell>(stateInit.data, ((arg: Cell) => {
            return ((builder: Builder) => {
                let cell1 = beginCell();
                cell1.storeSlice(arg.beginParse(true));
                builder.storeRef(cell1);

            })

        }))(builder);
        storeMaybe<Cell>(stateInit.library, ((arg: Cell) => {
            return ((builder: Builder) => {
                let cell1 = beginCell();
                cell1.storeSlice(arg.beginParse(true));
                builder.storeRef(cell1);

            })

        }))(builder);
    })

}

/*
_ fixed_prefix_length:(Maybe (## 5)) special:(Maybe TickTock)
  code:(Maybe ^Cell) data:(Maybe ^Cell)
  library:(HashmapE 256 SimpleLib) = StateInitWithLibs;
*/

// simple_lib$_ public:Bool root:^Cell = SimpleLib;

/*
message$_ {X:Type} info:CommonMsgInfo
  init:(Maybe (Either StateInit ^StateInit))
  body:(Either X ^X) = Message X;
*/

export function loadMessage<X>(slice: Slice, loadX: (slice: Slice) => X): Message<X> {
    let info: CommonMsgInfo = loadCommonMsgInfo(slice);
    let init: Maybe<Either<StateInit, StateInit>> = loadMaybe<Either<StateInit, StateInit>>(slice, ((slice: Slice) => {
        return loadEither<StateInit, StateInit>(slice, loadStateInit, ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadStateInit(slice1)

        }))

    }));
    let body: Either<X, X> = loadEither<X, X>(slice, loadX, ((slice: Slice) => {
        let slice1 = slice.loadRef().beginParse(true);
        return loadX(slice1)

    }));
    return {
        kind: 'Message',
        info: info,
        init: init,
        body: body,
    }

}

export function storeMessage<X>(message: Message<X>, storeX: (x: X) => (builder: Builder) => void): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeCommonMsgInfo(message.info)(builder);
        storeMaybe<Either<StateInit, StateInit>>(message.init, ((arg: Either<StateInit, StateInit>) => {
            return ((builder: Builder) => {
                storeEither<StateInit, StateInit>(arg, storeStateInit, ((arg: StateInit) => {
                    return ((builder: Builder) => {
                        let cell1 = beginCell();
                        storeStateInit(arg)(cell1);
                        builder.storeRef(cell1);

                    })

                }))(builder);
            })

        }))(builder);
        storeEither<X, X>(message.body, storeX, ((arg: X) => {
            return ((builder: Builder) => {
                let cell1 = beginCell();
                storeX(arg)(cell1);
                builder.storeRef(cell1);

            })

        }))(builder);
    })

}

/*
message$_ {X:Type} info:CommonMsgInfoRelaxed
  init:(Maybe (Either StateInit ^StateInit))
  body:(Either X ^X) = MessageRelaxed X;
*/

export function storeMessageRelaxed<X>(messageRelaxed: MessageRelaxed<X>, storeX: (x: X) => (builder: Builder) => void): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeCommonMsgInfoRelaxed(messageRelaxed.info)(builder);
        storeMaybe<Either<StateInit, StateInit>>(messageRelaxed.init, ((arg: Either<StateInit, StateInit>) => {
            return ((builder: Builder) => {
                storeEither<StateInit, StateInit>(arg, storeStateInit, ((arg: StateInit) => {
                    return ((builder: Builder) => {
                        let cell1 = beginCell();
                        storeStateInit(arg)(cell1);
                        builder.storeRef(cell1);

                    })

                }))(builder);
            })

        }))(builder);
        storeEither<X, X>(messageRelaxed.body, storeX, ((arg: X) => {
            return ((builder: Builder) => {
                let cell1 = beginCell();
                storeX(arg)(cell1);
                builder.storeRef(cell1);

            })

        }))(builder);
    })

}

// _ (Message Any) = MessageAny;

/*
interm_addr_regular$0 use_dest_bits:(#<= 96)
  = IntermediateAddress;
*/

/*
interm_addr_simple$10 workchain_id:int8 addr_pfx:uint64
  = IntermediateAddress;
*/

/*
interm_addr_ext$11 workchain_id:int32 addr_pfx:uint64
  = IntermediateAddress;
*/

export function loadIntermediateAddress(slice: Slice): IntermediateAddress {
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b0))) {
        slice.loadUint(1);
        let use_dest_bits: number = slice.loadUint(bitLen(96));
        return {
            kind: 'IntermediateAddress_interm_addr_regular',
            use_dest_bits: use_dest_bits,
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b10))) {
        slice.loadUint(2);
        let workchain_id: number = slice.loadInt(8);
        let addr_pfx: bigint = slice.loadUintBig(64);
        return {
            kind: 'IntermediateAddress_interm_addr_simple',
            workchain_id: workchain_id,
            addr_pfx: addr_pfx,
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b11))) {
        slice.loadUint(2);
        let workchain_id: number = slice.loadInt(32);
        let addr_pfx: bigint = slice.loadUintBig(64);
        return {
            kind: 'IntermediateAddress_interm_addr_ext',
            workchain_id: workchain_id,
            addr_pfx: addr_pfx,
        }

    }
    throw new Error('Expected one of "IntermediateAddress_interm_addr_regular", "IntermediateAddress_interm_addr_simple", "IntermediateAddress_interm_addr_ext" in loading "IntermediateAddress", but data does not satisfy any constructor');
}

export function storeIntermediateAddress(intermediateAddress: IntermediateAddress): (builder: Builder) => void {
    if ((intermediateAddress.kind == 'IntermediateAddress_interm_addr_regular')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
            builder.storeUint(intermediateAddress.use_dest_bits, bitLen(96));
        })

    }
    if ((intermediateAddress.kind == 'IntermediateAddress_interm_addr_simple')) {
        return ((builder: Builder) => {
            builder.storeUint(0b10, 2);
            builder.storeInt(intermediateAddress.workchain_id, 8);
            builder.storeUint(intermediateAddress.addr_pfx, 64);
        })

    }
    if ((intermediateAddress.kind == 'IntermediateAddress_interm_addr_ext')) {
        return ((builder: Builder) => {
            builder.storeUint(0b11, 2);
            builder.storeInt(intermediateAddress.workchain_id, 32);
            builder.storeUint(intermediateAddress.addr_pfx, 64);
        })

    }
    throw new Error('Expected one of "IntermediateAddress_interm_addr_regular", "IntermediateAddress_interm_addr_simple", "IntermediateAddress_interm_addr_ext" in loading "IntermediateAddress", but data does not satisfy any constructor');
}

/*
msg_envelope#4 cur_addr:IntermediateAddress
  next_addr:IntermediateAddress fwd_fee_remaining:Grams
  msg:^(Message Any) = MsgEnvelope;
*/

/*
msg_envelope_v2#5 cur_addr:IntermediateAddress
  next_addr:IntermediateAddress fwd_fee_remaining:Grams
  msg:^(Message Any)
  emitted_lt:(Maybe uint64)
  metadata:(Maybe MsgMetadata) = MsgEnvelope;
*/

export function loadMsgEnvelope(slice: Slice): MsgEnvelope {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0x4))) {
        slice.loadUint(4);
        let cur_addr: IntermediateAddress = loadIntermediateAddress(slice);
        let next_addr: IntermediateAddress = loadIntermediateAddress(slice);
        let fwd_fee_remaining: bigint = slice.loadCoins();
        let slice1 = slice.loadRef().beginParse(true);
        let msg: Message<Cell> = loadMessage<Cell>(slice1, ((slice: Slice) => {
            return slice.asCell()

        }));
        return {
            kind: 'MsgEnvelope_msg_envelope',
            cur_addr: cur_addr,
            next_addr: next_addr,
            fwd_fee_remaining: fwd_fee_remaining,
            msg: msg,
        }

    }
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0x5))) {
        slice.loadUint(4);
        let cur_addr: IntermediateAddress = loadIntermediateAddress(slice);
        let next_addr: IntermediateAddress = loadIntermediateAddress(slice);
        let fwd_fee_remaining: bigint = slice.loadCoins();
        let slice1 = slice.loadRef().beginParse(true);
        let msg: Message<Cell> = loadMessage<Cell>(slice1, ((slice: Slice) => {
            return slice.asCell()

        }));
        let emitted_lt: Maybe<bigint> = loadMaybe<bigint>(slice, ((slice: Slice) => {
            return slice.loadUintBig(64)

        }));
        let metadata: Maybe<MsgMetadata> = loadMaybe<MsgMetadata>(slice, loadMsgMetadata);
        return {
            kind: 'MsgEnvelope_msg_envelope_v2',
            cur_addr: cur_addr,
            next_addr: next_addr,
            fwd_fee_remaining: fwd_fee_remaining,
            msg: msg,
            emitted_lt: emitted_lt,
            metadata: metadata,
        }

    }
    throw new Error('Expected one of "MsgEnvelope_msg_envelope", "MsgEnvelope_msg_envelope_v2" in loading "MsgEnvelope", but data does not satisfy any constructor');
}

export function storeMsgEnvelope(msgEnvelope: MsgEnvelope): (builder: Builder) => void {
    if ((msgEnvelope.kind == 'MsgEnvelope_msg_envelope')) {
        return ((builder: Builder) => {
            builder.storeUint(0x4, 4);
            storeIntermediateAddress(msgEnvelope.cur_addr)(builder);
            storeIntermediateAddress(msgEnvelope.next_addr)(builder);
            builder.storeCoins(msgEnvelope.fwd_fee_remaining);
            let cell1 = beginCell();
            storeMessage<Cell>(msgEnvelope.msg, ((arg: Cell) => {
                return ((builder: Builder) => {
                    builder.storeSlice(arg.beginParse(true));
                })

            }))(cell1);
            builder.storeRef(cell1);
        })

    }
    if ((msgEnvelope.kind == 'MsgEnvelope_msg_envelope_v2')) {
        return ((builder: Builder) => {
            builder.storeUint(0x5, 4);
            storeIntermediateAddress(msgEnvelope.cur_addr)(builder);
            storeIntermediateAddress(msgEnvelope.next_addr)(builder);
            builder.storeCoins(msgEnvelope.fwd_fee_remaining);
            let cell1 = beginCell();
            storeMessage<Cell>(msgEnvelope.msg, ((arg: Cell) => {
                return ((builder: Builder) => {
                    builder.storeSlice(arg.beginParse(true));
                })

            }))(cell1);
            builder.storeRef(cell1);
            storeMaybe<bigint>(msgEnvelope.emitted_lt, ((arg: bigint) => {
                return ((builder: Builder) => {
                    builder.storeUint(arg, 64);
                })

            }))(builder);
            storeMaybe<MsgMetadata>(msgEnvelope.metadata, storeMsgMetadata)(builder);
        })

    }
    throw new Error('Expected one of "MsgEnvelope_msg_envelope", "MsgEnvelope_msg_envelope_v2" in loading "MsgEnvelope", but data does not satisfy any constructor');
}

// msg_metadata#0 depth:uint32 initiator_addr:MsgAddressInt initiator_lt:uint64 = MsgMetadata;

export function loadMsgMetadata(slice: Slice): MsgMetadata {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0x0))) {
        slice.loadUint(4);
        let depth: number = slice.loadUint(32);
        let initiator_addr: Address = slice.loadAddress();
        let initiator_lt: bigint = slice.loadUintBig(64);
        return {
            kind: 'MsgMetadata',
            depth: depth,
            initiator_addr: initiator_addr,
            initiator_lt: initiator_lt,
        }

    }
    throw new Error('Expected one of "MsgMetadata" in loading "MsgMetadata", but data does not satisfy any constructor');
}

export function storeMsgMetadata(msgMetadata: MsgMetadata): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x0, 4);
        builder.storeUint(msgMetadata.depth, 32);
        builder.storeAddress(msgMetadata.initiator_addr);
        builder.storeUint(msgMetadata.initiator_lt, 64);
    })

}

/*
msg_import_ext$000 msg:^(Message Any) transaction:^Transaction
              = InMsg;
*/

/*
msg_import_ihr$010 msg:^(Message Any) transaction:^Transaction
    ihr_fee:Grams proof_created:^Cell = InMsg;
*/

/*
msg_import_imm$011 in_msg:^MsgEnvelope
    transaction:^Transaction fwd_fee:Grams = InMsg;
*/

/*
msg_import_fin$100 in_msg:^MsgEnvelope
    transaction:^Transaction fwd_fee:Grams = InMsg;
*/

/*
msg_import_tr$101  in_msg:^MsgEnvelope out_msg:^MsgEnvelope
    transit_fee:Grams = InMsg;
*/

/*
msg_discard_fin$110 in_msg:^MsgEnvelope transaction_id:uint64
    fwd_fee:Grams = InMsg;
*/

/*
msg_discard_tr$111 in_msg:^MsgEnvelope transaction_id:uint64
    fwd_fee:Grams proof_delivered:^Cell = InMsg;
*/

/*
msg_import_deferred_fin$00100 in_msg:^MsgEnvelope
    transaction:^Transaction fwd_fee:Grams = InMsg;
*/

// msg_import_deferred_tr$00101 in_msg:^MsgEnvelope out_msg:^MsgEnvelope = InMsg;

export function loadInMsg(slice: Slice): InMsg {
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b000))) {
        slice.loadUint(3);
        let slice1 = slice.loadRef().beginParse(true);
        let msg: Message<Cell> = loadMessage<Cell>(slice1, ((slice: Slice) => {
            return slice.asCell()

        }));
        let slice2 = slice.loadRef().beginParse(true);
        let transaction: Transaction = loadTransaction(slice2);
        return {
            kind: 'InMsg_msg_import_ext',
            msg: msg,
            transaction: transaction,
        }

    }
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b010))) {
        slice.loadUint(3);
        let slice1 = slice.loadRef().beginParse(true);
        let msg: Message<Cell> = loadMessage<Cell>(slice1, ((slice: Slice) => {
            return slice.asCell()

        }));
        let slice2 = slice.loadRef().beginParse(true);
        let transaction: Transaction = loadTransaction(slice2);
        let ihr_fee: bigint = slice.loadCoins();
        let slice3 = slice.loadRef().beginParse(true);
        let proof_created: Cell = slice3.asCell();
        return {
            kind: 'InMsg_msg_import_ihr',
            msg: msg,
            transaction: transaction,
            ihr_fee: ihr_fee,
            proof_created: proof_created,
        }

    }
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b011))) {
        slice.loadUint(3);
        let slice1 = slice.loadRef().beginParse(true);
        let in_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let transaction: Transaction = loadTransaction(slice2);
        let fwd_fee: bigint = slice.loadCoins();
        return {
            kind: 'InMsg_msg_import_imm',
            in_msg: in_msg,
            transaction: transaction,
            fwd_fee: fwd_fee,
        }

    }
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b100))) {
        slice.loadUint(3);
        let slice1 = slice.loadRef().beginParse(true);
        let in_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let transaction: Transaction = loadTransaction(slice2);
        let fwd_fee: bigint = slice.loadCoins();
        return {
            kind: 'InMsg_msg_import_fin',
            in_msg: in_msg,
            transaction: transaction,
            fwd_fee: fwd_fee,
        }

    }
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b101))) {
        slice.loadUint(3);
        let slice1 = slice.loadRef().beginParse(true);
        let in_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let out_msg: MsgEnvelope = loadMsgEnvelope(slice2);
        let transit_fee: bigint = slice.loadCoins();
        return {
            kind: 'InMsg_msg_import_tr',
            in_msg: in_msg,
            out_msg: out_msg,
            transit_fee: transit_fee,
        }

    }
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b110))) {
        slice.loadUint(3);
        let slice1 = slice.loadRef().beginParse(true);
        let in_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let transaction_id: bigint = slice.loadUintBig(64);
        let fwd_fee: bigint = slice.loadCoins();
        return {
            kind: 'InMsg_msg_discard_fin',
            in_msg: in_msg,
            transaction_id: transaction_id,
            fwd_fee: fwd_fee,
        }

    }
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b111))) {
        slice.loadUint(3);
        let slice1 = slice.loadRef().beginParse(true);
        let in_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let transaction_id: bigint = slice.loadUintBig(64);
        let fwd_fee: bigint = slice.loadCoins();
        let slice2 = slice.loadRef().beginParse(true);
        let proof_delivered: Cell = slice2.asCell();
        return {
            kind: 'InMsg_msg_discard_tr',
            in_msg: in_msg,
            transaction_id: transaction_id,
            fwd_fee: fwd_fee,
            proof_delivered: proof_delivered,
        }

    }
    if (((slice.remainingBits >= 5) && (slice.preloadUint(5) == 0b00100))) {
        slice.loadUint(5);
        let slice1 = slice.loadRef().beginParse(true);
        let in_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let transaction: Transaction = loadTransaction(slice2);
        let fwd_fee: bigint = slice.loadCoins();
        return {
            kind: 'InMsg_msg_import_deferred_fin',
            in_msg: in_msg,
            transaction: transaction,
            fwd_fee: fwd_fee,
        }

    }
    if (((slice.remainingBits >= 5) && (slice.preloadUint(5) == 0b00101))) {
        slice.loadUint(5);
        let slice1 = slice.loadRef().beginParse(true);
        let in_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let out_msg: MsgEnvelope = loadMsgEnvelope(slice2);
        return {
            kind: 'InMsg_msg_import_deferred_tr',
            in_msg: in_msg,
            out_msg: out_msg,
        }

    }
    throw new Error('Expected one of "InMsg_msg_import_ext", "InMsg_msg_import_ihr", "InMsg_msg_import_imm", "InMsg_msg_import_fin", "InMsg_msg_import_tr", "InMsg_msg_discard_fin", "InMsg_msg_discard_tr", "InMsg_msg_import_deferred_fin", "InMsg_msg_import_deferred_tr" in loading "InMsg", but data does not satisfy any constructor');
}

export function storeInMsg(inMsg: InMsg): (builder: Builder) => void {
    if ((inMsg.kind == 'InMsg_msg_import_ext')) {
        return ((builder: Builder) => {
            builder.storeUint(0b000, 3);
            let cell1 = beginCell();
            storeMessage<Cell>(inMsg.msg, ((arg: Cell) => {
                return ((builder: Builder) => {
                    builder.storeSlice(arg.beginParse(true));
                })

            }))(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeTransaction(inMsg.transaction)(cell2);
            builder.storeRef(cell2);
        })

    }
    if ((inMsg.kind == 'InMsg_msg_import_ihr')) {
        return ((builder: Builder) => {
            builder.storeUint(0b010, 3);
            let cell1 = beginCell();
            storeMessage<Cell>(inMsg.msg, ((arg: Cell) => {
                return ((builder: Builder) => {
                    builder.storeSlice(arg.beginParse(true));
                })

            }))(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeTransaction(inMsg.transaction)(cell2);
            builder.storeRef(cell2);
            builder.storeCoins(inMsg.ihr_fee);
            let cell3 = beginCell();
            cell3.storeSlice(inMsg.proof_created.beginParse(true));
            builder.storeRef(cell3);
        })

    }
    if ((inMsg.kind == 'InMsg_msg_import_imm')) {
        return ((builder: Builder) => {
            builder.storeUint(0b011, 3);
            let cell1 = beginCell();
            storeMsgEnvelope(inMsg.in_msg)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeTransaction(inMsg.transaction)(cell2);
            builder.storeRef(cell2);
            builder.storeCoins(inMsg.fwd_fee);
        })

    }
    if ((inMsg.kind == 'InMsg_msg_import_fin')) {
        return ((builder: Builder) => {
            builder.storeUint(0b100, 3);
            let cell1 = beginCell();
            storeMsgEnvelope(inMsg.in_msg)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeTransaction(inMsg.transaction)(cell2);
            builder.storeRef(cell2);
            builder.storeCoins(inMsg.fwd_fee);
        })

    }
    if ((inMsg.kind == 'InMsg_msg_import_tr')) {
        return ((builder: Builder) => {
            builder.storeUint(0b101, 3);
            let cell1 = beginCell();
            storeMsgEnvelope(inMsg.in_msg)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeMsgEnvelope(inMsg.out_msg)(cell2);
            builder.storeRef(cell2);
            builder.storeCoins(inMsg.transit_fee);
        })

    }
    if ((inMsg.kind == 'InMsg_msg_discard_fin')) {
        return ((builder: Builder) => {
            builder.storeUint(0b110, 3);
            let cell1 = beginCell();
            storeMsgEnvelope(inMsg.in_msg)(cell1);
            builder.storeRef(cell1);
            builder.storeUint(inMsg.transaction_id, 64);
            builder.storeCoins(inMsg.fwd_fee);
        })

    }
    if ((inMsg.kind == 'InMsg_msg_discard_tr')) {
        return ((builder: Builder) => {
            builder.storeUint(0b111, 3);
            let cell1 = beginCell();
            storeMsgEnvelope(inMsg.in_msg)(cell1);
            builder.storeRef(cell1);
            builder.storeUint(inMsg.transaction_id, 64);
            builder.storeCoins(inMsg.fwd_fee);
            let cell2 = beginCell();
            cell2.storeSlice(inMsg.proof_delivered.beginParse(true));
            builder.storeRef(cell2);
        })

    }
    if ((inMsg.kind == 'InMsg_msg_import_deferred_fin')) {
        return ((builder: Builder) => {
            builder.storeUint(0b00100, 5);
            let cell1 = beginCell();
            storeMsgEnvelope(inMsg.in_msg)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeTransaction(inMsg.transaction)(cell2);
            builder.storeRef(cell2);
            builder.storeCoins(inMsg.fwd_fee);
        })

    }
    if ((inMsg.kind == 'InMsg_msg_import_deferred_tr')) {
        return ((builder: Builder) => {
            builder.storeUint(0b00101, 5);
            let cell1 = beginCell();
            storeMsgEnvelope(inMsg.in_msg)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeMsgEnvelope(inMsg.out_msg)(cell2);
            builder.storeRef(cell2);
        })

    }
    throw new Error('Expected one of "InMsg_msg_import_ext", "InMsg_msg_import_ihr", "InMsg_msg_import_imm", "InMsg_msg_import_fin", "InMsg_msg_import_tr", "InMsg_msg_discard_fin", "InMsg_msg_discard_tr", "InMsg_msg_import_deferred_fin", "InMsg_msg_import_deferred_tr" in loading "InMsg", but data does not satisfy any constructor');
}

/*
import_fees$_ fees_collected:Grams
  value_imported:CurrencyCollection = ImportFees;
*/

export function loadImportFees(slice: Slice): ImportFees {
    let fees_collected: bigint = slice.loadCoins();
    let value_imported: CurrencyCollection = loadCurrencyCollection(slice);
    return {
        kind: 'ImportFees',
        fees_collected: fees_collected,
        value_imported: value_imported,
    }

}

export function storeImportFees(importFees: ImportFees): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeCoins(importFees.fees_collected);
        storeCurrencyCollection(importFees.value_imported)(builder);
    })

}

// _ (HashmapAugE 256 InMsg ImportFees) = InMsgDescr;

export function loadInMsgDescr(slice: Slice): InMsgDescr {
    let anon0: Dictionary<bigint, {value: InMsg, extra: ImportFees}> = Dictionary.load(Dictionary.Keys.BigUint(256), {
        serialize: () => { throw new Error('Not implemented') },
        parse: ((slice: Slice) => {
        return {
            extra: loadImportFees(slice),
            value: loadInMsg(slice),
        }

    }),
    }, slice);
    return {
        kind: 'InMsgDescr',
        anon0: anon0,
    }

}

export function storeInMsgDescr(inMsgDescr: InMsgDescr): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeDict(inMsgDescr.anon0, Dictionary.Keys.BigUint(256), {
            serialize: ((arg: {value: InMsg, extra: ImportFees}, builder: Builder) => {
            ((arg: ImportFees) => {
                return ((builder: Builder) => {
                    storeImportFees(arg)(builder);
                })

            })(arg.extra)(builder);
            ((arg: InMsg) => {
                return ((builder: Builder) => {
                    storeInMsg(arg)(builder);
                })

            })(arg.value)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
    })

}

/*
msg_export_ext$000 msg:^(Message Any)
    transaction:^Transaction = OutMsg;
*/

/*
msg_export_imm$010 out_msg:^MsgEnvelope
    transaction:^Transaction reimport:^InMsg = OutMsg;
*/

/*
msg_export_new$001 out_msg:^MsgEnvelope
    transaction:^Transaction = OutMsg;
*/

/*
msg_export_tr$011  out_msg:^MsgEnvelope
    imported:^InMsg = OutMsg;
*/

/*
msg_export_deq$1100 out_msg:^MsgEnvelope
    import_block_lt:uint63 = OutMsg;
*/

/*
msg_export_deq_short$1101 msg_env_hash:bits256
    next_workchain:int32 next_addr_pfx:uint64
    import_block_lt:uint64 = OutMsg;
*/

/*
msg_export_tr_req$111 out_msg:^MsgEnvelope
    imported:^InMsg = OutMsg;
*/

/*
msg_export_deq_imm$100 out_msg:^MsgEnvelope
    reimport:^InMsg = OutMsg;
*/

/*
msg_export_new_defer$10100 out_msg:^MsgEnvelope
    transaction:^Transaction = OutMsg;
*/

/*
msg_export_deferred_tr$10101  out_msg:^MsgEnvelope
    imported:^InMsg = OutMsg;
*/

export function loadOutMsg(slice: Slice): OutMsg {
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b000))) {
        slice.loadUint(3);
        let slice1 = slice.loadRef().beginParse(true);
        let msg: Message<Cell> = loadMessage<Cell>(slice1, ((slice: Slice) => {
            return slice.asCell()

        }));
        let slice2 = slice.loadRef().beginParse(true);
        let transaction: Transaction = loadTransaction(slice2);
        return {
            kind: 'OutMsg_msg_export_ext',
            msg: msg,
            transaction: transaction,
        }

    }
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b010))) {
        slice.loadUint(3);
        let slice1 = slice.loadRef().beginParse(true);
        let out_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let transaction: Transaction = loadTransaction(slice2);
        let slice3 = slice.loadRef().beginParse(true);
        let reimport: InMsg = loadInMsg(slice3);
        return {
            kind: 'OutMsg_msg_export_imm',
            out_msg: out_msg,
            transaction: transaction,
            reimport: reimport,
        }

    }
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b001))) {
        slice.loadUint(3);
        let slice1 = slice.loadRef().beginParse(true);
        let out_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let transaction: Transaction = loadTransaction(slice2);
        return {
            kind: 'OutMsg_msg_export_new',
            out_msg: out_msg,
            transaction: transaction,
        }

    }
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b011))) {
        slice.loadUint(3);
        let slice1 = slice.loadRef().beginParse(true);
        let out_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let imported: InMsg = loadInMsg(slice2);
        return {
            kind: 'OutMsg_msg_export_tr',
            out_msg: out_msg,
            imported: imported,
        }

    }
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0b1100))) {
        slice.loadUint(4);
        let slice1 = slice.loadRef().beginParse(true);
        let out_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let import_block_lt: bigint = slice.loadUintBig(63);
        return {
            kind: 'OutMsg_msg_export_deq',
            out_msg: out_msg,
            import_block_lt: import_block_lt,
        }

    }
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0b1101))) {
        slice.loadUint(4);
        let msg_env_hash: Buffer = slice.loadBuffer((256 / 8));
        let next_workchain: number = slice.loadInt(32);
        let next_addr_pfx: bigint = slice.loadUintBig(64);
        let import_block_lt: bigint = slice.loadUintBig(64);
        return {
            kind: 'OutMsg_msg_export_deq_short',
            msg_env_hash: msg_env_hash,
            next_workchain: next_workchain,
            next_addr_pfx: next_addr_pfx,
            import_block_lt: import_block_lt,
        }

    }
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b111))) {
        slice.loadUint(3);
        let slice1 = slice.loadRef().beginParse(true);
        let out_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let imported: InMsg = loadInMsg(slice2);
        return {
            kind: 'OutMsg_msg_export_tr_req',
            out_msg: out_msg,
            imported: imported,
        }

    }
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b100))) {
        slice.loadUint(3);
        let slice1 = slice.loadRef().beginParse(true);
        let out_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let reimport: InMsg = loadInMsg(slice2);
        return {
            kind: 'OutMsg_msg_export_deq_imm',
            out_msg: out_msg,
            reimport: reimport,
        }

    }
    if (((slice.remainingBits >= 5) && (slice.preloadUint(5) == 0b10100))) {
        slice.loadUint(5);
        let slice1 = slice.loadRef().beginParse(true);
        let out_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let transaction: Transaction = loadTransaction(slice2);
        return {
            kind: 'OutMsg_msg_export_new_defer',
            out_msg: out_msg,
            transaction: transaction,
        }

    }
    if (((slice.remainingBits >= 5) && (slice.preloadUint(5) == 0b10101))) {
        slice.loadUint(5);
        let slice1 = slice.loadRef().beginParse(true);
        let out_msg: MsgEnvelope = loadMsgEnvelope(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let imported: InMsg = loadInMsg(slice2);
        return {
            kind: 'OutMsg_msg_export_deferred_tr',
            out_msg: out_msg,
            imported: imported,
        }

    }
    throw new Error('Expected one of "OutMsg_msg_export_ext", "OutMsg_msg_export_imm", "OutMsg_msg_export_new", "OutMsg_msg_export_tr", "OutMsg_msg_export_deq", "OutMsg_msg_export_deq_short", "OutMsg_msg_export_tr_req", "OutMsg_msg_export_deq_imm", "OutMsg_msg_export_new_defer", "OutMsg_msg_export_deferred_tr" in loading "OutMsg", but data does not satisfy any constructor');
}

export function storeOutMsg(outMsg: OutMsg): (builder: Builder) => void {
    if ((outMsg.kind == 'OutMsg_msg_export_ext')) {
        return ((builder: Builder) => {
            builder.storeUint(0b000, 3);
            let cell1 = beginCell();
            storeMessage<Cell>(outMsg.msg, ((arg: Cell) => {
                return ((builder: Builder) => {
                    builder.storeSlice(arg.beginParse(true));
                })

            }))(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeTransaction(outMsg.transaction)(cell2);
            builder.storeRef(cell2);
        })

    }
    if ((outMsg.kind == 'OutMsg_msg_export_imm')) {
        return ((builder: Builder) => {
            builder.storeUint(0b010, 3);
            let cell1 = beginCell();
            storeMsgEnvelope(outMsg.out_msg)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeTransaction(outMsg.transaction)(cell2);
            builder.storeRef(cell2);
            let cell3 = beginCell();
            storeInMsg(outMsg.reimport)(cell3);
            builder.storeRef(cell3);
        })

    }
    if ((outMsg.kind == 'OutMsg_msg_export_new')) {
        return ((builder: Builder) => {
            builder.storeUint(0b001, 3);
            let cell1 = beginCell();
            storeMsgEnvelope(outMsg.out_msg)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeTransaction(outMsg.transaction)(cell2);
            builder.storeRef(cell2);
        })

    }
    if ((outMsg.kind == 'OutMsg_msg_export_tr')) {
        return ((builder: Builder) => {
            builder.storeUint(0b011, 3);
            let cell1 = beginCell();
            storeMsgEnvelope(outMsg.out_msg)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeInMsg(outMsg.imported)(cell2);
            builder.storeRef(cell2);
        })

    }
    if ((outMsg.kind == 'OutMsg_msg_export_deq')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1100, 4);
            let cell1 = beginCell();
            storeMsgEnvelope(outMsg.out_msg)(cell1);
            builder.storeRef(cell1);
            builder.storeUint(outMsg.import_block_lt, 63);
        })

    }
    if ((outMsg.kind == 'OutMsg_msg_export_deq_short')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1101, 4);
            builder.storeBuffer(outMsg.msg_env_hash, (256 / 8));
            builder.storeInt(outMsg.next_workchain, 32);
            builder.storeUint(outMsg.next_addr_pfx, 64);
            builder.storeUint(outMsg.import_block_lt, 64);
        })

    }
    if ((outMsg.kind == 'OutMsg_msg_export_tr_req')) {
        return ((builder: Builder) => {
            builder.storeUint(0b111, 3);
            let cell1 = beginCell();
            storeMsgEnvelope(outMsg.out_msg)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeInMsg(outMsg.imported)(cell2);
            builder.storeRef(cell2);
        })

    }
    if ((outMsg.kind == 'OutMsg_msg_export_deq_imm')) {
        return ((builder: Builder) => {
            builder.storeUint(0b100, 3);
            let cell1 = beginCell();
            storeMsgEnvelope(outMsg.out_msg)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeInMsg(outMsg.reimport)(cell2);
            builder.storeRef(cell2);
        })

    }
    if ((outMsg.kind == 'OutMsg_msg_export_new_defer')) {
        return ((builder: Builder) => {
            builder.storeUint(0b10100, 5);
            let cell1 = beginCell();
            storeMsgEnvelope(outMsg.out_msg)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeTransaction(outMsg.transaction)(cell2);
            builder.storeRef(cell2);
        })

    }
    if ((outMsg.kind == 'OutMsg_msg_export_deferred_tr')) {
        return ((builder: Builder) => {
            builder.storeUint(0b10101, 5);
            let cell1 = beginCell();
            storeMsgEnvelope(outMsg.out_msg)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeInMsg(outMsg.imported)(cell2);
            builder.storeRef(cell2);
        })

    }
    throw new Error('Expected one of "OutMsg_msg_export_ext", "OutMsg_msg_export_imm", "OutMsg_msg_export_new", "OutMsg_msg_export_tr", "OutMsg_msg_export_deq", "OutMsg_msg_export_deq_short", "OutMsg_msg_export_tr_req", "OutMsg_msg_export_deq_imm", "OutMsg_msg_export_new_defer", "OutMsg_msg_export_deferred_tr" in loading "OutMsg", but data does not satisfy any constructor');
}

// _ enqueued_lt:uint64 out_msg:^MsgEnvelope = EnqueuedMsg;

export function loadEnqueuedMsg(slice: Slice): EnqueuedMsg {
    let enqueued_lt: bigint = slice.loadUintBig(64);
    let slice1 = slice.loadRef().beginParse(true);
    let out_msg: MsgEnvelope = loadMsgEnvelope(slice1);
    return {
        kind: 'EnqueuedMsg',
        enqueued_lt: enqueued_lt,
        out_msg: out_msg,
    }

}

export function storeEnqueuedMsg(enqueuedMsg: EnqueuedMsg): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(enqueuedMsg.enqueued_lt, 64);
        let cell1 = beginCell();
        storeMsgEnvelope(enqueuedMsg.out_msg)(cell1);
        builder.storeRef(cell1);
    })

}

// _ (HashmapAugE 256 OutMsg CurrencyCollection) = OutMsgDescr;

export function loadOutMsgDescr(slice: Slice): OutMsgDescr {
    let anon0: Dictionary<bigint, {value: OutMsg, extra: CurrencyCollection}> = Dictionary.load(Dictionary.Keys.BigUint(256), {
        serialize: () => { throw new Error('Not implemented') },
        parse: ((slice: Slice) => {
        return {
            extra: loadCurrencyCollection(slice),
            value: loadOutMsg(slice),
        }

    }),
    }, slice);
    return {
        kind: 'OutMsgDescr',
        anon0: anon0,
    }

}

export function storeOutMsgDescr(outMsgDescr: OutMsgDescr): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeDict(outMsgDescr.anon0, Dictionary.Keys.BigUint(256), {
            serialize: ((arg: {value: OutMsg, extra: CurrencyCollection}, builder: Builder) => {
            ((arg: CurrencyCollection) => {
                return ((builder: Builder) => {
                    storeCurrencyCollection(arg)(builder);
                })

            })(arg.extra)(builder);
            ((arg: OutMsg) => {
                return ((builder: Builder) => {
                    storeOutMsg(arg)(builder);
                })

            })(arg.value)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
    })

}

// _ (HashmapAugE 352 EnqueuedMsg uint64) = OutMsgQueue;

export function loadOutMsgQueue(slice: Slice): OutMsgQueue {
    let anon0: Dictionary<bigint, {value: EnqueuedMsg, extra: bigint}> = Dictionary.load(Dictionary.Keys.BigUint(352), {
        serialize: () => { throw new Error('Not implemented') },
        parse: ((slice: Slice) => {
        return {
            extra: slice.loadUintBig(64),
            value: loadEnqueuedMsg(slice),
        }

    }),
    }, slice);
    return {
        kind: 'OutMsgQueue',
        anon0: anon0,
    }

}

export function storeOutMsgQueue(outMsgQueue: OutMsgQueue): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeDict(outMsgQueue.anon0, Dictionary.Keys.BigUint(352), {
            serialize: ((arg: {value: EnqueuedMsg, extra: bigint}, builder: Builder) => {
            ((arg: bigint) => {
                return ((builder: Builder) => {
                    builder.storeUint(arg, 64);
                })

            })(arg.extra)(builder);
            ((arg: EnqueuedMsg) => {
                return ((builder: Builder) => {
                    storeEnqueuedMsg(arg)(builder);
                })

            })(arg.value)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
    })

}

// processed_upto$_ last_msg_lt:uint64 last_msg_hash:bits256 = ProcessedUpto;

export function loadProcessedUpto(slice: Slice): ProcessedUpto {
    let last_msg_lt: bigint = slice.loadUintBig(64);
    let last_msg_hash: Buffer = slice.loadBuffer((256 / 8));
    return {
        kind: 'ProcessedUpto',
        last_msg_lt: last_msg_lt,
        last_msg_hash: last_msg_hash,
    }

}

export function storeProcessedUpto(processedUpto: ProcessedUpto): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(processedUpto.last_msg_lt, 64);
        builder.storeBuffer(processedUpto.last_msg_hash, (256 / 8));
    })

}

// _ (HashmapE 96 ProcessedUpto) = ProcessedInfo;

export function loadProcessedInfo(slice: Slice): ProcessedInfo {
    let anon0: Dictionary<bigint, ProcessedUpto> = Dictionary.load(Dictionary.Keys.BigUint(96), {
        serialize: () => { throw new Error('Not implemented') },
        parse: loadProcessedUpto,
    }, slice);
    return {
        kind: 'ProcessedInfo',
        anon0: anon0,
    }

}

export function storeProcessedInfo(processedInfo: ProcessedInfo): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeDict(processedInfo.anon0, Dictionary.Keys.BigUint(96), {
            serialize: ((arg: ProcessedUpto, builder: Builder) => {
            storeProcessedUpto(arg)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
    })

}

// ihr_pending$_ import_lt:uint64 = IhrPendingSince;

// _ (HashmapE 320 IhrPendingSince) = IhrPendingInfo;

// _ messages:(HashmapE 64 EnqueuedMsg) count:uint48 = AccountDispatchQueue;

export function loadAccountDispatchQueue(slice: Slice): AccountDispatchQueue {
    let messages: Dictionary<bigint, EnqueuedMsg> = Dictionary.load(Dictionary.Keys.BigUint(64), {
        serialize: () => { throw new Error('Not implemented') },
        parse: loadEnqueuedMsg,
    }, slice);
    let count: bigint = slice.loadUintBig(48);
    return {
        kind: 'AccountDispatchQueue',
        messages: messages,
        count: count,
    }

}

export function storeAccountDispatchQueue(accountDispatchQueue: AccountDispatchQueue): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeDict(accountDispatchQueue.messages, Dictionary.Keys.BigUint(64), {
            serialize: ((arg: EnqueuedMsg, builder: Builder) => {
            storeEnqueuedMsg(arg)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
        builder.storeUint(accountDispatchQueue.count, 48);
    })

}

// _ (HashmapAugE 256 AccountDispatchQueue uint64) = DispatchQueue;

export function loadDispatchQueue(slice: Slice): DispatchQueue {
    let anon0: Dictionary<bigint, {value: AccountDispatchQueue, extra: bigint}> = Dictionary.load(Dictionary.Keys.BigUint(256), {
        serialize: () => { throw new Error('Not implemented') },
        parse: ((slice: Slice) => {
        return {
            extra: slice.loadUintBig(64),
            value: loadAccountDispatchQueue(slice),
        }

    }),
    }, slice);
    return {
        kind: 'DispatchQueue',
        anon0: anon0,
    }

}

export function storeDispatchQueue(dispatchQueue: DispatchQueue): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeDict(dispatchQueue.anon0, Dictionary.Keys.BigUint(256), {
            serialize: ((arg: {value: AccountDispatchQueue, extra: bigint}, builder: Builder) => {
            ((arg: bigint) => {
                return ((builder: Builder) => {
                    builder.storeUint(arg, 64);
                })

            })(arg.extra)(builder);
            ((arg: AccountDispatchQueue) => {
                return ((builder: Builder) => {
                    storeAccountDispatchQueue(arg)(builder);
                })

            })(arg.value)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
    })

}

// out_msg_queue_extra#0 dispatch_queue:DispatchQueue out_queue_size:(Maybe uint48) = OutMsgQueueExtra;

export function loadOutMsgQueueExtra(slice: Slice): OutMsgQueueExtra {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0x0))) {
        slice.loadUint(4);
        let dispatch_queue: DispatchQueue = loadDispatchQueue(slice);
        let out_queue_size: Maybe<bigint> = loadMaybe<bigint>(slice, ((slice: Slice) => {
            return slice.loadUintBig(48)

        }));
        return {
            kind: 'OutMsgQueueExtra',
            dispatch_queue: dispatch_queue,
            out_queue_size: out_queue_size,
        }

    }
    throw new Error('Expected one of "OutMsgQueueExtra" in loading "OutMsgQueueExtra", but data does not satisfy any constructor');
}

export function storeOutMsgQueueExtra(outMsgQueueExtra: OutMsgQueueExtra): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x0, 4);
        storeDispatchQueue(outMsgQueueExtra.dispatch_queue)(builder);
        storeMaybe<bigint>(outMsgQueueExtra.out_queue_size, ((arg: bigint) => {
            return ((builder: Builder) => {
                builder.storeUint(arg, 48);
            })

        }))(builder);
    })

}

/*
_ out_queue:OutMsgQueue proc_info:ProcessedInfo
  extra:(Maybe OutMsgQueueExtra) = OutMsgQueueInfo;
*/

export function loadOutMsgQueueInfo(slice: Slice): OutMsgQueueInfo {
    let out_queue: OutMsgQueue = loadOutMsgQueue(slice);
    let proc_info: ProcessedInfo = loadProcessedInfo(slice);
    let extra: Maybe<OutMsgQueueExtra> = loadMaybe<OutMsgQueueExtra>(slice, loadOutMsgQueueExtra);
    return {
        kind: 'OutMsgQueueInfo',
        out_queue: out_queue,
        proc_info: proc_info,
        extra: extra,
    }

}

export function storeOutMsgQueueInfo(outMsgQueueInfo: OutMsgQueueInfo): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeOutMsgQueue(outMsgQueueInfo.out_queue)(builder);
        storeProcessedInfo(outMsgQueueInfo.proc_info)(builder);
        storeMaybe<OutMsgQueueExtra>(outMsgQueueInfo.extra, storeOutMsgQueueExtra)(builder);
    })

}

// storage_extra_none$000 = StorageExtraInfo;

// storage_extra_info$001 dict_hash:uint256 = StorageExtraInfo;

export function loadStorageExtraInfo(slice: Slice): StorageExtraInfo {
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b000))) {
        slice.loadUint(3);
        return {
            kind: 'StorageExtraInfo_storage_extra_none',
        }

    }
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b001))) {
        slice.loadUint(3);
        let dict_hash: bigint = slice.loadUintBig(256);
        return {
            kind: 'StorageExtraInfo_storage_extra_info',
            dict_hash: dict_hash,
        }

    }
    throw new Error('Expected one of "StorageExtraInfo_storage_extra_none", "StorageExtraInfo_storage_extra_info" in loading "StorageExtraInfo", but data does not satisfy any constructor');
}

export function storeStorageExtraInfo(storageExtraInfo: StorageExtraInfo): (builder: Builder) => void {
    if ((storageExtraInfo.kind == 'StorageExtraInfo_storage_extra_none')) {
        return ((builder: Builder) => {
            builder.storeUint(0b000, 3);
        })

    }
    if ((storageExtraInfo.kind == 'StorageExtraInfo_storage_extra_info')) {
        return ((builder: Builder) => {
            builder.storeUint(0b001, 3);
            builder.storeUint(storageExtraInfo.dict_hash, 256);
        })

    }
    throw new Error('Expected one of "StorageExtraInfo_storage_extra_none", "StorageExtraInfo_storage_extra_info" in loading "StorageExtraInfo", but data does not satisfy any constructor');
}

// storage_used$_ cells:(VarUInteger 7) bits:(VarUInteger 7) = StorageUsed;

export function loadStorageUsed(slice: Slice): StorageUsed {
    let _cells: bigint = slice.loadVarUintBig(bitLen((7 - 1)));
    let bits: bigint = slice.loadVarUintBig(bitLen((7 - 1)));
    return {
        kind: 'StorageUsed',
        _cells: _cells,
        bits: bits,
    }

}

export function storeStorageUsed(storageUsed: StorageUsed): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeVarUint(storageUsed._cells, bitLen((7 - 1)));
        builder.storeVarUint(storageUsed.bits, bitLen((7 - 1)));
    })

}

/*
storage_info$_ used:StorageUsed storage_extra:StorageExtraInfo last_paid:uint32
              due_payment:(Maybe Grams) = StorageInfo;
*/

export function loadStorageInfo(slice: Slice): StorageInfo {
    let used: StorageUsed = loadStorageUsed(slice);
    let storage_extra: StorageExtraInfo = loadStorageExtraInfo(slice);
    let last_paid: number = slice.loadUint(32);
    let due_payment: Maybe<bigint> = loadMaybe<bigint>(slice, ((slice: Slice) => {
        return slice.loadCoins()

    }));
    return {
        kind: 'StorageInfo',
        used: used,
        storage_extra: storage_extra,
        last_paid: last_paid,
        due_payment: due_payment,
    }

}

export function storeStorageInfo(storageInfo: StorageInfo): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeStorageUsed(storageInfo.used)(builder);
        storeStorageExtraInfo(storageInfo.storage_extra)(builder);
        builder.storeUint(storageInfo.last_paid, 32);
        storeMaybe<bigint>(storageInfo.due_payment, ((arg: bigint) => {
            return ((builder: Builder) => {
                builder.storeCoins(arg);
            })

        }))(builder);
    })

}

// account_none$0 = Account;

/*
account$1 addr:MsgAddressInt storage_stat:StorageInfo
          storage:AccountStorage = Account;
*/

export function loadAccount(slice: Slice): Account {
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b0))) {
        slice.loadUint(1);
        return {
            kind: 'Account_account_none',
        }

    }
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b1))) {
        slice.loadUint(1);
        let addr: Address = slice.loadAddress();
        let storage_stat: StorageInfo = loadStorageInfo(slice);
        let storage: AccountStorage = loadAccountStorage(slice);
        return {
            kind: 'Account_account',
            addr: addr,
            storage_stat: storage_stat,
            storage: storage,
        }

    }
    throw new Error('Expected one of "Account_account_none", "Account_account" in loading "Account", but data does not satisfy any constructor');
}

export function storeAccount(account: Account): (builder: Builder) => void {
    if ((account.kind == 'Account_account_none')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
        })

    }
    if ((account.kind == 'Account_account')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1, 1);
            builder.storeAddress(account.addr);
            storeStorageInfo(account.storage_stat)(builder);
            storeAccountStorage(account.storage)(builder);
        })

    }
    throw new Error('Expected one of "Account_account_none", "Account_account" in loading "Account", but data does not satisfy any constructor');
}

/*
account_storage$_ last_trans_lt:uint64
    balance:CurrencyCollection state:AccountState
  = AccountStorage;
*/

export function loadAccountStorage(slice: Slice): AccountStorage {
    let last_trans_lt: bigint = slice.loadUintBig(64);
    let balance: CurrencyCollection = loadCurrencyCollection(slice);
    let state: AccountState = loadAccountState(slice);
    return {
        kind: 'AccountStorage',
        last_trans_lt: last_trans_lt,
        balance: balance,
        state: state,
    }

}

export function storeAccountStorage(accountStorage: AccountStorage): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(accountStorage.last_trans_lt, 64);
        storeCurrencyCollection(accountStorage.balance)(builder);
        storeAccountState(accountStorage.state)(builder);
    })

}

// account_uninit$00 = AccountState;

// account_active$1 _:StateInit = AccountState;

// account_frozen$01 state_hash:bits256 = AccountState;

export function loadAccountState(slice: Slice): AccountState {
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b00))) {
        slice.loadUint(2);
        return {
            kind: 'AccountState_account_uninit',
        }

    }
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b1))) {
        slice.loadUint(1);
        let _: StateInit = loadStateInit(slice);
        return {
            kind: 'AccountState_account_active',
            _: _,
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b01))) {
        slice.loadUint(2);
        let state_hash: Buffer = slice.loadBuffer((256 / 8));
        return {
            kind: 'AccountState_account_frozen',
            state_hash: state_hash,
        }

    }
    throw new Error('Expected one of "AccountState_account_uninit", "AccountState_account_active", "AccountState_account_frozen" in loading "AccountState", but data does not satisfy any constructor');
}

export function storeAccountState(accountState: AccountState): (builder: Builder) => void {
    if ((accountState.kind == 'AccountState_account_uninit')) {
        return ((builder: Builder) => {
            builder.storeUint(0b00, 2);
        })

    }
    if ((accountState.kind == 'AccountState_account_active')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1, 1);
            storeStateInit(accountState._)(builder);
        })

    }
    if ((accountState.kind == 'AccountState_account_frozen')) {
        return ((builder: Builder) => {
            builder.storeUint(0b01, 2);
            builder.storeBuffer(accountState.state_hash, (256 / 8));
        })

    }
    throw new Error('Expected one of "AccountState_account_uninit", "AccountState_account_active", "AccountState_account_frozen" in loading "AccountState", but data does not satisfy any constructor');
}

// acc_state_uninit$00 = AccountStatus;

// acc_state_frozen$01 = AccountStatus;

// acc_state_active$10 = AccountStatus;

// acc_state_nonexist$11 = AccountStatus;

export function loadAccountStatus(slice: Slice): AccountStatus {
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b00))) {
        slice.loadUint(2);
        return {
            kind: 'AccountStatus_acc_state_uninit',
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b01))) {
        slice.loadUint(2);
        return {
            kind: 'AccountStatus_acc_state_frozen',
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b10))) {
        slice.loadUint(2);
        return {
            kind: 'AccountStatus_acc_state_active',
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b11))) {
        slice.loadUint(2);
        return {
            kind: 'AccountStatus_acc_state_nonexist',
        }

    }
    throw new Error('Expected one of "AccountStatus_acc_state_uninit", "AccountStatus_acc_state_frozen", "AccountStatus_acc_state_active", "AccountStatus_acc_state_nonexist" in loading "AccountStatus", but data does not satisfy any constructor');
}

export function storeAccountStatus(accountStatus: AccountStatus): (builder: Builder) => void {
    if ((accountStatus.kind == 'AccountStatus_acc_state_uninit')) {
        return ((builder: Builder) => {
            builder.storeUint(0b00, 2);
        })

    }
    if ((accountStatus.kind == 'AccountStatus_acc_state_frozen')) {
        return ((builder: Builder) => {
            builder.storeUint(0b01, 2);
        })

    }
    if ((accountStatus.kind == 'AccountStatus_acc_state_active')) {
        return ((builder: Builder) => {
            builder.storeUint(0b10, 2);
        })

    }
    if ((accountStatus.kind == 'AccountStatus_acc_state_nonexist')) {
        return ((builder: Builder) => {
            builder.storeUint(0b11, 2);
        })

    }
    throw new Error('Expected one of "AccountStatus_acc_state_uninit", "AccountStatus_acc_state_frozen", "AccountStatus_acc_state_active", "AccountStatus_acc_state_nonexist" in loading "AccountStatus", but data does not satisfy any constructor');
}

/*
account_descr$_ account:^Account last_trans_hash:bits256
  last_trans_lt:uint64 = ShardAccount;
*/

export function loadShardAccount(slice: Slice): ShardAccount {
    let slice1 = slice.loadRef().beginParse(true);
    let account: Account = loadAccount(slice1);
    let last_trans_hash: Buffer = slice.loadBuffer((256 / 8));
    let last_trans_lt: bigint = slice.loadUintBig(64);
    return {
        kind: 'ShardAccount',
        account: account,
        last_trans_hash: last_trans_hash,
        last_trans_lt: last_trans_lt,
    }

}

export function storeShardAccount(shardAccount: ShardAccount): (builder: Builder) => void {
    return ((builder: Builder) => {
        let cell1 = beginCell();
        storeAccount(shardAccount.account)(cell1);
        builder.storeRef(cell1);
        builder.storeBuffer(shardAccount.last_trans_hash, (256 / 8));
        builder.storeUint(shardAccount.last_trans_lt, 64);
    })

}

// depth_balance$_ split_depth:(#<= 30) balance:CurrencyCollection = DepthBalanceInfo;

export function loadDepthBalanceInfo(slice: Slice): DepthBalanceInfo {
    let split_depth: number = slice.loadUint(bitLen(30));
    let balance: CurrencyCollection = loadCurrencyCollection(slice);
    return {
        kind: 'DepthBalanceInfo',
        split_depth: split_depth,
        balance: balance,
    }

}

export function storeDepthBalanceInfo(depthBalanceInfo: DepthBalanceInfo): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(depthBalanceInfo.split_depth, bitLen(30));
        storeCurrencyCollection(depthBalanceInfo.balance)(builder);
    })

}

// _ (HashmapAugE 256 ShardAccount DepthBalanceInfo) = ShardAccounts;

export function loadShardAccounts(slice: Slice): ShardAccounts {
    let anon0: Dictionary<bigint, {value: ShardAccount, extra: DepthBalanceInfo}> = Dictionary.load(Dictionary.Keys.BigUint(256), {
        serialize: () => { throw new Error('Not implemented') },
        parse: ((slice: Slice) => {
        return {
            extra: loadDepthBalanceInfo(slice),
            value: loadShardAccount(slice),
        }

    }),
    }, slice);
    return {
        kind: 'ShardAccounts',
        anon0: anon0,
    }

}

export function storeShardAccounts(shardAccounts: ShardAccounts): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeDict(shardAccounts.anon0, Dictionary.Keys.BigUint(256), {
            serialize: ((arg: {value: ShardAccount, extra: DepthBalanceInfo}, builder: Builder) => {
            ((arg: DepthBalanceInfo) => {
                return ((builder: Builder) => {
                    storeDepthBalanceInfo(arg)(builder);
                })

            })(arg.extra)(builder);
            ((arg: ShardAccount) => {
                return ((builder: Builder) => {
                    storeShardAccount(arg)(builder);
                })

            })(arg.value)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
    })

}

/*
transaction$0111 account_addr:bits256 lt:uint64
  prev_trans_hash:bits256 prev_trans_lt:uint64 now:uint32
  outmsg_cnt:uint15
  orig_status:AccountStatus end_status:AccountStatus
  ^[ in_msg:(Maybe ^(Message Any)) out_msgs:(HashmapE 15 ^(Message Any)) ]
  total_fees:CurrencyCollection state_update:^(HASH_UPDATE Account)
  description:^TransactionDescr = Transaction;
*/

export function loadTransaction(slice: Slice): Transaction {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0b0111))) {
        slice.loadUint(4);
        let account_addr: Buffer = slice.loadBuffer((256 / 8));
        let lt: bigint = slice.loadUintBig(64);
        let prev_trans_hash: Buffer = slice.loadBuffer((256 / 8));
        let prev_trans_lt: bigint = slice.loadUintBig(64);
        let now: number = slice.loadUint(32);
        let outmsg_cnt: number = slice.loadUint(15);
        let orig_status: AccountStatus = loadAccountStatus(slice);
        let end_status: AccountStatus = loadAccountStatus(slice);
        let slice1 = slice.loadRef().beginParse(true);
        let in_msg: Maybe<Message<Cell>> = loadMaybe<Message<Cell>>(slice1, ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadMessage<Cell>(slice1, ((slice: Slice) => {
                return slice.asCell()

            }))

        }));
        let out_msgs: Dictionary<number, Message<Cell>> = Dictionary.load(Dictionary.Keys.Uint(15), {
            serialize: () => { throw new Error('Not implemented') },
            parse: ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadMessage<Cell>(slice1, ((slice: Slice) => {
                return slice.asCell()

            }))

        }),
        }, slice1);
        let total_fees: CurrencyCollection = loadCurrencyCollection(slice);
        let slice2 = slice.loadRef().beginParse(true);
        let state_update: HASH_UPDATE<Account> = loadHASH_UPDATE<Account>(slice2, loadAccount);
        let slice3 = slice.loadRef().beginParse(true);
        let description: TransactionDescr = loadTransactionDescr(slice3);
        return {
            kind: 'Transaction',
            account_addr: account_addr,
            lt: lt,
            prev_trans_hash: prev_trans_hash,
            prev_trans_lt: prev_trans_lt,
            now: now,
            outmsg_cnt: outmsg_cnt,
            orig_status: orig_status,
            end_status: end_status,
            in_msg: in_msg,
            out_msgs: out_msgs,
            total_fees: total_fees,
            state_update: state_update,
            description: description,
        }

    }
    throw new Error('Expected one of "Transaction" in loading "Transaction", but data does not satisfy any constructor');
}

export function storeTransaction(transaction: Transaction): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0b0111, 4);
        builder.storeBuffer(transaction.account_addr, (256 / 8));
        builder.storeUint(transaction.lt, 64);
        builder.storeBuffer(transaction.prev_trans_hash, (256 / 8));
        builder.storeUint(transaction.prev_trans_lt, 64);
        builder.storeUint(transaction.now, 32);
        builder.storeUint(transaction.outmsg_cnt, 15);
        storeAccountStatus(transaction.orig_status)(builder);
        storeAccountStatus(transaction.end_status)(builder);
        let cell1 = beginCell();
        storeMaybe<Message<Cell>>(transaction.in_msg, ((arg: Message<Cell>) => {
            return ((builder: Builder) => {
                let cell1 = beginCell();
                storeMessage<Cell>(arg, ((arg: Cell) => {
                    return ((builder: Builder) => {
                        builder.storeSlice(arg.beginParse(true));
                    })

                }))(cell1);
                builder.storeRef(cell1);

            })

        }))(cell1);
        cell1.storeDict(transaction.out_msgs, Dictionary.Keys.Uint(15), {
            serialize: ((arg: Message<Cell>, builder: Builder) => {
            ((arg: Message<Cell>) => {
                return ((builder: Builder) => {
                    let cell1 = beginCell();
                    storeMessage<Cell>(arg, ((arg: Cell) => {
                        return ((builder: Builder) => {
                            builder.storeSlice(arg.beginParse(true));
                        })

                    }))(cell1);
                    builder.storeRef(cell1);

                })

            })(arg)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
        builder.storeRef(cell1);
        storeCurrencyCollection(transaction.total_fees)(builder);
        let cell2 = beginCell();
        storeHASH_UPDATE<Account>(transaction.state_update, storeAccount)(cell2);
        builder.storeRef(cell2);
        let cell3 = beginCell();
        storeTransactionDescr(transaction.description)(cell3);
        builder.storeRef(cell3);
    })

}

/*
!merkle_update#04 {X:Type} old_hash:bits256 new_hash:bits256 old_depth:uint16 new_depth:uint16
  old:^X new:^X = MERKLE_UPDATE X;
*/

/*
update_hashes#72 {X:Type} old_hash:bits256 new_hash:bits256
  = HASH_UPDATE X;
*/

export function loadHASH_UPDATE<X>(slice: Slice, loadX: (slice: Slice) => X): HASH_UPDATE<X> {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x72))) {
        slice.loadUint(8);
        let old_hash: Buffer = slice.loadBuffer((256 / 8));
        let new_hash: Buffer = slice.loadBuffer((256 / 8));
        return {
            kind: 'HASH_UPDATE',
            old_hash: old_hash,
            new_hash: new_hash,
        }

    }
    throw new Error('Expected one of "HASH_UPDATE" in loading "HASH_UPDATE", but data does not satisfy any constructor');
}

export function storeHASH_UPDATE<X>(hASH_UPDATE: HASH_UPDATE<X>, storeX: (x: X) => (builder: Builder) => void): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x72, 8);
        builder.storeBuffer(hASH_UPDATE.old_hash, (256 / 8));
        builder.storeBuffer(hASH_UPDATE.new_hash, (256 / 8));
    })

}

// !merkle_proof#03 {X:Type} virtual_hash:bits256 depth:uint16 virtual_root:^X = MERKLE_PROOF X;

export function loadMERKLE_PROOF<X>(slice: Slice, loadX: (slice: Slice) => X): MERKLE_PROOF<X> {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x03))) {
        slice.loadUint(8);
        let virtual_hash: Buffer = slice.loadBuffer((256 / 8));
        let depth: number = slice.loadUint(16);
        let slice1 = slice.loadRef().beginParse(true);
        let virtual_root: X = loadX(slice1);
        return {
            kind: 'MERKLE_PROOF',
            virtual_hash: virtual_hash,
            depth: depth,
            virtual_root: virtual_root,
        }

    }
    throw new Error('Expected one of "MERKLE_PROOF" in loading "MERKLE_PROOF", but data does not satisfy any constructor');
}

export function storeMERKLE_PROOF<X>(mERKLE_PROOF: MERKLE_PROOF<X>, storeX: (x: X) => (builder: Builder) => void): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x03, 8);
        builder.storeBuffer(mERKLE_PROOF.virtual_hash, (256 / 8));
        builder.storeUint(mERKLE_PROOF.depth, 16);
        let cell1 = beginCell();
        storeX(mERKLE_PROOF.virtual_root)(cell1);
        builder.storeRef(cell1);
    })

}

/*
acc_trans#5 account_addr:bits256
            transactions:(HashmapAug 64 ^Transaction CurrencyCollection)
            state_update:^(HASH_UPDATE Account)
          = AccountBlock;
*/

export function loadAccountBlock(slice: Slice): AccountBlock {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0x5))) {
        slice.loadUint(4);
        let account_addr: Buffer = slice.loadBuffer((256 / 8));
        let transactions: HashmapAug<Transaction, CurrencyCollection> = loadHashmapAug<Transaction, CurrencyCollection>(slice, 64, ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadTransaction(slice1)

        }), loadCurrencyCollection);
        let slice1 = slice.loadRef().beginParse(true);
        let state_update: HASH_UPDATE<Account> = loadHASH_UPDATE<Account>(slice1, loadAccount);
        return {
            kind: 'AccountBlock',
            account_addr: account_addr,
            transactions: transactions,
            state_update: state_update,
        }

    }
    throw new Error('Expected one of "AccountBlock" in loading "AccountBlock", but data does not satisfy any constructor');
}

export function storeAccountBlock(accountBlock: AccountBlock): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x5, 4);
        builder.storeBuffer(accountBlock.account_addr, (256 / 8));
        storeHashmapAug<Transaction, CurrencyCollection>(accountBlock.transactions, ((arg: Transaction) => {
            return ((builder: Builder) => {
                let cell1 = beginCell();
                storeTransaction(arg)(cell1);
                builder.storeRef(cell1);

            })

        }), storeCurrencyCollection)(builder);
        let cell1 = beginCell();
        storeHASH_UPDATE<Account>(accountBlock.state_update, storeAccount)(cell1);
        builder.storeRef(cell1);
    })

}

// _ (HashmapAugE 256 AccountBlock CurrencyCollection) = ShardAccountBlocks;

export function loadShardAccountBlocks(slice: Slice): ShardAccountBlocks {
    let anon0: Dictionary<bigint, {value: AccountBlock, extra: CurrencyCollection}> = Dictionary.load(Dictionary.Keys.BigUint(256), {
        serialize: () => { throw new Error('Not implemented') },
        parse: ((slice: Slice) => {
        return {
            extra: loadCurrencyCollection(slice),
            value: loadAccountBlock(slice),
        }

    }),
    }, slice);
    return {
        kind: 'ShardAccountBlocks',
        anon0: anon0,
    }

}

export function storeShardAccountBlocks(shardAccountBlocks: ShardAccountBlocks): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeDict(shardAccountBlocks.anon0, Dictionary.Keys.BigUint(256), {
            serialize: ((arg: {value: AccountBlock, extra: CurrencyCollection}, builder: Builder) => {
            ((arg: CurrencyCollection) => {
                return ((builder: Builder) => {
                    storeCurrencyCollection(arg)(builder);
                })

            })(arg.extra)(builder);
            ((arg: AccountBlock) => {
                return ((builder: Builder) => {
                    storeAccountBlock(arg)(builder);
                })

            })(arg.value)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
    })

}

/*
tr_phase_storage$_ storage_fees_collected:Grams
  storage_fees_due:(Maybe Grams)
  status_change:AccStatusChange
  = TrStoragePhase;
*/

export function loadTrStoragePhase(slice: Slice): TrStoragePhase {
    let storage_fees_collected: bigint = slice.loadCoins();
    let storage_fees_due: Maybe<bigint> = loadMaybe<bigint>(slice, ((slice: Slice) => {
        return slice.loadCoins()

    }));
    let status_change: AccStatusChange = loadAccStatusChange(slice);
    return {
        kind: 'TrStoragePhase',
        storage_fees_collected: storage_fees_collected,
        storage_fees_due: storage_fees_due,
        status_change: status_change,
    }

}

export function storeTrStoragePhase(trStoragePhase: TrStoragePhase): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeCoins(trStoragePhase.storage_fees_collected);
        storeMaybe<bigint>(trStoragePhase.storage_fees_due, ((arg: bigint) => {
            return ((builder: Builder) => {
                builder.storeCoins(arg);
            })

        }))(builder);
        storeAccStatusChange(trStoragePhase.status_change)(builder);
    })

}

// acst_unchanged$0 = AccStatusChange;

// acst_frozen$10 = AccStatusChange;

// acst_deleted$11 = AccStatusChange;

export function loadAccStatusChange(slice: Slice): AccStatusChange {
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b0))) {
        slice.loadUint(1);
        return {
            kind: 'AccStatusChange_acst_unchanged',
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b10))) {
        slice.loadUint(2);
        return {
            kind: 'AccStatusChange_acst_frozen',
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b11))) {
        slice.loadUint(2);
        return {
            kind: 'AccStatusChange_acst_deleted',
        }

    }
    throw new Error('Expected one of "AccStatusChange_acst_unchanged", "AccStatusChange_acst_frozen", "AccStatusChange_acst_deleted" in loading "AccStatusChange", but data does not satisfy any constructor');
}

export function storeAccStatusChange(accStatusChange: AccStatusChange): (builder: Builder) => void {
    if ((accStatusChange.kind == 'AccStatusChange_acst_unchanged')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
        })

    }
    if ((accStatusChange.kind == 'AccStatusChange_acst_frozen')) {
        return ((builder: Builder) => {
            builder.storeUint(0b10, 2);
        })

    }
    if ((accStatusChange.kind == 'AccStatusChange_acst_deleted')) {
        return ((builder: Builder) => {
            builder.storeUint(0b11, 2);
        })

    }
    throw new Error('Expected one of "AccStatusChange_acst_unchanged", "AccStatusChange_acst_frozen", "AccStatusChange_acst_deleted" in loading "AccStatusChange", but data does not satisfy any constructor');
}

/*
tr_phase_credit$_ due_fees_collected:(Maybe Grams)
  credit:CurrencyCollection = TrCreditPhase;
*/

export function loadTrCreditPhase(slice: Slice): TrCreditPhase {
    let due_fees_collected: Maybe<bigint> = loadMaybe<bigint>(slice, ((slice: Slice) => {
        return slice.loadCoins()

    }));
    let credit: CurrencyCollection = loadCurrencyCollection(slice);
    return {
        kind: 'TrCreditPhase',
        due_fees_collected: due_fees_collected,
        credit: credit,
    }

}

export function storeTrCreditPhase(trCreditPhase: TrCreditPhase): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeMaybe<bigint>(trCreditPhase.due_fees_collected, ((arg: bigint) => {
            return ((builder: Builder) => {
                builder.storeCoins(arg);
            })

        }))(builder);
        storeCurrencyCollection(trCreditPhase.credit)(builder);
    })

}

/*
tr_phase_compute_skipped$0 reason:ComputeSkipReason
  = TrComputePhase;
*/

/*
tr_phase_compute_vm$1 success:Bool msg_state_used:Bool
  account_activated:Bool gas_fees:Grams
  ^[ gas_used:(VarUInteger 7)
  gas_limit:(VarUInteger 7) gas_credit:(Maybe (VarUInteger 3))
  mode:int8 exit_code:int32 exit_arg:(Maybe int32)
  vm_steps:uint32
  vm_init_state_hash:bits256 vm_final_state_hash:bits256 ]
  = TrComputePhase;
*/

export function loadTrComputePhase(slice: Slice): TrComputePhase {
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b0))) {
        slice.loadUint(1);
        let reason: ComputeSkipReason = loadComputeSkipReason(slice);
        return {
            kind: 'TrComputePhase_tr_phase_compute_skipped',
            reason: reason,
        }

    }
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b1))) {
        slice.loadUint(1);
        let success: Bool = loadBool(slice);
        let msg_state_used: Bool = loadBool(slice);
        let account_activated: Bool = loadBool(slice);
        let gas_fees: bigint = slice.loadCoins();
        let slice1 = slice.loadRef().beginParse(true);
        let gas_used: bigint = slice1.loadVarUintBig(bitLen((7 - 1)));
        let gas_limit: bigint = slice1.loadVarUintBig(bitLen((7 - 1)));
        let gas_credit: Maybe<bigint> = loadMaybe<bigint>(slice1, ((slice: Slice) => {
            return slice1.loadVarUintBig(bitLen((3 - 1)))

        }));
        let mode: number = slice1.loadInt(8);
        let exit_code: number = slice1.loadInt(32);
        let exit_arg: Maybe<number> = loadMaybe<number>(slice1, ((slice: Slice) => {
            return slice1.loadInt(32)

        }));
        let vm_steps: number = slice1.loadUint(32);
        let vm_init_state_hash: Buffer = slice1.loadBuffer((256 / 8));
        let vm_final_state_hash: Buffer = slice1.loadBuffer((256 / 8));
        return {
            kind: 'TrComputePhase_tr_phase_compute_vm',
            success: success,
            msg_state_used: msg_state_used,
            account_activated: account_activated,
            gas_fees: gas_fees,
            gas_used: gas_used,
            gas_limit: gas_limit,
            gas_credit: gas_credit,
            mode: mode,
            exit_code: exit_code,
            exit_arg: exit_arg,
            vm_steps: vm_steps,
            vm_init_state_hash: vm_init_state_hash,
            vm_final_state_hash: vm_final_state_hash,
        }

    }
    throw new Error('Expected one of "TrComputePhase_tr_phase_compute_skipped", "TrComputePhase_tr_phase_compute_vm" in loading "TrComputePhase", but data does not satisfy any constructor');
}

export function storeTrComputePhase(trComputePhase: TrComputePhase): (builder: Builder) => void {
    if ((trComputePhase.kind == 'TrComputePhase_tr_phase_compute_skipped')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
            storeComputeSkipReason(trComputePhase.reason)(builder);
        })

    }
    if ((trComputePhase.kind == 'TrComputePhase_tr_phase_compute_vm')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1, 1);
            storeBool(trComputePhase.success)(builder);
            storeBool(trComputePhase.msg_state_used)(builder);
            storeBool(trComputePhase.account_activated)(builder);
            builder.storeCoins(trComputePhase.gas_fees);
            let cell1 = beginCell();
            cell1.storeVarUint(trComputePhase.gas_used, bitLen((7 - 1)));
            cell1.storeVarUint(trComputePhase.gas_limit, bitLen((7 - 1)));
            storeMaybe<bigint>(trComputePhase.gas_credit, ((arg: bigint) => {
                return ((builder: Builder) => {
                    builder.storeVarUint(arg, bitLen((3 - 1)));
                })

            }))(cell1);
            cell1.storeInt(trComputePhase.mode, 8);
            cell1.storeInt(trComputePhase.exit_code, 32);
            storeMaybe<number>(trComputePhase.exit_arg, ((arg: number) => {
                return ((builder: Builder) => {
                    builder.storeInt(arg, 32);
                })

            }))(cell1);
            cell1.storeUint(trComputePhase.vm_steps, 32);
            cell1.storeBuffer(trComputePhase.vm_init_state_hash, (256 / 8));
            cell1.storeBuffer(trComputePhase.vm_final_state_hash, (256 / 8));
            builder.storeRef(cell1);
        })

    }
    throw new Error('Expected one of "TrComputePhase_tr_phase_compute_skipped", "TrComputePhase_tr_phase_compute_vm" in loading "TrComputePhase", but data does not satisfy any constructor');
}

// cskip_no_state$00 = ComputeSkipReason;

// cskip_bad_state$01 = ComputeSkipReason;

// cskip_no_gas$10 = ComputeSkipReason;

// cskip_suspended$110 = ComputeSkipReason;

export function loadComputeSkipReason(slice: Slice): ComputeSkipReason {
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b00))) {
        slice.loadUint(2);
        return {
            kind: 'ComputeSkipReason_cskip_no_state',
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b01))) {
        slice.loadUint(2);
        return {
            kind: 'ComputeSkipReason_cskip_bad_state',
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b10))) {
        slice.loadUint(2);
        return {
            kind: 'ComputeSkipReason_cskip_no_gas',
        }

    }
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b110))) {
        slice.loadUint(3);
        return {
            kind: 'ComputeSkipReason_cskip_suspended',
        }

    }
    throw new Error('Expected one of "ComputeSkipReason_cskip_no_state", "ComputeSkipReason_cskip_bad_state", "ComputeSkipReason_cskip_no_gas", "ComputeSkipReason_cskip_suspended" in loading "ComputeSkipReason", but data does not satisfy any constructor');
}

export function storeComputeSkipReason(computeSkipReason: ComputeSkipReason): (builder: Builder) => void {
    if ((computeSkipReason.kind == 'ComputeSkipReason_cskip_no_state')) {
        return ((builder: Builder) => {
            builder.storeUint(0b00, 2);
        })

    }
    if ((computeSkipReason.kind == 'ComputeSkipReason_cskip_bad_state')) {
        return ((builder: Builder) => {
            builder.storeUint(0b01, 2);
        })

    }
    if ((computeSkipReason.kind == 'ComputeSkipReason_cskip_no_gas')) {
        return ((builder: Builder) => {
            builder.storeUint(0b10, 2);
        })

    }
    if ((computeSkipReason.kind == 'ComputeSkipReason_cskip_suspended')) {
        return ((builder: Builder) => {
            builder.storeUint(0b110, 3);
        })

    }
    throw new Error('Expected one of "ComputeSkipReason_cskip_no_state", "ComputeSkipReason_cskip_bad_state", "ComputeSkipReason_cskip_no_gas", "ComputeSkipReason_cskip_suspended" in loading "ComputeSkipReason", but data does not satisfy any constructor');
}

/*
tr_phase_action$_ success:Bool valid:Bool no_funds:Bool
  status_change:AccStatusChange
  total_fwd_fees:(Maybe Grams) total_action_fees:(Maybe Grams)
  result_code:int32 result_arg:(Maybe int32) tot_actions:uint16
  spec_actions:uint16 skipped_actions:uint16 msgs_created:uint16
  action_list_hash:bits256 tot_msg_size:StorageUsed
  = TrActionPhase;
*/

export function loadTrActionPhase(slice: Slice): TrActionPhase {
    let success: Bool = loadBool(slice);
    let valid: Bool = loadBool(slice);
    let no_funds: Bool = loadBool(slice);
    let status_change: AccStatusChange = loadAccStatusChange(slice);
    let total_fwd_fees: Maybe<bigint> = loadMaybe<bigint>(slice, ((slice: Slice) => {
        return slice.loadCoins()

    }));
    let total_action_fees: Maybe<bigint> = loadMaybe<bigint>(slice, ((slice: Slice) => {
        return slice.loadCoins()

    }));
    let result_code: number = slice.loadInt(32);
    let result_arg: Maybe<number> = loadMaybe<number>(slice, ((slice: Slice) => {
        return slice.loadInt(32)

    }));
    let tot_actions: number = slice.loadUint(16);
    let spec_actions: number = slice.loadUint(16);
    let skipped_actions: number = slice.loadUint(16);
    let msgs_created: number = slice.loadUint(16);
    let action_list_hash: Buffer = slice.loadBuffer((256 / 8));
    let tot_msg_size: StorageUsed = loadStorageUsed(slice);
    return {
        kind: 'TrActionPhase',
        success: success,
        valid: valid,
        no_funds: no_funds,
        status_change: status_change,
        total_fwd_fees: total_fwd_fees,
        total_action_fees: total_action_fees,
        result_code: result_code,
        result_arg: result_arg,
        tot_actions: tot_actions,
        spec_actions: spec_actions,
        skipped_actions: skipped_actions,
        msgs_created: msgs_created,
        action_list_hash: action_list_hash,
        tot_msg_size: tot_msg_size,
    }

}

export function storeTrActionPhase(trActionPhase: TrActionPhase): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeBool(trActionPhase.success)(builder);
        storeBool(trActionPhase.valid)(builder);
        storeBool(trActionPhase.no_funds)(builder);
        storeAccStatusChange(trActionPhase.status_change)(builder);
        storeMaybe<bigint>(trActionPhase.total_fwd_fees, ((arg: bigint) => {
            return ((builder: Builder) => {
                builder.storeCoins(arg);
            })

        }))(builder);
        storeMaybe<bigint>(trActionPhase.total_action_fees, ((arg: bigint) => {
            return ((builder: Builder) => {
                builder.storeCoins(arg);
            })

        }))(builder);
        builder.storeInt(trActionPhase.result_code, 32);
        storeMaybe<number>(trActionPhase.result_arg, ((arg: number) => {
            return ((builder: Builder) => {
                builder.storeInt(arg, 32);
            })

        }))(builder);
        builder.storeUint(trActionPhase.tot_actions, 16);
        builder.storeUint(trActionPhase.spec_actions, 16);
        builder.storeUint(trActionPhase.skipped_actions, 16);
        builder.storeUint(trActionPhase.msgs_created, 16);
        builder.storeBuffer(trActionPhase.action_list_hash, (256 / 8));
        storeStorageUsed(trActionPhase.tot_msg_size)(builder);
    })

}

// tr_phase_bounce_negfunds$00 = TrBouncePhase;

/*
tr_phase_bounce_nofunds$01 msg_size:StorageUsed
  req_fwd_fees:Grams = TrBouncePhase;
*/

/*
tr_phase_bounce_ok$1 msg_size:StorageUsed
  msg_fees:Grams fwd_fees:Grams = TrBouncePhase;
*/

export function loadTrBouncePhase(slice: Slice): TrBouncePhase {
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b00))) {
        slice.loadUint(2);
        return {
            kind: 'TrBouncePhase_tr_phase_bounce_negfunds',
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b01))) {
        slice.loadUint(2);
        let msg_size: StorageUsed = loadStorageUsed(slice);
        let req_fwd_fees: bigint = slice.loadCoins();
        return {
            kind: 'TrBouncePhase_tr_phase_bounce_nofunds',
            msg_size: msg_size,
            req_fwd_fees: req_fwd_fees,
        }

    }
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b1))) {
        slice.loadUint(1);
        let msg_size: StorageUsed = loadStorageUsed(slice);
        let msg_fees: bigint = slice.loadCoins();
        let fwd_fees: bigint = slice.loadCoins();
        return {
            kind: 'TrBouncePhase_tr_phase_bounce_ok',
            msg_size: msg_size,
            msg_fees: msg_fees,
            fwd_fees: fwd_fees,
        }

    }
    throw new Error('Expected one of "TrBouncePhase_tr_phase_bounce_negfunds", "TrBouncePhase_tr_phase_bounce_nofunds", "TrBouncePhase_tr_phase_bounce_ok" in loading "TrBouncePhase", but data does not satisfy any constructor');
}

export function storeTrBouncePhase(trBouncePhase: TrBouncePhase): (builder: Builder) => void {
    if ((trBouncePhase.kind == 'TrBouncePhase_tr_phase_bounce_negfunds')) {
        return ((builder: Builder) => {
            builder.storeUint(0b00, 2);
        })

    }
    if ((trBouncePhase.kind == 'TrBouncePhase_tr_phase_bounce_nofunds')) {
        return ((builder: Builder) => {
            builder.storeUint(0b01, 2);
            storeStorageUsed(trBouncePhase.msg_size)(builder);
            builder.storeCoins(trBouncePhase.req_fwd_fees);
        })

    }
    if ((trBouncePhase.kind == 'TrBouncePhase_tr_phase_bounce_ok')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1, 1);
            storeStorageUsed(trBouncePhase.msg_size)(builder);
            builder.storeCoins(trBouncePhase.msg_fees);
            builder.storeCoins(trBouncePhase.fwd_fees);
        })

    }
    throw new Error('Expected one of "TrBouncePhase_tr_phase_bounce_negfunds", "TrBouncePhase_tr_phase_bounce_nofunds", "TrBouncePhase_tr_phase_bounce_ok" in loading "TrBouncePhase", but data does not satisfy any constructor');
}

/*
trans_ord$0000 credit_first:Bool
  storage_ph:(Maybe TrStoragePhase)
  credit_ph:(Maybe TrCreditPhase)
  compute_ph:TrComputePhase action:(Maybe ^TrActionPhase)
  aborted:Bool bounce:(Maybe TrBouncePhase)
  destroyed:Bool
  = TransactionDescr;
*/

/*
trans_storage$0001 storage_ph:TrStoragePhase
  = TransactionDescr;
*/

/*
trans_tick_tock$001 is_tock:Bool storage_ph:TrStoragePhase
  compute_ph:TrComputePhase action:(Maybe ^TrActionPhase)
  aborted:Bool destroyed:Bool = TransactionDescr;
*/

/*
trans_split_prepare$0100 split_info:SplitMergeInfo
  storage_ph:(Maybe TrStoragePhase)
  compute_ph:TrComputePhase action:(Maybe ^TrActionPhase)
  aborted:Bool destroyed:Bool
  = TransactionDescr;
*/

/*
trans_split_install$0101 split_info:SplitMergeInfo
  prepare_transaction:^Transaction
  installed:Bool = TransactionDescr;
*/

/*
trans_merge_prepare$0110 split_info:SplitMergeInfo
  storage_ph:TrStoragePhase aborted:Bool
  = TransactionDescr;
*/

/*
trans_merge_install$0111 split_info:SplitMergeInfo
  prepare_transaction:^Transaction
  storage_ph:(Maybe TrStoragePhase)
  credit_ph:(Maybe TrCreditPhase)
  compute_ph:TrComputePhase action:(Maybe ^TrActionPhase)
  aborted:Bool destroyed:Bool
  = TransactionDescr;
*/

export function loadTransactionDescr(slice: Slice): TransactionDescr {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0b0000))) {
        slice.loadUint(4);
        let credit_first: Bool = loadBool(slice);
        let storage_ph: Maybe<TrStoragePhase> = loadMaybe<TrStoragePhase>(slice, loadTrStoragePhase);
        let credit_ph: Maybe<TrCreditPhase> = loadMaybe<TrCreditPhase>(slice, loadTrCreditPhase);
        let compute_ph: TrComputePhase = loadTrComputePhase(slice);
        let action: Maybe<TrActionPhase> = loadMaybe<TrActionPhase>(slice, ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadTrActionPhase(slice1)

        }));
        let aborted: Bool = loadBool(slice);
        let bounce: Maybe<TrBouncePhase> = loadMaybe<TrBouncePhase>(slice, loadTrBouncePhase);
        let destroyed: Bool = loadBool(slice);
        return {
            kind: 'TransactionDescr_trans_ord',
            credit_first: credit_first,
            storage_ph: storage_ph,
            credit_ph: credit_ph,
            compute_ph: compute_ph,
            action: action,
            aborted: aborted,
            bounce: bounce,
            destroyed: destroyed,
        }

    }
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0b0001))) {
        slice.loadUint(4);
        let storage_ph: TrStoragePhase = loadTrStoragePhase(slice);
        return {
            kind: 'TransactionDescr_trans_storage',
            storage_ph: storage_ph,
        }

    }
    if (((slice.remainingBits >= 3) && (slice.preloadUint(3) == 0b001))) {
        slice.loadUint(3);
        let is_tock: Bool = loadBool(slice);
        let storage_ph: TrStoragePhase = loadTrStoragePhase(slice);
        let compute_ph: TrComputePhase = loadTrComputePhase(slice);
        let action: Maybe<TrActionPhase> = loadMaybe<TrActionPhase>(slice, ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadTrActionPhase(slice1)

        }));
        let aborted: Bool = loadBool(slice);
        let destroyed: Bool = loadBool(slice);
        return {
            kind: 'TransactionDescr_trans_tick_tock',
            is_tock: is_tock,
            storage_ph: storage_ph,
            compute_ph: compute_ph,
            action: action,
            aborted: aborted,
            destroyed: destroyed,
        }

    }
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0b0100))) {
        slice.loadUint(4);
        let split_info: SplitMergeInfo = loadSplitMergeInfo(slice);
        let storage_ph: Maybe<TrStoragePhase> = loadMaybe<TrStoragePhase>(slice, loadTrStoragePhase);
        let compute_ph: TrComputePhase = loadTrComputePhase(slice);
        let action: Maybe<TrActionPhase> = loadMaybe<TrActionPhase>(slice, ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadTrActionPhase(slice1)

        }));
        let aborted: Bool = loadBool(slice);
        let destroyed: Bool = loadBool(slice);
        return {
            kind: 'TransactionDescr_trans_split_prepare',
            split_info: split_info,
            storage_ph: storage_ph,
            compute_ph: compute_ph,
            action: action,
            aborted: aborted,
            destroyed: destroyed,
        }

    }
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0b0101))) {
        slice.loadUint(4);
        let split_info: SplitMergeInfo = loadSplitMergeInfo(slice);
        let slice1 = slice.loadRef().beginParse(true);
        let prepare_transaction: Transaction = loadTransaction(slice1);
        let installed: Bool = loadBool(slice);
        return {
            kind: 'TransactionDescr_trans_split_install',
            split_info: split_info,
            prepare_transaction: prepare_transaction,
            installed: installed,
        }

    }
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0b0110))) {
        slice.loadUint(4);
        let split_info: SplitMergeInfo = loadSplitMergeInfo(slice);
        let storage_ph: TrStoragePhase = loadTrStoragePhase(slice);
        let aborted: Bool = loadBool(slice);
        return {
            kind: 'TransactionDescr_trans_merge_prepare',
            split_info: split_info,
            storage_ph: storage_ph,
            aborted: aborted,
        }

    }
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0b0111))) {
        slice.loadUint(4);
        let split_info: SplitMergeInfo = loadSplitMergeInfo(slice);
        let slice1 = slice.loadRef().beginParse(true);
        let prepare_transaction: Transaction = loadTransaction(slice1);
        let storage_ph: Maybe<TrStoragePhase> = loadMaybe<TrStoragePhase>(slice, loadTrStoragePhase);
        let credit_ph: Maybe<TrCreditPhase> = loadMaybe<TrCreditPhase>(slice, loadTrCreditPhase);
        let compute_ph: TrComputePhase = loadTrComputePhase(slice);
        let action: Maybe<TrActionPhase> = loadMaybe<TrActionPhase>(slice, ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadTrActionPhase(slice1)

        }));
        let aborted: Bool = loadBool(slice);
        let destroyed: Bool = loadBool(slice);
        return {
            kind: 'TransactionDescr_trans_merge_install',
            split_info: split_info,
            prepare_transaction: prepare_transaction,
            storage_ph: storage_ph,
            credit_ph: credit_ph,
            compute_ph: compute_ph,
            action: action,
            aborted: aborted,
            destroyed: destroyed,
        }

    }
    throw new Error('Expected one of "TransactionDescr_trans_ord", "TransactionDescr_trans_storage", "TransactionDescr_trans_tick_tock", "TransactionDescr_trans_split_prepare", "TransactionDescr_trans_split_install", "TransactionDescr_trans_merge_prepare", "TransactionDescr_trans_merge_install" in loading "TransactionDescr", but data does not satisfy any constructor');
}

export function storeTransactionDescr(transactionDescr: TransactionDescr): (builder: Builder) => void {
    if ((transactionDescr.kind == 'TransactionDescr_trans_ord')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0000, 4);
            storeBool(transactionDescr.credit_first)(builder);
            storeMaybe<TrStoragePhase>(transactionDescr.storage_ph, storeTrStoragePhase)(builder);
            storeMaybe<TrCreditPhase>(transactionDescr.credit_ph, storeTrCreditPhase)(builder);
            storeTrComputePhase(transactionDescr.compute_ph)(builder);
            storeMaybe<TrActionPhase>(transactionDescr.action, ((arg: TrActionPhase) => {
                return ((builder: Builder) => {
                    let cell1 = beginCell();
                    storeTrActionPhase(arg)(cell1);
                    builder.storeRef(cell1);

                })

            }))(builder);
            storeBool(transactionDescr.aborted)(builder);
            storeMaybe<TrBouncePhase>(transactionDescr.bounce, storeTrBouncePhase)(builder);
            storeBool(transactionDescr.destroyed)(builder);
        })

    }
    if ((transactionDescr.kind == 'TransactionDescr_trans_storage')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0001, 4);
            storeTrStoragePhase(transactionDescr.storage_ph)(builder);
        })

    }
    if ((transactionDescr.kind == 'TransactionDescr_trans_tick_tock')) {
        return ((builder: Builder) => {
            builder.storeUint(0b001, 3);
            storeBool(transactionDescr.is_tock)(builder);
            storeTrStoragePhase(transactionDescr.storage_ph)(builder);
            storeTrComputePhase(transactionDescr.compute_ph)(builder);
            storeMaybe<TrActionPhase>(transactionDescr.action, ((arg: TrActionPhase) => {
                return ((builder: Builder) => {
                    let cell1 = beginCell();
                    storeTrActionPhase(arg)(cell1);
                    builder.storeRef(cell1);

                })

            }))(builder);
            storeBool(transactionDescr.aborted)(builder);
            storeBool(transactionDescr.destroyed)(builder);
        })

    }
    if ((transactionDescr.kind == 'TransactionDescr_trans_split_prepare')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0100, 4);
            storeSplitMergeInfo(transactionDescr.split_info)(builder);
            storeMaybe<TrStoragePhase>(transactionDescr.storage_ph, storeTrStoragePhase)(builder);
            storeTrComputePhase(transactionDescr.compute_ph)(builder);
            storeMaybe<TrActionPhase>(transactionDescr.action, ((arg: TrActionPhase) => {
                return ((builder: Builder) => {
                    let cell1 = beginCell();
                    storeTrActionPhase(arg)(cell1);
                    builder.storeRef(cell1);

                })

            }))(builder);
            storeBool(transactionDescr.aborted)(builder);
            storeBool(transactionDescr.destroyed)(builder);
        })

    }
    if ((transactionDescr.kind == 'TransactionDescr_trans_split_install')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0101, 4);
            storeSplitMergeInfo(transactionDescr.split_info)(builder);
            let cell1 = beginCell();
            storeTransaction(transactionDescr.prepare_transaction)(cell1);
            builder.storeRef(cell1);
            storeBool(transactionDescr.installed)(builder);
        })

    }
    if ((transactionDescr.kind == 'TransactionDescr_trans_merge_prepare')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0110, 4);
            storeSplitMergeInfo(transactionDescr.split_info)(builder);
            storeTrStoragePhase(transactionDescr.storage_ph)(builder);
            storeBool(transactionDescr.aborted)(builder);
        })

    }
    if ((transactionDescr.kind == 'TransactionDescr_trans_merge_install')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0111, 4);
            storeSplitMergeInfo(transactionDescr.split_info)(builder);
            let cell1 = beginCell();
            storeTransaction(transactionDescr.prepare_transaction)(cell1);
            builder.storeRef(cell1);
            storeMaybe<TrStoragePhase>(transactionDescr.storage_ph, storeTrStoragePhase)(builder);
            storeMaybe<TrCreditPhase>(transactionDescr.credit_ph, storeTrCreditPhase)(builder);
            storeTrComputePhase(transactionDescr.compute_ph)(builder);
            storeMaybe<TrActionPhase>(transactionDescr.action, ((arg: TrActionPhase) => {
                return ((builder: Builder) => {
                    let cell1 = beginCell();
                    storeTrActionPhase(arg)(cell1);
                    builder.storeRef(cell1);

                })

            }))(builder);
            storeBool(transactionDescr.aborted)(builder);
            storeBool(transactionDescr.destroyed)(builder);
        })

    }
    throw new Error('Expected one of "TransactionDescr_trans_ord", "TransactionDescr_trans_storage", "TransactionDescr_trans_tick_tock", "TransactionDescr_trans_split_prepare", "TransactionDescr_trans_split_install", "TransactionDescr_trans_merge_prepare", "TransactionDescr_trans_merge_install" in loading "TransactionDescr", but data does not satisfy any constructor');
}

/*
split_merge_info$_ cur_shard_pfx_len:(## 6)
  acc_split_depth:(## 6) this_addr:bits256 sibling_addr:bits256
  = SplitMergeInfo;
*/

export function loadSplitMergeInfo(slice: Slice): SplitMergeInfo {
    let cur_shard_pfx_len: number = slice.loadUint(6);
    let acc_split_depth: number = slice.loadUint(6);
    let this_addr: Buffer = slice.loadBuffer((256 / 8));
    let sibling_addr: Buffer = slice.loadBuffer((256 / 8));
    return {
        kind: 'SplitMergeInfo',
        cur_shard_pfx_len: cur_shard_pfx_len,
        acc_split_depth: acc_split_depth,
        this_addr: this_addr,
        sibling_addr: sibling_addr,
    }

}

export function storeSplitMergeInfo(splitMergeInfo: SplitMergeInfo): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(splitMergeInfo.cur_shard_pfx_len, 6);
        builder.storeUint(splitMergeInfo.acc_split_depth, 6);
        builder.storeBuffer(splitMergeInfo.this_addr, (256 / 8));
        builder.storeBuffer(splitMergeInfo.sibling_addr, (256 / 8));
    })

}

/*
smc_info#076ef1ea actions:uint16 msgs_sent:uint16
  unixtime:uint32 block_lt:uint64 trans_lt:uint64
  rand_seed:bits256 balance_remaining:CurrencyCollection
  myself:MsgAddressInt global_config:(Maybe Cell) = SmartContractInfo;
*/

// out_list_empty$_ = OutList 0;

/*
out_list$_ {n:#} prev:^(OutList n) action:OutAction
  = OutList (n + 1);
*/

export function storeOutList(outList: OutList): (builder: Builder) => void {
    if ((outList.kind == 'OutList_out_list_empty')) {
        return ((builder: Builder) => {
        })

    }
    if ((outList.kind == 'OutList_out_list')) {
        return ((builder: Builder) => {
            let cell1 = beginCell();
            storeOutList(outList.prev)(cell1);
            builder.storeRef(cell1);
            storeOutAction(outList.action)(builder);
        })

    }
    throw new Error('Expected one of "OutList_out_list_empty", "OutList_out_list" in loading "OutList", but data does not satisfy any constructor');
}

/*
action_send_msg#0ec3c86d mode:(## 8)
  out_msg:^(MessageRelaxed Any) = OutAction;
*/

// action_set_code#ad4de08e new_code:^Cell = OutAction;

/*
action_reserve_currency#36e6b809 mode:(## 8)
  currency:CurrencyCollection = OutAction;
*/

/*
action_change_library#26fa1dd4 mode:(## 7)
  libref:LibRef = OutAction;
*/

export function storeOutAction(outAction: OutAction): (builder: Builder) => void {
    if ((outAction.kind == 'OutAction_action_send_msg')) {
        return ((builder: Builder) => {
            builder.storeUint(0x0ec3c86d, 32);
            builder.storeUint(outAction.mode, 8);
            let cell1 = beginCell();
            storeMessageRelaxed<Cell>(outAction.out_msg, ((arg: Cell) => {
                return ((builder: Builder) => {
                    builder.storeSlice(arg.beginParse(true));
                })

            }))(cell1);
            builder.storeRef(cell1);
        })

    }
    if ((outAction.kind == 'OutAction_action_set_code')) {
        return ((builder: Builder) => {
            builder.storeUint(0xad4de08e, 32);
            let cell1 = beginCell();
            cell1.storeSlice(outAction.new_code.beginParse(true));
            builder.storeRef(cell1);
        })

    }
    if ((outAction.kind == 'OutAction_action_reserve_currency')) {
        return ((builder: Builder) => {
            builder.storeUint(0x36e6b809, 32);
            builder.storeUint(outAction.mode, 8);
            storeCurrencyCollection(outAction.currency)(builder);
        })

    }
    if ((outAction.kind == 'OutAction_action_change_library')) {
        return ((builder: Builder) => {
            builder.storeUint(0x26fa1dd4, 32);
            builder.storeUint(outAction.mode, 7);
            storeLibRef(outAction.libref)(builder);
        })

    }
    throw new Error('Expected one of "OutAction_action_send_msg", "OutAction_action_set_code", "OutAction_action_reserve_currency", "OutAction_action_change_library" in loading "OutAction", but data does not satisfy any constructor');
}

// libref_hash$0 lib_hash:bits256 = LibRef;

// libref_ref$1 library:^Cell = LibRef;

export function storeLibRef(libRef: LibRef): (builder: Builder) => void {
    if ((libRef.kind == 'LibRef_libref_hash')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
            builder.storeBuffer(libRef.lib_hash, (256 / 8));
        })

    }
    if ((libRef.kind == 'LibRef_libref_ref')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1, 1);
            let cell1 = beginCell();
            cell1.storeSlice(libRef.library.beginParse(true));
            builder.storeRef(cell1);
        })

    }
    throw new Error('Expected one of "LibRef_libref_hash", "LibRef_libref_ref" in loading "LibRef", but data does not satisfy any constructor');
}

// out_list_node$_ prev:^Cell action:OutAction = OutListNode;

/*
shard_ident$00 shard_pfx_bits:(#<= 60)
  workchain_id:int32 shard_prefix:uint64 = ShardIdent;
*/

export function loadShardIdent(slice: Slice): ShardIdent {
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b00))) {
        slice.loadUint(2);
        let shard_pfx_bits: number = slice.loadUint(bitLen(60));
        let workchain_id: number = slice.loadInt(32);
        let shard_prefix: bigint = slice.loadUintBig(64);
        return {
            kind: 'ShardIdent',
            shard_pfx_bits: shard_pfx_bits,
            workchain_id: workchain_id,
            shard_prefix: shard_prefix,
        }

    }
    throw new Error('Expected one of "ShardIdent" in loading "ShardIdent", but data does not satisfy any constructor');
}

export function storeShardIdent(shardIdent: ShardIdent): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0b00, 2);
        builder.storeUint(shardIdent.shard_pfx_bits, bitLen(60));
        builder.storeInt(shardIdent.workchain_id, 32);
        builder.storeUint(shardIdent.shard_prefix, 64);
    })

}

/*
ext_blk_ref$_ end_lt:uint64
  seq_no:uint32 root_hash:bits256 file_hash:bits256
  = ExtBlkRef;
*/

export function loadExtBlkRef(slice: Slice): ExtBlkRef {
    let end_lt: bigint = slice.loadUintBig(64);
    let seq_no: number = slice.loadUint(32);
    let root_hash: Buffer = slice.loadBuffer((256 / 8));
    let file_hash: Buffer = slice.loadBuffer((256 / 8));
    return {
        kind: 'ExtBlkRef',
        end_lt: end_lt,
        seq_no: seq_no,
        root_hash: root_hash,
        file_hash: file_hash,
    }

}

export function storeExtBlkRef(extBlkRef: ExtBlkRef): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(extBlkRef.end_lt, 64);
        builder.storeUint(extBlkRef.seq_no, 32);
        builder.storeBuffer(extBlkRef.root_hash, (256 / 8));
        builder.storeBuffer(extBlkRef.file_hash, (256 / 8));
    })

}

/*
block_id_ext$_ shard_id:ShardIdent seq_no:uint32
  root_hash:bits256 file_hash:bits256 = BlockIdExt;
*/

// master_info$_ master:ExtBlkRef = BlkMasterInfo;

export function loadBlkMasterInfo(slice: Slice): BlkMasterInfo {
    let master: ExtBlkRef = loadExtBlkRef(slice);
    return {
        kind: 'BlkMasterInfo',
        master: master,
    }

}

export function storeBlkMasterInfo(blkMasterInfo: BlkMasterInfo): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeExtBlkRef(blkMasterInfo.master)(builder);
    })

}

/*
shard_state#9023afe2 global_id:int32
  shard_id:ShardIdent
  seq_no:uint32 vert_seq_no:#
  gen_utime:uint32 gen_lt:uint64
  min_ref_mc_seqno:uint32
  out_msg_queue_info:^OutMsgQueueInfo
  before_split:(## 1)
  accounts:^ShardAccounts
  ^[ overload_history:uint64 underload_history:uint64
  total_balance:CurrencyCollection
  total_validator_fees:CurrencyCollection
  libraries:(HashmapE 256 LibDescr)
  master_ref:(Maybe BlkMasterInfo) ]
  custom:(Maybe ^McStateExtra)
  = ShardStateUnsplit;
*/

export function loadShardStateUnsplit(slice: Slice): ShardStateUnsplit {
    if (((slice.remainingBits >= 32) && (slice.preloadUint(32) == 0x9023afe2))) {
        slice.loadUint(32);
        let global_id: number = slice.loadInt(32);
        let shard_id: ShardIdent = loadShardIdent(slice);
        let seq_no: number = slice.loadUint(32);
        let vert_seq_no: number = slice.loadUint(32);
        let gen_utime: number = slice.loadUint(32);
        let gen_lt: bigint = slice.loadUintBig(64);
        let min_ref_mc_seqno: number = slice.loadUint(32);
        let slice1 = slice.loadRef().beginParse(true);
        let out_msg_queue_info: OutMsgQueueInfo = loadOutMsgQueueInfo(slice1);
        let before_split: number = slice.loadUint(1);
        let slice2 = slice.loadRef().beginParse(true);
        let accounts: ShardAccounts = loadShardAccounts(slice2);
        let slice3 = slice.loadRef().beginParse(true);
        let overload_history: bigint = slice3.loadUintBig(64);
        let underload_history: bigint = slice3.loadUintBig(64);
        let total_balance: CurrencyCollection = loadCurrencyCollection(slice3);
        let total_validator_fees: CurrencyCollection = loadCurrencyCollection(slice3);
        let libraries: Dictionary<bigint, LibDescr> = Dictionary.load(Dictionary.Keys.BigUint(256), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadLibDescr,
        }, slice3);
        let master_ref: Maybe<BlkMasterInfo> = loadMaybe<BlkMasterInfo>(slice3, loadBlkMasterInfo);
        let custom: Maybe<McStateExtra> = loadMaybe<McStateExtra>(slice, ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadMcStateExtra(slice1)

        }));
        return {
            kind: 'ShardStateUnsplit',
            global_id: global_id,
            shard_id: shard_id,
            seq_no: seq_no,
            vert_seq_no: vert_seq_no,
            gen_utime: gen_utime,
            gen_lt: gen_lt,
            min_ref_mc_seqno: min_ref_mc_seqno,
            out_msg_queue_info: out_msg_queue_info,
            before_split: before_split,
            accounts: accounts,
            overload_history: overload_history,
            underload_history: underload_history,
            total_balance: total_balance,
            total_validator_fees: total_validator_fees,
            libraries: libraries,
            master_ref: master_ref,
            custom: custom,
        }

    }
    throw new Error('Expected one of "ShardStateUnsplit" in loading "ShardStateUnsplit", but data does not satisfy any constructor');
}

export function storeShardStateUnsplit(shardStateUnsplit: ShardStateUnsplit): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x9023afe2, 32);
        builder.storeInt(shardStateUnsplit.global_id, 32);
        storeShardIdent(shardStateUnsplit.shard_id)(builder);
        builder.storeUint(shardStateUnsplit.seq_no, 32);
        builder.storeUint(shardStateUnsplit.vert_seq_no, 32);
        builder.storeUint(shardStateUnsplit.gen_utime, 32);
        builder.storeUint(shardStateUnsplit.gen_lt, 64);
        builder.storeUint(shardStateUnsplit.min_ref_mc_seqno, 32);
        let cell1 = beginCell();
        storeOutMsgQueueInfo(shardStateUnsplit.out_msg_queue_info)(cell1);
        builder.storeRef(cell1);
        builder.storeUint(shardStateUnsplit.before_split, 1);
        let cell2 = beginCell();
        storeShardAccounts(shardStateUnsplit.accounts)(cell2);
        builder.storeRef(cell2);
        let cell3 = beginCell();
        cell3.storeUint(shardStateUnsplit.overload_history, 64);
        cell3.storeUint(shardStateUnsplit.underload_history, 64);
        storeCurrencyCollection(shardStateUnsplit.total_balance)(cell3);
        storeCurrencyCollection(shardStateUnsplit.total_validator_fees)(cell3);
        cell3.storeDict(shardStateUnsplit.libraries, Dictionary.Keys.BigUint(256), {
            serialize: ((arg: LibDescr, builder: Builder) => {
            storeLibDescr(arg)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
        storeMaybe<BlkMasterInfo>(shardStateUnsplit.master_ref, storeBlkMasterInfo)(cell3);
        builder.storeRef(cell3);
        storeMaybe<McStateExtra>(shardStateUnsplit.custom, ((arg: McStateExtra) => {
            return ((builder: Builder) => {
                let cell1 = beginCell();
                storeMcStateExtra(arg)(cell1);
                builder.storeRef(cell1);

            })

        }))(builder);
    })

}

// split_state#5f327da5 left:^ShardStateUnsplit right:^ShardStateUnsplit = ShardState;

// _ ShardStateUnsplit = ShardState;

export function loadShardState(slice: Slice): ShardState {
    if (((slice.remainingBits >= 32) && (slice.preloadUint(32) == 0x5f327da5))) {
        slice.loadUint(32);
        let slice1 = slice.loadRef().beginParse(true);
        let left: ShardStateUnsplit = loadShardStateUnsplit(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let right: ShardStateUnsplit = loadShardStateUnsplit(slice2);
        return {
            kind: 'ShardState_split_state',
            left: left,
            right: right,
        }

    }
    if (true) {
        let anon0: ShardStateUnsplit = loadShardStateUnsplit(slice);
        return {
            kind: 'ShardState__',
            anon0: anon0,
        }

    }
    throw new Error('Expected one of "ShardState_split_state", "ShardState__" in loading "ShardState", but data does not satisfy any constructor');
}

export function storeShardState(shardState: ShardState): (builder: Builder) => void {
    if ((shardState.kind == 'ShardState_split_state')) {
        return ((builder: Builder) => {
            builder.storeUint(0x5f327da5, 32);
            let cell1 = beginCell();
            storeShardStateUnsplit(shardState.left)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeShardStateUnsplit(shardState.right)(cell2);
            builder.storeRef(cell2);
        })

    }
    if ((shardState.kind == 'ShardState__')) {
        return ((builder: Builder) => {
            storeShardStateUnsplit(shardState.anon0)(builder);
        })

    }
    throw new Error('Expected one of "ShardState_split_state", "ShardState__" in loading "ShardState", but data does not satisfy any constructor');
}

/*
shared_lib_descr$00 lib:^Cell publishers:(Hashmap 256 True)
  = LibDescr;
*/

export function loadLibDescr(slice: Slice): LibDescr {
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b00))) {
        slice.loadUint(2);
        let slice1 = slice.loadRef().beginParse(true);
        let lib: Cell = slice1.asCell();
        let publishers: Dictionary<bigint, True> = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadTrue,
        }, slice);
        return {
            kind: 'LibDescr',
            lib: lib,
            publishers: publishers,
        }

    }
    throw new Error('Expected one of "LibDescr" in loading "LibDescr", but data does not satisfy any constructor');
}

export function storeLibDescr(libDescr: LibDescr): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0b00, 2);
        let cell1 = beginCell();
        cell1.storeSlice(libDescr.lib.beginParse(true));
        builder.storeRef(cell1);
        builder.storeDictDirect(libDescr.publishers, Dictionary.Keys.BigUint(256), {
            serialize: ((arg: True, builder: Builder) => {
            storeTrue(arg)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
    })

}

/*
block_info#9bc7a987 version:uint32
  not_master:(## 1)
  after_merge:(## 1) before_split:(## 1)
  after_split:(## 1)
  want_split:Bool want_merge:Bool
  key_block:Bool vert_seqno_incr:(## 1)
  flags:(## 8) { flags <= 1 }
  seq_no:# vert_seq_no:# { vert_seq_no >= vert_seqno_incr }
  { prev_seq_no:# } { ~prev_seq_no + 1 = seq_no }
  shard:ShardIdent gen_utime:uint32
  start_lt:uint64 end_lt:uint64
  gen_validator_list_hash_short:uint32
  gen_catchain_seqno:uint32
  min_ref_mc_seqno:uint32
  prev_key_block_seqno:uint32
  gen_software:flags . 0?GlobalVersion
  master_ref:not_master?^BlkMasterInfo
  prev_ref:^(BlkPrevInfo after_merge)
  prev_vert_ref:vert_seqno_incr?^(BlkPrevInfo 0)
  = BlockInfo;
*/

export function loadBlockInfo(slice: Slice): BlockInfo {
    if (((slice.remainingBits >= 32) && (slice.preloadUint(32) == 0x9bc7a987))) {
        slice.loadUint(32);
        let version: number = slice.loadUint(32);
        let not_master: number = slice.loadUint(1);
        let after_merge: number = slice.loadUint(1);
        let before_split: number = slice.loadUint(1);
        let after_split: number = slice.loadUint(1);
        let want_split: Bool = loadBool(slice);
        let want_merge: Bool = loadBool(slice);
        let key_block: Bool = loadBool(slice);
        let vert_seqno_incr: number = slice.loadUint(1);
        let flags: number = slice.loadUint(8);
        let seq_no: number = slice.loadUint(32);
        let vert_seq_no: number = slice.loadUint(32);
        let shard: ShardIdent = loadShardIdent(slice);
        let gen_utime: number = slice.loadUint(32);
        let start_lt: bigint = slice.loadUintBig(64);
        let end_lt: bigint = slice.loadUintBig(64);
        let gen_validator_list_hash_short: number = slice.loadUint(32);
        let gen_catchain_seqno: number = slice.loadUint(32);
        let min_ref_mc_seqno: number = slice.loadUint(32);
        let prev_key_block_seqno: number = slice.loadUint(32);
        let gen_software: GlobalVersion | undefined = ((flags & (1 << 0)) ? loadGlobalVersion(slice) : undefined);
        let master_ref: BlkMasterInfo | undefined = (not_master ? ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadBlkMasterInfo(slice1)

        })(slice) : undefined);
        let slice1 = slice.loadRef().beginParse(true);
        let prev_ref: BlkPrevInfo = loadBlkPrevInfo(slice1, after_merge);
        let prev_vert_ref: BlkPrevInfo | undefined = (vert_seqno_incr ? ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadBlkPrevInfo(slice1, 0)

        })(slice) : undefined);
        if ((!(flags <= 1))) {
            throw new Error('Condition (flags <= 1) is not satisfied while loading "BlockInfo" for type "BlockInfo"');
        }
        if ((!(vert_seq_no >= vert_seqno_incr))) {
            throw new Error('Condition (vert_seq_no >= vert_seqno_incr) is not satisfied while loading "BlockInfo" for type "BlockInfo"');
        }
        return {
            kind: 'BlockInfo',
            prev_seq_no: (seq_no - 1),
            version: version,
            not_master: not_master,
            after_merge: after_merge,
            before_split: before_split,
            after_split: after_split,
            want_split: want_split,
            want_merge: want_merge,
            key_block: key_block,
            vert_seqno_incr: vert_seqno_incr,
            flags: flags,
            seq_no: seq_no,
            vert_seq_no: vert_seq_no,
            shard: shard,
            gen_utime: gen_utime,
            start_lt: start_lt,
            end_lt: end_lt,
            gen_validator_list_hash_short: gen_validator_list_hash_short,
            gen_catchain_seqno: gen_catchain_seqno,
            min_ref_mc_seqno: min_ref_mc_seqno,
            prev_key_block_seqno: prev_key_block_seqno,
            gen_software: gen_software,
            master_ref: master_ref,
            prev_ref: prev_ref,
            prev_vert_ref: prev_vert_ref,
        }

    }
    throw new Error('Expected one of "BlockInfo" in loading "BlockInfo", but data does not satisfy any constructor');
}

export function storeBlockInfo(blockInfo: BlockInfo): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x9bc7a987, 32);
        builder.storeUint(blockInfo.version, 32);
        builder.storeUint(blockInfo.not_master, 1);
        builder.storeUint(blockInfo.after_merge, 1);
        builder.storeUint(blockInfo.before_split, 1);
        builder.storeUint(blockInfo.after_split, 1);
        storeBool(blockInfo.want_split)(builder);
        storeBool(blockInfo.want_merge)(builder);
        storeBool(blockInfo.key_block)(builder);
        builder.storeUint(blockInfo.vert_seqno_incr, 1);
        builder.storeUint(blockInfo.flags, 8);
        builder.storeUint(blockInfo.seq_no, 32);
        builder.storeUint(blockInfo.vert_seq_no, 32);
        storeShardIdent(blockInfo.shard)(builder);
        builder.storeUint(blockInfo.gen_utime, 32);
        builder.storeUint(blockInfo.start_lt, 64);
        builder.storeUint(blockInfo.end_lt, 64);
        builder.storeUint(blockInfo.gen_validator_list_hash_short, 32);
        builder.storeUint(blockInfo.gen_catchain_seqno, 32);
        builder.storeUint(blockInfo.min_ref_mc_seqno, 32);
        builder.storeUint(blockInfo.prev_key_block_seqno, 32);
        if ((blockInfo.gen_software != undefined)) {
            storeGlobalVersion(blockInfo.gen_software)(builder);
        }
        if ((blockInfo.master_ref != undefined)) {
            let cell1 = beginCell();
            storeBlkMasterInfo(blockInfo.master_ref)(cell1);
            builder.storeRef(cell1);

        }
        let cell1 = beginCell();
        storeBlkPrevInfo(blockInfo.prev_ref)(cell1);
        builder.storeRef(cell1);
        if ((blockInfo.prev_vert_ref != undefined)) {
            let cell1 = beginCell();
            storeBlkPrevInfo(blockInfo.prev_vert_ref)(cell1);
            builder.storeRef(cell1);

        }
        if ((!(blockInfo.flags <= 1))) {
            throw new Error('Condition (blockInfo.flags <= 1) is not satisfied while loading "BlockInfo" for type "BlockInfo"');
        }
        if ((!(blockInfo.vert_seq_no >= blockInfo.vert_seqno_incr))) {
            throw new Error('Condition (blockInfo.vert_seq_no >= blockInfo.vert_seqno_incr) is not satisfied while loading "BlockInfo" for type "BlockInfo"');
        }
    })

}

// prev_blk_info$_ prev:ExtBlkRef = BlkPrevInfo 0;

// prev_blks_info$_ prev1:^ExtBlkRef prev2:^ExtBlkRef = BlkPrevInfo 1;

export function loadBlkPrevInfo(slice: Slice, arg0: number): BlkPrevInfo {
    if ((arg0 == 0)) {
        let prev: ExtBlkRef = loadExtBlkRef(slice);
        return {
            kind: 'BlkPrevInfo_prev_blk_info',
            prev: prev,
        }

    }
    if ((arg0 == 1)) {
        let slice1 = slice.loadRef().beginParse(true);
        let prev1: ExtBlkRef = loadExtBlkRef(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let prev2: ExtBlkRef = loadExtBlkRef(slice2);
        return {
            kind: 'BlkPrevInfo_prev_blks_info',
            prev1: prev1,
            prev2: prev2,
        }

    }
    throw new Error('Expected one of "BlkPrevInfo_prev_blk_info", "BlkPrevInfo_prev_blks_info" in loading "BlkPrevInfo", but data does not satisfy any constructor');
}

export function storeBlkPrevInfo(blkPrevInfo: BlkPrevInfo): (builder: Builder) => void {
    if ((blkPrevInfo.kind == 'BlkPrevInfo_prev_blk_info')) {
        return ((builder: Builder) => {
            storeExtBlkRef(blkPrevInfo.prev)(builder);
        })

    }
    if ((blkPrevInfo.kind == 'BlkPrevInfo_prev_blks_info')) {
        return ((builder: Builder) => {
            let cell1 = beginCell();
            storeExtBlkRef(blkPrevInfo.prev1)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeExtBlkRef(blkPrevInfo.prev2)(cell2);
            builder.storeRef(cell2);
        })

    }
    throw new Error('Expected one of "BlkPrevInfo_prev_blk_info", "BlkPrevInfo_prev_blks_info" in loading "BlkPrevInfo", but data does not satisfy any constructor');
}

/*
block#11ef55aa global_id:int32
  info:^BlockInfo value_flow:^ValueFlow
  state_update:^(MERKLE_UPDATE ShardState)
  extra:^BlockExtra = Block;
*/

export function loadBlock(slice: Slice): Block {
    if (((slice.remainingBits >= 32) && (slice.preloadUint(32) == 0x11ef55aa))) {
        slice.loadUint(32);
        let global_id: number = slice.loadInt(32);
        let slice1 = slice.loadRef().beginParse(true);
        let info: BlockInfo = loadBlockInfo(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let value_flow: ValueFlow = loadValueFlow(slice2);
        let cell3 = slice.loadRef();
        let state_update = cell3;
        let slice4 = slice.loadRef().beginParse(true);
        let extra: BlockExtra = loadBlockExtra(slice4);
        return {
            kind: 'Block',
            global_id: global_id,
            info: info,
            value_flow: value_flow,
            state_update: state_update,
            extra: extra,
        }

    }
    throw new Error('Expected one of "Block" in loading "Block", but data does not satisfy any constructor');
}

export function storeBlock(block: Block): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x11ef55aa, 32);
        builder.storeInt(block.global_id, 32);
        let cell1 = beginCell();
        storeBlockInfo(block.info)(cell1);
        builder.storeRef(cell1);
        let cell2 = beginCell();
        storeValueFlow(block.value_flow)(cell2);
        builder.storeRef(cell2);
        builder.storeRef(block.state_update);
        let cell4 = beginCell();
        storeBlockExtra(block.extra)(cell4);
        builder.storeRef(cell4);
    })

}

/*
block_extra in_msg_descr:^InMsgDescr
  out_msg_descr:^OutMsgDescr
  account_blocks:^ShardAccountBlocks
  rand_seed:bits256
  created_by:bits256
  custom:(Maybe ^McBlockExtra) = BlockExtra;
*/

export function loadBlockExtra(slice: Slice): BlockExtra {
    if (((slice.remainingBits >= 32) && (slice.preloadUint(32) == 0x4a33f6fd))) {
        slice.loadUint(32);
        let slice1 = slice.loadRef().beginParse(true);
        let in_msg_descr: InMsgDescr = loadInMsgDescr(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let out_msg_descr: OutMsgDescr = loadOutMsgDescr(slice2);
        let slice3 = slice.loadRef().beginParse(true);
        let account_blocks: ShardAccountBlocks = loadShardAccountBlocks(slice3);
        let rand_seed: Buffer = slice.loadBuffer((256 / 8));
        let created_by: Buffer = slice.loadBuffer((256 / 8));
        let custom: Maybe<McBlockExtra> = loadMaybe<McBlockExtra>(slice, ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadMcBlockExtra(slice1)

        }));
        return {
            kind: 'BlockExtra',
            in_msg_descr: in_msg_descr,
            out_msg_descr: out_msg_descr,
            account_blocks: account_blocks,
            rand_seed: rand_seed,
            created_by: created_by,
            custom: custom,
        }

    }
    throw new Error('Expected one of "BlockExtra" in loading "BlockExtra", but data does not satisfy any constructor');
}

export function storeBlockExtra(blockExtra: BlockExtra): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x4a33f6fd, 32);
        let cell1 = beginCell();
        storeInMsgDescr(blockExtra.in_msg_descr)(cell1);
        builder.storeRef(cell1);
        let cell2 = beginCell();
        storeOutMsgDescr(blockExtra.out_msg_descr)(cell2);
        builder.storeRef(cell2);
        let cell3 = beginCell();
        storeShardAccountBlocks(blockExtra.account_blocks)(cell3);
        builder.storeRef(cell3);
        builder.storeBuffer(blockExtra.rand_seed, (256 / 8));
        builder.storeBuffer(blockExtra.created_by, (256 / 8));
        storeMaybe<McBlockExtra>(blockExtra.custom, ((arg: McBlockExtra) => {
            return ((builder: Builder) => {
                let cell1 = beginCell();
                storeMcBlockExtra(arg)(cell1);
                builder.storeRef(cell1);

            })

        }))(builder);
    })

}

/*
value_flow#b8e48dfb ^[ from_prev_blk:CurrencyCollection
  to_next_blk:CurrencyCollection
  imported:CurrencyCollection
  exported:CurrencyCollection ]
  fees_collected:CurrencyCollection
  ^[
  fees_imported:CurrencyCollection
  recovered:CurrencyCollection
  created:CurrencyCollection
  minted:CurrencyCollection
  ] = ValueFlow;
*/

/*
value_flow_v2#3ebf98b7 ^[ from_prev_blk:CurrencyCollection
  to_next_blk:CurrencyCollection
  imported:CurrencyCollection
  exported:CurrencyCollection ]
  fees_collected:CurrencyCollection
  burned:CurrencyCollection
  ^[
  fees_imported:CurrencyCollection
  recovered:CurrencyCollection
  created:CurrencyCollection
  minted:CurrencyCollection
  ] = ValueFlow;
*/

export function loadValueFlow(slice: Slice): ValueFlow {
    if (((slice.remainingBits >= 32) && (slice.preloadUint(32) == 0xb8e48dfb))) {
        slice.loadUint(32);
        let slice1 = slice.loadRef().beginParse(true);
        let from_prev_blk: CurrencyCollection = loadCurrencyCollection(slice1);
        let to_next_blk: CurrencyCollection = loadCurrencyCollection(slice1);
        let imported: CurrencyCollection = loadCurrencyCollection(slice1);
        let exported: CurrencyCollection = loadCurrencyCollection(slice1);
        let fees_collected: CurrencyCollection = loadCurrencyCollection(slice);
        let slice2 = slice.loadRef().beginParse(true);
        let fees_imported: CurrencyCollection = loadCurrencyCollection(slice2);
        let recovered: CurrencyCollection = loadCurrencyCollection(slice2);
        let created: CurrencyCollection = loadCurrencyCollection(slice2);
        let minted: CurrencyCollection = loadCurrencyCollection(slice2);
        return {
            kind: 'ValueFlow_value_flow',
            from_prev_blk: from_prev_blk,
            to_next_blk: to_next_blk,
            imported: imported,
            exported: exported,
            fees_collected: fees_collected,
            fees_imported: fees_imported,
            recovered: recovered,
            created: created,
            minted: minted,
        }

    }
    if (((slice.remainingBits >= 32) && (slice.preloadUint(32) == 0x3ebf98b7))) {
        slice.loadUint(32);
        let slice1 = slice.loadRef().beginParse(true);
        let from_prev_blk: CurrencyCollection = loadCurrencyCollection(slice1);
        let to_next_blk: CurrencyCollection = loadCurrencyCollection(slice1);
        let imported: CurrencyCollection = loadCurrencyCollection(slice1);
        let exported: CurrencyCollection = loadCurrencyCollection(slice1);
        let fees_collected: CurrencyCollection = loadCurrencyCollection(slice);
        let burned: CurrencyCollection = loadCurrencyCollection(slice);
        let slice2 = slice.loadRef().beginParse(true);
        let fees_imported: CurrencyCollection = loadCurrencyCollection(slice2);
        let recovered: CurrencyCollection = loadCurrencyCollection(slice2);
        let created: CurrencyCollection = loadCurrencyCollection(slice2);
        let minted: CurrencyCollection = loadCurrencyCollection(slice2);
        return {
            kind: 'ValueFlow_value_flow_v2',
            from_prev_blk: from_prev_blk,
            to_next_blk: to_next_blk,
            imported: imported,
            exported: exported,
            fees_collected: fees_collected,
            burned: burned,
            fees_imported: fees_imported,
            recovered: recovered,
            created: created,
            minted: minted,
        }

    }
    throw new Error('Expected one of "ValueFlow_value_flow", "ValueFlow_value_flow_v2" in loading "ValueFlow", but data does not satisfy any constructor');
}

export function storeValueFlow(valueFlow: ValueFlow): (builder: Builder) => void {
    if ((valueFlow.kind == 'ValueFlow_value_flow')) {
        return ((builder: Builder) => {
            builder.storeUint(0xb8e48dfb, 32);
            let cell1 = beginCell();
            storeCurrencyCollection(valueFlow.from_prev_blk)(cell1);
            storeCurrencyCollection(valueFlow.to_next_blk)(cell1);
            storeCurrencyCollection(valueFlow.imported)(cell1);
            storeCurrencyCollection(valueFlow.exported)(cell1);
            builder.storeRef(cell1);
            storeCurrencyCollection(valueFlow.fees_collected)(builder);
            let cell2 = beginCell();
            storeCurrencyCollection(valueFlow.fees_imported)(cell2);
            storeCurrencyCollection(valueFlow.recovered)(cell2);
            storeCurrencyCollection(valueFlow.created)(cell2);
            storeCurrencyCollection(valueFlow.minted)(cell2);
            builder.storeRef(cell2);
        })

    }
    if ((valueFlow.kind == 'ValueFlow_value_flow_v2')) {
        return ((builder: Builder) => {
            builder.storeUint(0x3ebf98b7, 32);
            let cell1 = beginCell();
            storeCurrencyCollection(valueFlow.from_prev_blk)(cell1);
            storeCurrencyCollection(valueFlow.to_next_blk)(cell1);
            storeCurrencyCollection(valueFlow.imported)(cell1);
            storeCurrencyCollection(valueFlow.exported)(cell1);
            builder.storeRef(cell1);
            storeCurrencyCollection(valueFlow.fees_collected)(builder);
            storeCurrencyCollection(valueFlow.burned)(builder);
            let cell2 = beginCell();
            storeCurrencyCollection(valueFlow.fees_imported)(cell2);
            storeCurrencyCollection(valueFlow.recovered)(cell2);
            storeCurrencyCollection(valueFlow.created)(cell2);
            storeCurrencyCollection(valueFlow.minted)(cell2);
            builder.storeRef(cell2);
        })

    }
    throw new Error('Expected one of "ValueFlow_value_flow", "ValueFlow_value_flow_v2" in loading "ValueFlow", but data does not satisfy any constructor');
}

// bt_leaf$0 {X:Type} leaf:X = BinTree X;

/*
bt_fork$1 {X:Type} left:^(BinTree X) right:^(BinTree X)
          = BinTree X;
*/

export function loadBinTree<X>(slice: Slice, loadX: (slice: Slice) => X): BinTree<X> {
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b0))) {
        slice.loadUint(1);
        let leaf: X = loadX(slice);
        return {
            kind: 'BinTree_bt_leaf',
            leaf: leaf,
        }

    }
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b1))) {
        slice.loadUint(1);
        let slice1 = slice.loadRef().beginParse(true);
        let left: BinTree<X> = loadBinTree<X>(slice1, loadX);
        let slice2 = slice.loadRef().beginParse(true);
        let right: BinTree<X> = loadBinTree<X>(slice2, loadX);
        return {
            kind: 'BinTree_bt_fork',
            left: left,
            right: right,
        }

    }
    throw new Error('Expected one of "BinTree_bt_leaf", "BinTree_bt_fork" in loading "BinTree", but data does not satisfy any constructor');
}

export function storeBinTree<X>(binTree: BinTree<X>, storeX: (x: X) => (builder: Builder) => void): (builder: Builder) => void {
    if ((binTree.kind == 'BinTree_bt_leaf')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
            storeX(binTree.leaf)(builder);
        })

    }
    if ((binTree.kind == 'BinTree_bt_fork')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1, 1);
            let cell1 = beginCell();
            storeBinTree<X>(binTree.left, storeX)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeBinTree<X>(binTree.right, storeX)(cell2);
            builder.storeRef(cell2);
        })

    }
    throw new Error('Expected one of "BinTree_bt_leaf", "BinTree_bt_fork" in loading "BinTree", but data does not satisfy any constructor');
}

// fsm_none$0 = FutureSplitMerge;

// fsm_split$10 split_utime:uint32 interval:uint32 = FutureSplitMerge;

// fsm_merge$11 merge_utime:uint32 interval:uint32 = FutureSplitMerge;

export function loadFutureSplitMerge(slice: Slice): FutureSplitMerge {
    if (((slice.remainingBits >= 1) && (slice.preloadUint(1) == 0b0))) {
        slice.loadUint(1);
        return {
            kind: 'FutureSplitMerge_fsm_none',
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b10))) {
        slice.loadUint(2);
        let split_utime: number = slice.loadUint(32);
        let interval: number = slice.loadUint(32);
        return {
            kind: 'FutureSplitMerge_fsm_split',
            split_utime: split_utime,
            interval: interval,
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b11))) {
        slice.loadUint(2);
        let merge_utime: number = slice.loadUint(32);
        let interval: number = slice.loadUint(32);
        return {
            kind: 'FutureSplitMerge_fsm_merge',
            merge_utime: merge_utime,
            interval: interval,
        }

    }
    throw new Error('Expected one of "FutureSplitMerge_fsm_none", "FutureSplitMerge_fsm_split", "FutureSplitMerge_fsm_merge" in loading "FutureSplitMerge", but data does not satisfy any constructor');
}

export function storeFutureSplitMerge(futureSplitMerge: FutureSplitMerge): (builder: Builder) => void {
    if ((futureSplitMerge.kind == 'FutureSplitMerge_fsm_none')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
        })

    }
    if ((futureSplitMerge.kind == 'FutureSplitMerge_fsm_split')) {
        return ((builder: Builder) => {
            builder.storeUint(0b10, 2);
            builder.storeUint(futureSplitMerge.split_utime, 32);
            builder.storeUint(futureSplitMerge.interval, 32);
        })

    }
    if ((futureSplitMerge.kind == 'FutureSplitMerge_fsm_merge')) {
        return ((builder: Builder) => {
            builder.storeUint(0b11, 2);
            builder.storeUint(futureSplitMerge.merge_utime, 32);
            builder.storeUint(futureSplitMerge.interval, 32);
        })

    }
    throw new Error('Expected one of "FutureSplitMerge_fsm_none", "FutureSplitMerge_fsm_split", "FutureSplitMerge_fsm_merge" in loading "FutureSplitMerge", but data does not satisfy any constructor');
}

/*
shard_descr#b seq_no:uint32 reg_mc_seqno:uint32
  start_lt:uint64 end_lt:uint64
  root_hash:bits256 file_hash:bits256
  before_split:Bool before_merge:Bool
  want_split:Bool want_merge:Bool
  nx_cc_updated:Bool flags:(## 3) { flags = 0 }
  next_catchain_seqno:uint32 next_validator_shard:uint64
  min_ref_mc_seqno:uint32 gen_utime:uint32
  split_merge_at:FutureSplitMerge
  fees_collected:CurrencyCollection
  funds_created:CurrencyCollection = ShardDescr;
*/

/*
shard_descr_new#a seq_no:uint32 reg_mc_seqno:uint32
  start_lt:uint64 end_lt:uint64
  root_hash:bits256 file_hash:bits256
  before_split:Bool before_merge:Bool
  want_split:Bool want_merge:Bool
  nx_cc_updated:Bool flags:(## 3) { flags = 0 }
  next_catchain_seqno:uint32 next_validator_shard:uint64
  min_ref_mc_seqno:uint32 gen_utime:uint32
  split_merge_at:FutureSplitMerge
  ^[ fees_collected:CurrencyCollection
     funds_created:CurrencyCollection ] = ShardDescr;
*/

export function loadShardDescr(slice: Slice): ShardDescr {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0xb))) {
        slice.loadUint(4);
        let seq_no: number = slice.loadUint(32);
        let reg_mc_seqno: number = slice.loadUint(32);
        let start_lt: bigint = slice.loadUintBig(64);
        let end_lt: bigint = slice.loadUintBig(64);
        let root_hash: Buffer = slice.loadBuffer((256 / 8));
        let file_hash: Buffer = slice.loadBuffer((256 / 8));
        let before_split: Bool = loadBool(slice);
        let before_merge: Bool = loadBool(slice);
        let want_split: Bool = loadBool(slice);
        let want_merge: Bool = loadBool(slice);
        let nx_cc_updated: Bool = loadBool(slice);
        let flags: number = slice.loadUint(3);
        let next_catchain_seqno: number = slice.loadUint(32);
        let next_validator_shard: bigint = slice.loadUintBig(64);
        let min_ref_mc_seqno: number = slice.loadUint(32);
        let gen_utime: number = slice.loadUint(32);
        let split_merge_at: FutureSplitMerge = loadFutureSplitMerge(slice);
        let fees_collected: CurrencyCollection = loadCurrencyCollection(slice);
        let funds_created: CurrencyCollection = loadCurrencyCollection(slice);
        if ((!(flags == 0))) {
            throw new Error('Condition (flags == 0) is not satisfied while loading "ShardDescr_shard_descr" for type "ShardDescr"');
        }
        return {
            kind: 'ShardDescr_shard_descr',
            seq_no: seq_no,
            reg_mc_seqno: reg_mc_seqno,
            start_lt: start_lt,
            end_lt: end_lt,
            root_hash: root_hash,
            file_hash: file_hash,
            before_split: before_split,
            before_merge: before_merge,
            want_split: want_split,
            want_merge: want_merge,
            nx_cc_updated: nx_cc_updated,
            flags: flags,
            next_catchain_seqno: next_catchain_seqno,
            next_validator_shard: next_validator_shard,
            min_ref_mc_seqno: min_ref_mc_seqno,
            gen_utime: gen_utime,
            split_merge_at: split_merge_at,
            fees_collected: fees_collected,
            funds_created: funds_created,
        }

    }
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0xa))) {
        slice.loadUint(4);
        let seq_no: number = slice.loadUint(32);
        let reg_mc_seqno: number = slice.loadUint(32);
        let start_lt: bigint = slice.loadUintBig(64);
        let end_lt: bigint = slice.loadUintBig(64);
        let root_hash: Buffer = slice.loadBuffer((256 / 8));
        let file_hash: Buffer = slice.loadBuffer((256 / 8));
        let before_split: Bool = loadBool(slice);
        let before_merge: Bool = loadBool(slice);
        let want_split: Bool = loadBool(slice);
        let want_merge: Bool = loadBool(slice);
        let nx_cc_updated: Bool = loadBool(slice);
        let flags: number = slice.loadUint(3);
        let next_catchain_seqno: number = slice.loadUint(32);
        let next_validator_shard: bigint = slice.loadUintBig(64);
        let min_ref_mc_seqno: number = slice.loadUint(32);
        let gen_utime: number = slice.loadUint(32);
        let split_merge_at: FutureSplitMerge = loadFutureSplitMerge(slice);
        let slice1 = slice.loadRef().beginParse(true);
        let fees_collected: CurrencyCollection = loadCurrencyCollection(slice1);
        let funds_created: CurrencyCollection = loadCurrencyCollection(slice1);
        if ((!(flags == 0))) {
            throw new Error('Condition (flags == 0) is not satisfied while loading "ShardDescr_shard_descr_new" for type "ShardDescr"');
        }
        return {
            kind: 'ShardDescr_shard_descr_new',
            seq_no: seq_no,
            reg_mc_seqno: reg_mc_seqno,
            start_lt: start_lt,
            end_lt: end_lt,
            root_hash: root_hash,
            file_hash: file_hash,
            before_split: before_split,
            before_merge: before_merge,
            want_split: want_split,
            want_merge: want_merge,
            nx_cc_updated: nx_cc_updated,
            flags: flags,
            next_catchain_seqno: next_catchain_seqno,
            next_validator_shard: next_validator_shard,
            min_ref_mc_seqno: min_ref_mc_seqno,
            gen_utime: gen_utime,
            split_merge_at: split_merge_at,
            fees_collected: fees_collected,
            funds_created: funds_created,
        }

    }
    throw new Error('Expected one of "ShardDescr_shard_descr", "ShardDescr_shard_descr_new" in loading "ShardDescr", but data does not satisfy any constructor');
}

export function storeShardDescr(shardDescr: ShardDescr): (builder: Builder) => void {
    if ((shardDescr.kind == 'ShardDescr_shard_descr')) {
        return ((builder: Builder) => {
            builder.storeUint(0xb, 4);
            builder.storeUint(shardDescr.seq_no, 32);
            builder.storeUint(shardDescr.reg_mc_seqno, 32);
            builder.storeUint(shardDescr.start_lt, 64);
            builder.storeUint(shardDescr.end_lt, 64);
            builder.storeBuffer(shardDescr.root_hash, (256 / 8));
            builder.storeBuffer(shardDescr.file_hash, (256 / 8));
            storeBool(shardDescr.before_split)(builder);
            storeBool(shardDescr.before_merge)(builder);
            storeBool(shardDescr.want_split)(builder);
            storeBool(shardDescr.want_merge)(builder);
            storeBool(shardDescr.nx_cc_updated)(builder);
            builder.storeUint(shardDescr.flags, 3);
            builder.storeUint(shardDescr.next_catchain_seqno, 32);
            builder.storeUint(shardDescr.next_validator_shard, 64);
            builder.storeUint(shardDescr.min_ref_mc_seqno, 32);
            builder.storeUint(shardDescr.gen_utime, 32);
            storeFutureSplitMerge(shardDescr.split_merge_at)(builder);
            storeCurrencyCollection(shardDescr.fees_collected)(builder);
            storeCurrencyCollection(shardDescr.funds_created)(builder);
            if ((!(shardDescr.flags == 0))) {
                throw new Error('Condition (shardDescr.flags == 0) is not satisfied while loading "ShardDescr_shard_descr" for type "ShardDescr"');
            }
        })

    }
    if ((shardDescr.kind == 'ShardDescr_shard_descr_new')) {
        return ((builder: Builder) => {
            builder.storeUint(0xa, 4);
            builder.storeUint(shardDescr.seq_no, 32);
            builder.storeUint(shardDescr.reg_mc_seqno, 32);
            builder.storeUint(shardDescr.start_lt, 64);
            builder.storeUint(shardDescr.end_lt, 64);
            builder.storeBuffer(shardDescr.root_hash, (256 / 8));
            builder.storeBuffer(shardDescr.file_hash, (256 / 8));
            storeBool(shardDescr.before_split)(builder);
            storeBool(shardDescr.before_merge)(builder);
            storeBool(shardDescr.want_split)(builder);
            storeBool(shardDescr.want_merge)(builder);
            storeBool(shardDescr.nx_cc_updated)(builder);
            builder.storeUint(shardDescr.flags, 3);
            builder.storeUint(shardDescr.next_catchain_seqno, 32);
            builder.storeUint(shardDescr.next_validator_shard, 64);
            builder.storeUint(shardDescr.min_ref_mc_seqno, 32);
            builder.storeUint(shardDescr.gen_utime, 32);
            storeFutureSplitMerge(shardDescr.split_merge_at)(builder);
            let cell1 = beginCell();
            storeCurrencyCollection(shardDescr.fees_collected)(cell1);
            storeCurrencyCollection(shardDescr.funds_created)(cell1);
            builder.storeRef(cell1);
            if ((!(shardDescr.flags == 0))) {
                throw new Error('Condition (shardDescr.flags == 0) is not satisfied while loading "ShardDescr_shard_descr_new" for type "ShardDescr"');
            }
        })

    }
    throw new Error('Expected one of "ShardDescr_shard_descr", "ShardDescr_shard_descr_new" in loading "ShardDescr", but data does not satisfy any constructor');
}

// _ (HashmapE 32 ^(BinTree ShardDescr)) = ShardHashes;

export function loadShardHashes(slice: Slice): ShardHashes {
    let anon0: Dictionary<number, BinTree<ShardDescr>> = Dictionary.load(Dictionary.Keys.Uint(32), {
        serialize: () => { throw new Error('Not implemented') },
        parse: ((slice: Slice) => {
        let slice1 = slice.loadRef().beginParse(true);
        return loadBinTree<ShardDescr>(slice1, loadShardDescr)

    }),
    }, slice);
    return {
        kind: 'ShardHashes',
        anon0: anon0,
    }

}

export function storeShardHashes(shardHashes: ShardHashes): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeDict(shardHashes.anon0, Dictionary.Keys.Uint(32), {
            serialize: ((arg: BinTree<ShardDescr>, builder: Builder) => {
            ((arg: BinTree<ShardDescr>) => {
                return ((builder: Builder) => {
                    let cell1 = beginCell();
                    storeBinTree<ShardDescr>(arg, storeShardDescr)(cell1);
                    builder.storeRef(cell1);

                })

            })(arg)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
    })

}

// bta_leaf$0 {X:Type} {Y:Type} extra:Y leaf:X = BinTreeAug X Y;

/*
bta_fork$1 {X:Type} {Y:Type} left:^(BinTreeAug X Y)
           right:^(BinTreeAug X Y) extra:Y = BinTreeAug X Y;
*/

export function storeBinTreeAug<X, Y>(binTreeAug: BinTreeAug<X, Y>, storeX: (x: X) => (builder: Builder) => void, storeY: (y: Y) => (builder: Builder) => void): (builder: Builder) => void {
    if ((binTreeAug.kind == 'BinTreeAug_bta_leaf')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
            storeY(binTreeAug.extra)(builder);
            storeX(binTreeAug.leaf)(builder);
        })

    }
    if ((binTreeAug.kind == 'BinTreeAug_bta_fork')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1, 1);
            let cell1 = beginCell();
            storeBinTreeAug<X, Y>(binTreeAug.left, storeX, storeY)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeBinTreeAug<X, Y>(binTreeAug.right, storeX, storeY)(cell2);
            builder.storeRef(cell2);
            storeY(binTreeAug.extra)(builder);
        })

    }
    throw new Error('Expected one of "BinTreeAug_bta_leaf", "BinTreeAug_bta_fork" in loading "BinTreeAug", but data does not satisfy any constructor');
}

// _ fees:CurrencyCollection create:CurrencyCollection = ShardFeeCreated;

export function loadShardFeeCreated(slice: Slice): ShardFeeCreated {
    let fees: CurrencyCollection = loadCurrencyCollection(slice);
    let create: CurrencyCollection = loadCurrencyCollection(slice);
    return {
        kind: 'ShardFeeCreated',
        fees: fees,
        create: create,
    }

}

export function storeShardFeeCreated(shardFeeCreated: ShardFeeCreated): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeCurrencyCollection(shardFeeCreated.fees)(builder);
        storeCurrencyCollection(shardFeeCreated.create)(builder);
    })

}

// _ (HashmapAugE 96 ShardFeeCreated ShardFeeCreated) = ShardFees;

export function loadShardFees(slice: Slice): ShardFees {
    let anon0: Dictionary<bigint, {value: ShardFeeCreated, extra: ShardFeeCreated}> = Dictionary.load(Dictionary.Keys.BigUint(96), {
        serialize: () => { throw new Error('Not implemented') },
        parse: ((slice: Slice) => {
        return {
            extra: loadShardFeeCreated(slice),
            value: loadShardFeeCreated(slice),
        }

    }),
    }, slice);
    return {
        kind: 'ShardFees',
        anon0: anon0,
    }

}

export function storeShardFees(shardFees: ShardFees): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeDict(shardFees.anon0, Dictionary.Keys.BigUint(96), {
            serialize: ((arg: {value: ShardFeeCreated, extra: ShardFeeCreated}, builder: Builder) => {
            ((arg: ShardFeeCreated) => {
                return ((builder: Builder) => {
                    storeShardFeeCreated(arg)(builder);
                })

            })(arg.extra)(builder);
            ((arg: ShardFeeCreated) => {
                return ((builder: Builder) => {
                    storeShardFeeCreated(arg)(builder);
                })

            })(arg.value)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
    })

}

/*
_ config_addr:bits256 config:^(Hashmap 32 ^Cell)
  = ConfigParams;
*/

export function loadConfigParams(slice: Slice): ConfigParams {
    let config_addr: Buffer = slice.loadBuffer((256 / 8));
    let slice1 = slice.loadRef().beginParse(true);
    let config: Dictionary<number, Cell> = Dictionary.loadDirect(Dictionary.Keys.Uint(32), {
        serialize: () => { throw new Error('Not implemented') },
        parse: ((slice: Slice) => {
        let slice1 = slice.loadRef().beginParse(true);
        return slice1.asCell()

    }),
    }, slice1);
    return {
        kind: 'ConfigParams',
        config_addr: config_addr,
        config: config,
    }

}

export function storeConfigParams(configParams: ConfigParams): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeBuffer(configParams.config_addr, (256 / 8));
        let cell1 = beginCell();
        cell1.storeDictDirect(configParams.config, Dictionary.Keys.Uint(32), {
            serialize: ((arg: Cell, builder: Builder) => {
            ((arg: Cell) => {
                return ((builder: Builder) => {
                    let cell1 = beginCell();
                    cell1.storeSlice(arg.beginParse(true));
                    builder.storeRef(cell1);

                })

            })(arg)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
        builder.storeRef(cell1);
    })

}

/*
validator_info$_
  validator_list_hash_short:uint32
  catchain_seqno:uint32
  nx_cc_updated:Bool
= ValidatorInfo;
*/

export function loadValidatorInfo(slice: Slice): ValidatorInfo {
    let validator_list_hash_short: number = slice.loadUint(32);
    let catchain_seqno: number = slice.loadUint(32);
    let nx_cc_updated: Bool = loadBool(slice);
    return {
        kind: 'ValidatorInfo',
        validator_list_hash_short: validator_list_hash_short,
        catchain_seqno: catchain_seqno,
        nx_cc_updated: nx_cc_updated,
    }

}

export function storeValidatorInfo(validatorInfo: ValidatorInfo): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(validatorInfo.validator_list_hash_short, 32);
        builder.storeUint(validatorInfo.catchain_seqno, 32);
        storeBool(validatorInfo.nx_cc_updated)(builder);
    })

}

/*
validator_base_info$_
  validator_list_hash_short:uint32
  catchain_seqno:uint32
= ValidatorBaseInfo;
*/

// _ key:Bool max_end_lt:uint64 = KeyMaxLt;

export function loadKeyMaxLt(slice: Slice): KeyMaxLt {
    let key: Bool = loadBool(slice);
    let max_end_lt: bigint = slice.loadUintBig(64);
    return {
        kind: 'KeyMaxLt',
        key: key,
        max_end_lt: max_end_lt,
    }

}

export function storeKeyMaxLt(keyMaxLt: KeyMaxLt): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeBool(keyMaxLt.key)(builder);
        builder.storeUint(keyMaxLt.max_end_lt, 64);
    })

}

// _ key:Bool blk_ref:ExtBlkRef = KeyExtBlkRef;

export function loadKeyExtBlkRef(slice: Slice): KeyExtBlkRef {
    let key: Bool = loadBool(slice);
    let blk_ref: ExtBlkRef = loadExtBlkRef(slice);
    return {
        kind: 'KeyExtBlkRef',
        key: key,
        blk_ref: blk_ref,
    }

}

export function storeKeyExtBlkRef(keyExtBlkRef: KeyExtBlkRef): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeBool(keyExtBlkRef.key)(builder);
        storeExtBlkRef(keyExtBlkRef.blk_ref)(builder);
    })

}

// _ (HashmapAugE 32 KeyExtBlkRef KeyMaxLt) = OldMcBlocksInfo;

export function loadOldMcBlocksInfo(slice: Slice): OldMcBlocksInfo {
    let anon0: Dictionary<number, {value: KeyExtBlkRef, extra: KeyMaxLt}> = Dictionary.load(Dictionary.Keys.Uint(32), {
        serialize: () => { throw new Error('Not implemented') },
        parse: ((slice: Slice) => {
        return {
            extra: loadKeyMaxLt(slice),
            value: loadKeyExtBlkRef(slice),
        }

    }),
    }, slice);
    return {
        kind: 'OldMcBlocksInfo',
        anon0: anon0,
    }

}

export function storeOldMcBlocksInfo(oldMcBlocksInfo: OldMcBlocksInfo): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeDict(oldMcBlocksInfo.anon0, Dictionary.Keys.Uint(32), {
            serialize: ((arg: {value: KeyExtBlkRef, extra: KeyMaxLt}, builder: Builder) => {
            ((arg: KeyMaxLt) => {
                return ((builder: Builder) => {
                    storeKeyMaxLt(arg)(builder);
                })

            })(arg.extra)(builder);
            ((arg: KeyExtBlkRef) => {
                return ((builder: Builder) => {
                    storeKeyExtBlkRef(arg)(builder);
                })

            })(arg.value)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
    })

}

// counters#_ last_updated:uint32 total:uint64 cnt2048:uint64 cnt65536:uint64 = Counters;

export function loadCounters(slice: Slice): Counters {
    let last_updated: number = slice.loadUint(32);
    let total: bigint = slice.loadUintBig(64);
    let cnt2048: bigint = slice.loadUintBig(64);
    let cnt65536: bigint = slice.loadUintBig(64);
    return {
        kind: 'Counters',
        last_updated: last_updated,
        total: total,
        cnt2048: cnt2048,
        cnt65536: cnt65536,
    }

}

export function storeCounters(counters: Counters): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(counters.last_updated, 32);
        builder.storeUint(counters.total, 64);
        builder.storeUint(counters.cnt2048, 64);
        builder.storeUint(counters.cnt65536, 64);
    })

}

// creator_info#4 mc_blocks:Counters shard_blocks:Counters = CreatorStats;

export function loadCreatorStats(slice: Slice): CreatorStats {
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0x4))) {
        slice.loadUint(4);
        let mc_blocks: Counters = loadCounters(slice);
        let shard_blocks: Counters = loadCounters(slice);
        return {
            kind: 'CreatorStats',
            mc_blocks: mc_blocks,
            shard_blocks: shard_blocks,
        }

    }
    throw new Error('Expected one of "CreatorStats" in loading "CreatorStats", but data does not satisfy any constructor');
}

export function storeCreatorStats(creatorStats: CreatorStats): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x4, 4);
        storeCounters(creatorStats.mc_blocks)(builder);
        storeCounters(creatorStats.shard_blocks)(builder);
    })

}

// block_create_stats#17 counters:(HashmapE 256 CreatorStats) = BlockCreateStats;

// block_create_stats_ext#34 counters:(HashmapAugE 256 CreatorStats uint32) = BlockCreateStats;

export function loadBlockCreateStats(slice: Slice): BlockCreateStats {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x17))) {
        slice.loadUint(8);
        let counters: Dictionary<bigint, CreatorStats> = Dictionary.load(Dictionary.Keys.BigUint(256), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadCreatorStats,
        }, slice);
        return {
            kind: 'BlockCreateStats_block_create_stats',
            counters: counters,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x34))) {
        slice.loadUint(8);
        let counters: Dictionary<bigint, {value: CreatorStats, extra: number}> = Dictionary.load(Dictionary.Keys.BigUint(256), {
            serialize: () => { throw new Error('Not implemented') },
            parse: ((slice: Slice) => {
            return {
                extra: slice.loadUint(32),
                value: loadCreatorStats(slice),
            }

        }),
        }, slice);
        return {
            kind: 'BlockCreateStats_block_create_stats_ext',
            counters: counters,
        }

    }
    throw new Error('Expected one of "BlockCreateStats_block_create_stats", "BlockCreateStats_block_create_stats_ext" in loading "BlockCreateStats", but data does not satisfy any constructor');
}

export function storeBlockCreateStats(blockCreateStats: BlockCreateStats): (builder: Builder) => void {
    if ((blockCreateStats.kind == 'BlockCreateStats_block_create_stats')) {
        return ((builder: Builder) => {
            builder.storeUint(0x17, 8);
            builder.storeDict(blockCreateStats.counters, Dictionary.Keys.BigUint(256), {
                serialize: ((arg: CreatorStats, builder: Builder) => {
                storeCreatorStats(arg)(builder);
            }),
                parse: () => { throw new Error('Not implemented') },
            });
        })

    }
    if ((blockCreateStats.kind == 'BlockCreateStats_block_create_stats_ext')) {
        return ((builder: Builder) => {
            builder.storeUint(0x34, 8);
            builder.storeDict(blockCreateStats.counters, Dictionary.Keys.BigUint(256), {
                serialize: ((arg: {value: CreatorStats, extra: number}, builder: Builder) => {
                ((arg: number) => {
                    return ((builder: Builder) => {
                        builder.storeUint(arg, 32);
                    })

                })(arg.extra)(builder);
                ((arg: CreatorStats) => {
                    return ((builder: Builder) => {
                        storeCreatorStats(arg)(builder);
                    })

                })(arg.value)(builder);
            }),
                parse: () => { throw new Error('Not implemented') },
            });
        })

    }
    throw new Error('Expected one of "BlockCreateStats_block_create_stats", "BlockCreateStats_block_create_stats_ext" in loading "BlockCreateStats", but data does not satisfy any constructor');
}

/*
masterchain_state_extra#cc26
  shard_hashes:ShardHashes
  config:ConfigParams
  ^[ flags:(## 16) { flags <= 1 }
     validator_info:ValidatorInfo
     prev_blocks:OldMcBlocksInfo
     after_key_block:Bool
     last_key_block:(Maybe ExtBlkRef)
     block_create_stats:(flags . 0)?BlockCreateStats ]
  global_balance:CurrencyCollection
= McStateExtra;
*/

export function loadMcStateExtra(slice: Slice): McStateExtra {
    if (((slice.remainingBits >= 16) && (slice.preloadUint(16) == 0xcc26))) {
        slice.loadUint(16);
        let shard_hashes: ShardHashes = loadShardHashes(slice);
        let config: ConfigParams = loadConfigParams(slice);
        let slice1 = slice.loadRef().beginParse(true);
        let flags: number = slice1.loadUint(16);
        let validator_info: ValidatorInfo = loadValidatorInfo(slice1);
        let prev_blocks: OldMcBlocksInfo = loadOldMcBlocksInfo(slice1);
        let after_key_block: Bool = loadBool(slice);
        let last_key_block: Maybe<ExtBlkRef> = loadMaybe<ExtBlkRef>(slice1, loadExtBlkRef);
        let block_create_stats: BlockCreateStats | undefined = ((flags & (1 << 0)) ? loadBlockCreateStats(slice1) : undefined);
        let global_balance: CurrencyCollection = loadCurrencyCollection(slice);
        return {
            kind: 'McStateExtra',
            shard_hashes: shard_hashes,
            config: config,
            flags: flags,
            validator_info: validator_info,
            prev_blocks: prev_blocks,
            after_key_block: after_key_block,
            last_key_block: last_key_block,
            block_create_stats: block_create_stats,
            global_balance: global_balance,
        }

    }
    throw new Error('Expected one of "McStateExtra" in loading "McStateExtra", but data does not satisfy any constructor');
}

export function storeMcStateExtra(mcStateExtra: McStateExtra): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0xcc26, 16);
        storeShardHashes(mcStateExtra.shard_hashes)(builder);
        storeConfigParams(mcStateExtra.config)(builder);
        let cell1 = beginCell();
        cell1.storeUint(mcStateExtra.flags, 16);
        storeValidatorInfo(mcStateExtra.validator_info)(cell1);
        storeOldMcBlocksInfo(mcStateExtra.prev_blocks)(cell1);
        storeBool(mcStateExtra.after_key_block)(builder);
        storeMaybe<ExtBlkRef>(mcStateExtra.last_key_block, storeExtBlkRef)(cell1);
        if ((mcStateExtra.block_create_stats != undefined)) {
            storeBlockCreateStats(mcStateExtra.block_create_stats)(cell1);
        }
        builder.storeRef(cell1);
        storeCurrencyCollection(mcStateExtra.global_balance)(builder);
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

// sig_pair$_ node_id_short:bits256 sign:CryptoSignature = CryptoSignaturePair;

export function loadCryptoSignaturePair(slice: Slice): CryptoSignaturePair {
    let node_id_short: Buffer = slice.loadBuffer((256 / 8));
    let sign: CryptoSignature = loadCryptoSignature(slice);
    return {
        kind: 'CryptoSignaturePair',
        node_id_short: node_id_short,
        sign: sign,
    }

}

export function storeCryptoSignaturePair(cryptoSignaturePair: CryptoSignaturePair): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeBuffer(cryptoSignaturePair.node_id_short, (256 / 8));
        storeCryptoSignature(cryptoSignaturePair.sign)(builder);
    })

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

// certificate_env#a419b7d certificate:Certificate = CertificateEnv;

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

/*
masterchain_block_extra#cca5
  key_block:(## 1)
  shard_hashes:ShardHashes
  shard_fees:ShardFees
  ^[ prev_blk_signatures:(HashmapE 16 CryptoSignaturePair)
     recover_create_msg:(Maybe ^InMsg)
     mint_msg:(Maybe ^InMsg) ]
  config:key_block?ConfigParams
= McBlockExtra;
*/

export function loadMcBlockExtra(slice: Slice): McBlockExtra {
    if (((slice.remainingBits >= 16) && (slice.preloadUint(16) == 0xcca5))) {
        slice.loadUint(16);
        let key_block: number = slice.loadUint(1);
        let shard_hashes: ShardHashes = loadShardHashes(slice);
        let shard_fees: ShardFees = loadShardFees(slice);
        let slice1 = slice.loadRef().beginParse(true);
        let prev_blk_signatures: Dictionary<number, CryptoSignaturePair> = Dictionary.load(Dictionary.Keys.Uint(16), {
            serialize: () => { throw new Error('Not implemented') },
            parse: loadCryptoSignaturePair,
        }, slice1);
        let recover_create_msg: Maybe<InMsg> = loadMaybe<InMsg>(slice1, ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadInMsg(slice1)

        }));
        let mint_msg: Maybe<InMsg> = loadMaybe<InMsg>(slice1, ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadInMsg(slice1)

        }));
        let config: ConfigParams | undefined = (key_block ? loadConfigParams(slice) : undefined);
        return {
            kind: 'McBlockExtra',
            key_block: key_block,
            shard_hashes: shard_hashes,
            shard_fees: shard_fees,
            prev_blk_signatures: prev_blk_signatures,
            recover_create_msg: recover_create_msg,
            mint_msg: mint_msg,
            config: config,
        }

    }
    throw new Error('Expected one of "McBlockExtra" in loading "McBlockExtra", but data does not satisfy any constructor');
}

export function storeMcBlockExtra(mcBlockExtra: McBlockExtra): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0xcca5, 16);
        builder.storeUint(mcBlockExtra.key_block, 1);
        storeShardHashes(mcBlockExtra.shard_hashes)(builder);
        storeShardFees(mcBlockExtra.shard_fees)(builder);
        let cell1 = beginCell();
        cell1.storeDict(mcBlockExtra.prev_blk_signatures, Dictionary.Keys.Uint(16), {
            serialize: ((arg: CryptoSignaturePair, builder: Builder) => {
            storeCryptoSignaturePair(arg)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
        storeMaybe<InMsg>(mcBlockExtra.recover_create_msg, ((arg: InMsg) => {
            return ((builder: Builder) => {
                let cell1 = beginCell();
                storeInMsg(arg)(cell1);
                builder.storeRef(cell1);

            })

        }))(cell1);
        storeMaybe<InMsg>(mcBlockExtra.mint_msg, ((arg: InMsg) => {
            return ((builder: Builder) => {
                let cell1 = beginCell();
                storeInMsg(arg)(cell1);
                builder.storeRef(cell1);

            })

        }))(cell1);
        builder.storeRef(cell1);
        if ((mcBlockExtra.config != undefined)) {
            storeConfigParams(mcBlockExtra.config)(builder);
        }
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

/*
cfg_proposal_status#ce expires:uint32 proposal:^ConfigProposal is_critical:Bool
  voters:(HashmapE 16 True) remaining_weight:int64 validator_set_id:uint256
  rounds_remaining:uint8 wins:uint8 losses:uint8 = ConfigProposalStatus;
*/

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

/*
block_signatures_pure#_ sig_count:uint32 sig_weight:uint64
  signatures:(HashmapE 16 CryptoSignaturePair) = BlockSignaturesPure;
*/

// block_signatures#11 validator_info:ValidatorBaseInfo pure_signatures:BlockSignaturesPure = BlockSignatures;

// block_proof#c3 proof_for:BlockIdExt root:^Cell signatures:(Maybe ^BlockSignatures) = BlockProof;

// chain_empty$_ = ProofChain 0;

// chain_link$_ {n:#} root:^Cell prev:n?^(ProofChain n) = ProofChain (n + 1);

export function loadProofChain(slice: Slice, arg0: number): ProofChain {
    if ((arg0 == 0)) {
        return {
            kind: 'ProofChain_chain_empty',
        }

    }
    if (true) {
        let slice1 = slice.loadRef().beginParse(true);
        let root: Cell = slice1.asCell();
        let prev: ProofChain | undefined = ((arg0 - 1) ? ((slice: Slice) => {
            let slice1 = slice.loadRef().beginParse(true);
            return loadProofChain(slice1, (arg0 - 1))

        })(slice) : undefined);
        return {
            kind: 'ProofChain_chain_link',
            n: (arg0 - 1),
            root: root,
            prev: prev,
        }

    }
    throw new Error('Expected one of "ProofChain_chain_empty", "ProofChain_chain_link" in loading "ProofChain", but data does not satisfy any constructor');
}

export function storeProofChain(proofChain: ProofChain): (builder: Builder) => void {
    if ((proofChain.kind == 'ProofChain_chain_empty')) {
        return ((builder: Builder) => {
        })

    }
    if ((proofChain.kind == 'ProofChain_chain_link')) {
        return ((builder: Builder) => {
            let cell1 = beginCell();
            cell1.storeSlice(proofChain.root.beginParse(true));
            builder.storeRef(cell1);
            if ((proofChain.prev != undefined)) {
                let cell1 = beginCell();
                storeProofChain(proofChain.prev)(cell1);
                builder.storeRef(cell1);

            }
        })

    }
    throw new Error('Expected one of "ProofChain_chain_empty", "ProofChain_chain_link" in loading "ProofChain", but data does not satisfy any constructor');
}

/*
top_block_descr#d5 proof_for:BlockIdExt signatures:(Maybe ^BlockSignatures)
  len:(## 8) { len >= 1 } { len <= 8 } chain:(ProofChain len) = TopBlockDescr;
*/

// top_block_descr_set#4ac789f3 collection:(HashmapE 96 ^TopBlockDescr) = TopBlockDescrSet;

/*
prod_info#34 utime:uint32 mc_blk_ref:ExtBlkRef state_proof:^(MERKLE_PROOF Block)
  prod_proof:^(MERKLE_PROOF ShardState) = ProducerInfo;
*/

// no_blk_gen from_utime:uint32 prod_info:^ProducerInfo = ComplaintDescr;

// no_blk_gen_diff prod_info_old:^ProducerInfo prod_info_new:^ProducerInfo = ComplaintDescr;

// validator_complaint#bc validator_pubkey:bits256 description:^ComplaintDescr created_at:uint32 severity:uint8 reward_addr:uint256 paid:Grams suggested_fine:Grams suggested_fine_part:uint32 = ValidatorComplaint;

// complaint_status#2d complaint:^ValidatorComplaint voters:(HashmapE 16 True) vset_id:uint256 weight_remaining:int64 = ValidatorComplaintStatus;

// vm_stk_null#00 = VmStackValue;

// vm_stk_tinyint#01 value:int64 = VmStackValue;

// vm_stk_int#0201 value:int257 = VmStackValue;

// vm_stk_nan#02ff = VmStackValue;

// vm_stk_cell#03 cell:^Cell = VmStackValue;

// vm_stk_slice#04 _:VmCellSlice = VmStackValue;

// vm_stk_builder#05 cell:^Cell = VmStackValue;

// vm_stk_cont#06 cont:VmCont = VmStackValue;

// vm_stk_tuple#07 len:(## 16) data:(VmTuple len) = VmStackValue;

export function loadVmStackValue(slice: Slice): VmStackValue {
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x00))) {
        slice.loadUint(8);
        return {
            kind: 'VmStackValue_vm_stk_null',
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x01))) {
        slice.loadUint(8);
        let value: bigint = slice.loadIntBig(64);
        return {
            kind: 'VmStackValue_vm_stk_tinyint',
            value: value,
        }

    }
    if (((slice.remainingBits >= 16) && (slice.preloadUint(16) == 0x0201))) {
        slice.loadUint(16);
        let value: bigint = slice.loadIntBig(257);
        return {
            kind: 'VmStackValue_vm_stk_int',
            value: value,
        }

    }
    if (((slice.remainingBits >= 16) && (slice.preloadUint(16) == 0x02ff))) {
        slice.loadUint(16);
        return {
            kind: 'VmStackValue_vm_stk_nan',
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x03))) {
        slice.loadUint(8);
        let slice1 = slice.loadRef().beginParse(true);
        let _cell: Cell = slice1.asCell();
        return {
            kind: 'VmStackValue_vm_stk_cell',
            _cell: _cell,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x04))) {
        slice.loadUint(8);
        let _: VmCellSlice = loadVmCellSlice(slice);
        return {
            kind: 'VmStackValue_vm_stk_slice',
            _: _,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x05))) {
        slice.loadUint(8);
        let slice1 = slice.loadRef().beginParse(true);
        let _cell: Cell = slice1.asCell();
        return {
            kind: 'VmStackValue_vm_stk_builder',
            _cell: _cell,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x06))) {
        slice.loadUint(8);
        let cont: VmCont = loadVmCont(slice);
        return {
            kind: 'VmStackValue_vm_stk_cont',
            cont: cont,
        }

    }
    if (((slice.remainingBits >= 8) && (slice.preloadUint(8) == 0x07))) {
        slice.loadUint(8);
        let len: number = slice.loadUint(16);
        let data: VmTuple = loadVmTuple(slice, len);
        return {
            kind: 'VmStackValue_vm_stk_tuple',
            len: len,
            data: data,
        }

    }
    throw new Error('Expected one of "VmStackValue_vm_stk_null", "VmStackValue_vm_stk_tinyint", "VmStackValue_vm_stk_int", "VmStackValue_vm_stk_nan", "VmStackValue_vm_stk_cell", "VmStackValue_vm_stk_slice", "VmStackValue_vm_stk_builder", "VmStackValue_vm_stk_cont", "VmStackValue_vm_stk_tuple" in loading "VmStackValue", but data does not satisfy any constructor');
}

export function storeVmStackValue(vmStackValue: VmStackValue): (builder: Builder) => void {
    if ((vmStackValue.kind == 'VmStackValue_vm_stk_null')) {
        return ((builder: Builder) => {
            builder.storeUint(0x00, 8);
        })

    }
    if ((vmStackValue.kind == 'VmStackValue_vm_stk_tinyint')) {
        return ((builder: Builder) => {
            builder.storeUint(0x01, 8);
            builder.storeInt(vmStackValue.value, 64);
        })

    }
    if ((vmStackValue.kind == 'VmStackValue_vm_stk_int')) {
        return ((builder: Builder) => {
            builder.storeUint(0x0201, 16);
            builder.storeInt(vmStackValue.value, 257);
        })

    }
    if ((vmStackValue.kind == 'VmStackValue_vm_stk_nan')) {
        return ((builder: Builder) => {
            builder.storeUint(0x02ff, 16);
        })

    }
    if ((vmStackValue.kind == 'VmStackValue_vm_stk_cell')) {
        return ((builder: Builder) => {
            builder.storeUint(0x03, 8);
            let cell1 = beginCell();
            cell1.storeSlice(vmStackValue._cell.beginParse(true));
            builder.storeRef(cell1);
        })

    }
    if ((vmStackValue.kind == 'VmStackValue_vm_stk_slice')) {
        return ((builder: Builder) => {
            builder.storeUint(0x04, 8);
            storeVmCellSlice(vmStackValue._)(builder);
        })

    }
    if ((vmStackValue.kind == 'VmStackValue_vm_stk_builder')) {
        return ((builder: Builder) => {
            builder.storeUint(0x05, 8);
            let cell1 = beginCell();
            cell1.storeSlice(vmStackValue._cell.beginParse(true));
            builder.storeRef(cell1);
        })

    }
    if ((vmStackValue.kind == 'VmStackValue_vm_stk_cont')) {
        return ((builder: Builder) => {
            builder.storeUint(0x06, 8);
            storeVmCont(vmStackValue.cont)(builder);
        })

    }
    if ((vmStackValue.kind == 'VmStackValue_vm_stk_tuple')) {
        return ((builder: Builder) => {
            builder.storeUint(0x07, 8);
            builder.storeUint(vmStackValue.len, 16);
            storeVmTuple(vmStackValue.data)(builder);
        })

    }
    throw new Error('Expected one of "VmStackValue_vm_stk_null", "VmStackValue_vm_stk_tinyint", "VmStackValue_vm_stk_int", "VmStackValue_vm_stk_nan", "VmStackValue_vm_stk_cell", "VmStackValue_vm_stk_slice", "VmStackValue_vm_stk_builder", "VmStackValue_vm_stk_cont", "VmStackValue_vm_stk_tuple" in loading "VmStackValue", but data does not satisfy any constructor');
}

/*
_ cell:^Cell st_bits:(## 10) end_bits:(## 10) { st_bits <= end_bits }
  st_ref:(#<= 4) end_ref:(#<= 4) { st_ref <= end_ref } = VmCellSlice;
*/

export function loadVmCellSlice(slice: Slice): VmCellSlice {
    let slice1 = slice.loadRef().beginParse(true);
    let _cell: Cell = slice1.asCell();
    let st_bits: number = slice.loadUint(10);
    let end_bits: number = slice.loadUint(10);
    let st_ref: number = slice.loadUint(bitLen(4));
    let end_ref: number = slice.loadUint(bitLen(4));
    if ((!(st_bits <= end_bits))) {
        throw new Error('Condition (st_bits <= end_bits) is not satisfied while loading "VmCellSlice" for type "VmCellSlice"');
    }
    if ((!(st_ref <= end_ref))) {
        throw new Error('Condition (st_ref <= end_ref) is not satisfied while loading "VmCellSlice" for type "VmCellSlice"');
    }
    return {
        kind: 'VmCellSlice',
        _cell: _cell,
        st_bits: st_bits,
        end_bits: end_bits,
        st_ref: st_ref,
        end_ref: end_ref,
    }

}

export function storeVmCellSlice(vmCellSlice: VmCellSlice): (builder: Builder) => void {
    return ((builder: Builder) => {
        let cell1 = beginCell();
        cell1.storeSlice(vmCellSlice._cell.beginParse(true));
        builder.storeRef(cell1);
        builder.storeUint(vmCellSlice.st_bits, 10);
        builder.storeUint(vmCellSlice.end_bits, 10);
        builder.storeUint(vmCellSlice.st_ref, bitLen(4));
        builder.storeUint(vmCellSlice.end_ref, bitLen(4));
        if ((!(vmCellSlice.st_bits <= vmCellSlice.end_bits))) {
            throw new Error('Condition (vmCellSlice.st_bits <= vmCellSlice.end_bits) is not satisfied while loading "VmCellSlice" for type "VmCellSlice"');
        }
        if ((!(vmCellSlice.st_ref <= vmCellSlice.end_ref))) {
            throw new Error('Condition (vmCellSlice.st_ref <= vmCellSlice.end_ref) is not satisfied while loading "VmCellSlice" for type "VmCellSlice"');
        }
    })

}

// vm_tupref_nil$_ = VmTupleRef 0;

// vm_tupref_single$_ entry:^VmStackValue = VmTupleRef 1;

// vm_tupref_any$_ {n:#} ref:^(VmTuple (n + 2)) = VmTupleRef (n + 2);

export function loadVmTupleRef(slice: Slice, arg0: number): VmTupleRef {
    if ((arg0 == 0)) {
        return {
            kind: 'VmTupleRef_vm_tupref_nil',
        }

    }
    if ((arg0 == 1)) {
        let slice1 = slice.loadRef().beginParse(true);
        let entry: VmStackValue = loadVmStackValue(slice1);
        return {
            kind: 'VmTupleRef_vm_tupref_single',
            entry: entry,
        }

    }
    if (true) {
        let slice1 = slice.loadRef().beginParse(true);
        let ref: VmTuple = loadVmTuple(slice1, ((arg0 - 2) + 2));
        return {
            kind: 'VmTupleRef_vm_tupref_any',
            n: (arg0 - 2),
            ref: ref,
        }

    }
    throw new Error('Expected one of "VmTupleRef_vm_tupref_nil", "VmTupleRef_vm_tupref_single", "VmTupleRef_vm_tupref_any" in loading "VmTupleRef", but data does not satisfy any constructor');
}

export function storeVmTupleRef(vmTupleRef: VmTupleRef): (builder: Builder) => void {
    if ((vmTupleRef.kind == 'VmTupleRef_vm_tupref_nil')) {
        return ((builder: Builder) => {
        })

    }
    if ((vmTupleRef.kind == 'VmTupleRef_vm_tupref_single')) {
        return ((builder: Builder) => {
            let cell1 = beginCell();
            storeVmStackValue(vmTupleRef.entry)(cell1);
            builder.storeRef(cell1);
        })

    }
    if ((vmTupleRef.kind == 'VmTupleRef_vm_tupref_any')) {
        return ((builder: Builder) => {
            let cell1 = beginCell();
            storeVmTuple(vmTupleRef.ref)(cell1);
            builder.storeRef(cell1);
        })

    }
    throw new Error('Expected one of "VmTupleRef_vm_tupref_nil", "VmTupleRef_vm_tupref_single", "VmTupleRef_vm_tupref_any" in loading "VmTupleRef", but data does not satisfy any constructor');
}

// vm_tuple_nil$_ = VmTuple 0;

// vm_tuple_tcons$_ {n:#} head:(VmTupleRef n) tail:^VmStackValue = VmTuple (n + 1);

export function loadVmTuple(slice: Slice, arg0: number): VmTuple {
    if ((arg0 == 0)) {
        return {
            kind: 'VmTuple_vm_tuple_nil',
        }

    }
    if (true) {
        let head: VmTupleRef = loadVmTupleRef(slice, (arg0 - 1));
        let slice1 = slice.loadRef().beginParse(true);
        let tail: VmStackValue = loadVmStackValue(slice1);
        return {
            kind: 'VmTuple_vm_tuple_tcons',
            n: (arg0 - 1),
            head: head,
            tail: tail,
        }

    }
    throw new Error('Expected one of "VmTuple_vm_tuple_nil", "VmTuple_vm_tuple_tcons" in loading "VmTuple", but data does not satisfy any constructor');
}

export function storeVmTuple(vmTuple: VmTuple): (builder: Builder) => void {
    if ((vmTuple.kind == 'VmTuple_vm_tuple_nil')) {
        return ((builder: Builder) => {
        })

    }
    if ((vmTuple.kind == 'VmTuple_vm_tuple_tcons')) {
        return ((builder: Builder) => {
            storeVmTupleRef(vmTuple.head)(builder);
            let cell1 = beginCell();
            storeVmStackValue(vmTuple.tail)(cell1);
            builder.storeRef(cell1);
        })

    }
    throw new Error('Expected one of "VmTuple_vm_tuple_nil", "VmTuple_vm_tuple_tcons" in loading "VmTuple", but data does not satisfy any constructor');
}

// vm_stack#_ depth:(## 24) stack:(VmStackList depth) = VmStack;

// vm_stk_nil#_ = VmStackList 0;

// vm_stk_cons#_ {n:#} rest:^(VmStackList n) tos:VmStackValue = VmStackList (n + 1);

export function storeVmStackList(vmStackList: VmStackList): (builder: Builder) => void {
    if ((vmStackList.kind == 'VmStackList_vm_stk_nil')) {
        return ((builder: Builder) => {
        })

    }
    if ((vmStackList.kind == 'VmStackList_vm_stk_cons')) {
        return ((builder: Builder) => {
            let cell1 = beginCell();
            storeVmStackList(vmStackList.rest)(cell1);
            builder.storeRef(cell1);
            storeVmStackValue(vmStackList.tos)(builder);
        })

    }
    throw new Error('Expected one of "VmStackList_vm_stk_nil", "VmStackList_vm_stk_cons" in loading "VmStackList", but data does not satisfy any constructor');
}

// _ cregs:(HashmapE 4 VmStackValue) = VmSaveList;

export function loadVmSaveList(slice: Slice): VmSaveList {
    let cregs: Dictionary<number, VmStackValue> = Dictionary.load(Dictionary.Keys.Uint(4), {
        serialize: () => { throw new Error('Not implemented') },
        parse: loadVmStackValue,
    }, slice);
    return {
        kind: 'VmSaveList',
        cregs: cregs,
    }

}

export function storeVmSaveList(vmSaveList: VmSaveList): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeDict(vmSaveList.cregs, Dictionary.Keys.Uint(4), {
            serialize: ((arg: VmStackValue, builder: Builder) => {
            storeVmStackValue(arg)(builder);
        }),
            parse: () => { throw new Error('Not implemented') },
        });
    })

}

/*
gas_limits#_ remaining:int64 _:^[ max_limit:int64 cur_limit:int64 credit:int64 ]
  = VmGasLimits;
*/

// _ libraries:(HashmapE 256 ^Cell) = VmLibraries;

/*
vm_ctl_data$_ nargs:(Maybe uint13) stack:(Maybe VmStack) save:VmSaveList
cp:(Maybe int16) = VmControlData;
*/

export function loadVmControlData(slice: Slice): VmControlData {
    let nargs: Maybe<number> = loadMaybe<number>(slice, ((slice: Slice) => {
        return slice.loadUint(13)

    }));
    let stack: Maybe<TupleItem[]> = loadMaybe<TupleItem[]>(slice, ((slice: Slice) => {
        return parseTuple(slice.asCell())

    }));
    let save: VmSaveList = loadVmSaveList(slice);
    let cp: Maybe<number> = loadMaybe<number>(slice, ((slice: Slice) => {
        return slice.loadInt(16)

    }));
    return {
        kind: 'VmControlData',
        nargs: nargs,
        stack: stack,
        save: save,
        cp: cp,
    }

}

export function storeVmControlData(vmControlData: VmControlData): (builder: Builder) => void {
    return ((builder: Builder) => {
        storeMaybe<number>(vmControlData.nargs, ((arg: number) => {
            return ((builder: Builder) => {
                builder.storeUint(arg, 13);
            })

        }))(builder);
        storeMaybe<TupleItem[]>(vmControlData.stack, ((arg: TupleItem[]) => {
            return ((builder: Builder) => {
                copyCellToBuilder(serializeTuple(arg), builder);
            })

        }))(builder);
        storeVmSaveList(vmControlData.save)(builder);
        storeMaybe<number>(vmControlData.cp, ((arg: number) => {
            return ((builder: Builder) => {
                builder.storeInt(arg, 16);
            })

        }))(builder);
    })

}

// vmc_std$00 cdata:VmControlData code:VmCellSlice = VmCont;

// vmc_envelope$01 cdata:VmControlData next:^VmCont = VmCont;

// vmc_quit$1000 exit_code:int32 = VmCont;

// vmc_quit_exc$1001 = VmCont;

// vmc_repeat$10100 count:uint63 body:^VmCont after:^VmCont = VmCont;

// vmc_until$110000 body:^VmCont after:^VmCont = VmCont;

// vmc_again$110001 body:^VmCont = VmCont;

/*
vmc_while_cond$110010 cond:^VmCont body:^VmCont
after:^VmCont = VmCont;
*/

/*
vmc_while_body$110011 cond:^VmCont body:^VmCont
after:^VmCont = VmCont;
*/

// vmc_pushint$1111 value:int32 next:^VmCont = VmCont;

export function loadVmCont(slice: Slice): VmCont {
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b00))) {
        slice.loadUint(2);
        let cdata: VmControlData = loadVmControlData(slice);
        let code: VmCellSlice = loadVmCellSlice(slice);
        return {
            kind: 'VmCont_vmc_std',
            cdata: cdata,
            code: code,
        }

    }
    if (((slice.remainingBits >= 2) && (slice.preloadUint(2) == 0b01))) {
        slice.loadUint(2);
        let cdata: VmControlData = loadVmControlData(slice);
        let slice1 = slice.loadRef().beginParse(true);
        let next: VmCont = loadVmCont(slice1);
        return {
            kind: 'VmCont_vmc_envelope',
            cdata: cdata,
            next: next,
        }

    }
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0b1000))) {
        slice.loadUint(4);
        let exit_code: number = slice.loadInt(32);
        return {
            kind: 'VmCont_vmc_quit',
            exit_code: exit_code,
        }

    }
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0b1001))) {
        slice.loadUint(4);
        return {
            kind: 'VmCont_vmc_quit_exc',
        }

    }
    if (((slice.remainingBits >= 5) && (slice.preloadUint(5) == 0b10100))) {
        slice.loadUint(5);
        let count: bigint = slice.loadUintBig(63);
        let slice1 = slice.loadRef().beginParse(true);
        let body: VmCont = loadVmCont(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let after: VmCont = loadVmCont(slice2);
        return {
            kind: 'VmCont_vmc_repeat',
            count: count,
            body: body,
            after: after,
        }

    }
    if (((slice.remainingBits >= 6) && (slice.preloadUint(6) == 0b110000))) {
        slice.loadUint(6);
        let slice1 = slice.loadRef().beginParse(true);
        let body: VmCont = loadVmCont(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let after: VmCont = loadVmCont(slice2);
        return {
            kind: 'VmCont_vmc_until',
            body: body,
            after: after,
        }

    }
    if (((slice.remainingBits >= 6) && (slice.preloadUint(6) == 0b110001))) {
        slice.loadUint(6);
        let slice1 = slice.loadRef().beginParse(true);
        let body: VmCont = loadVmCont(slice1);
        return {
            kind: 'VmCont_vmc_again',
            body: body,
        }

    }
    if (((slice.remainingBits >= 6) && (slice.preloadUint(6) == 0b110010))) {
        slice.loadUint(6);
        let slice1 = slice.loadRef().beginParse(true);
        let cond: VmCont = loadVmCont(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let body: VmCont = loadVmCont(slice2);
        let slice3 = slice.loadRef().beginParse(true);
        let after: VmCont = loadVmCont(slice3);
        return {
            kind: 'VmCont_vmc_while_cond',
            cond: cond,
            body: body,
            after: after,
        }

    }
    if (((slice.remainingBits >= 6) && (slice.preloadUint(6) == 0b110011))) {
        slice.loadUint(6);
        let slice1 = slice.loadRef().beginParse(true);
        let cond: VmCont = loadVmCont(slice1);
        let slice2 = slice.loadRef().beginParse(true);
        let body: VmCont = loadVmCont(slice2);
        let slice3 = slice.loadRef().beginParse(true);
        let after: VmCont = loadVmCont(slice3);
        return {
            kind: 'VmCont_vmc_while_body',
            cond: cond,
            body: body,
            after: after,
        }

    }
    if (((slice.remainingBits >= 4) && (slice.preloadUint(4) == 0b1111))) {
        slice.loadUint(4);
        let value: number = slice.loadInt(32);
        let slice1 = slice.loadRef().beginParse(true);
        let next: VmCont = loadVmCont(slice1);
        return {
            kind: 'VmCont_vmc_pushint',
            value: value,
            next: next,
        }

    }
    throw new Error('Expected one of "VmCont_vmc_std", "VmCont_vmc_envelope", "VmCont_vmc_quit", "VmCont_vmc_quit_exc", "VmCont_vmc_repeat", "VmCont_vmc_until", "VmCont_vmc_again", "VmCont_vmc_while_cond", "VmCont_vmc_while_body", "VmCont_vmc_pushint" in loading "VmCont", but data does not satisfy any constructor');
}

export function storeVmCont(vmCont: VmCont): (builder: Builder) => void {
    if ((vmCont.kind == 'VmCont_vmc_std')) {
        return ((builder: Builder) => {
            builder.storeUint(0b00, 2);
            storeVmControlData(vmCont.cdata)(builder);
            storeVmCellSlice(vmCont.code)(builder);
        })

    }
    if ((vmCont.kind == 'VmCont_vmc_envelope')) {
        return ((builder: Builder) => {
            builder.storeUint(0b01, 2);
            storeVmControlData(vmCont.cdata)(builder);
            let cell1 = beginCell();
            storeVmCont(vmCont.next)(cell1);
            builder.storeRef(cell1);
        })

    }
    if ((vmCont.kind == 'VmCont_vmc_quit')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1000, 4);
            builder.storeInt(vmCont.exit_code, 32);
        })

    }
    if ((vmCont.kind == 'VmCont_vmc_quit_exc')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1001, 4);
        })

    }
    if ((vmCont.kind == 'VmCont_vmc_repeat')) {
        return ((builder: Builder) => {
            builder.storeUint(0b10100, 5);
            builder.storeUint(vmCont.count, 63);
            let cell1 = beginCell();
            storeVmCont(vmCont.body)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeVmCont(vmCont.after)(cell2);
            builder.storeRef(cell2);
        })

    }
    if ((vmCont.kind == 'VmCont_vmc_until')) {
        return ((builder: Builder) => {
            builder.storeUint(0b110000, 6);
            let cell1 = beginCell();
            storeVmCont(vmCont.body)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeVmCont(vmCont.after)(cell2);
            builder.storeRef(cell2);
        })

    }
    if ((vmCont.kind == 'VmCont_vmc_again')) {
        return ((builder: Builder) => {
            builder.storeUint(0b110001, 6);
            let cell1 = beginCell();
            storeVmCont(vmCont.body)(cell1);
            builder.storeRef(cell1);
        })

    }
    if ((vmCont.kind == 'VmCont_vmc_while_cond')) {
        return ((builder: Builder) => {
            builder.storeUint(0b110010, 6);
            let cell1 = beginCell();
            storeVmCont(vmCont.cond)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeVmCont(vmCont.body)(cell2);
            builder.storeRef(cell2);
            let cell3 = beginCell();
            storeVmCont(vmCont.after)(cell3);
            builder.storeRef(cell3);
        })

    }
    if ((vmCont.kind == 'VmCont_vmc_while_body')) {
        return ((builder: Builder) => {
            builder.storeUint(0b110011, 6);
            let cell1 = beginCell();
            storeVmCont(vmCont.cond)(cell1);
            builder.storeRef(cell1);
            let cell2 = beginCell();
            storeVmCont(vmCont.body)(cell2);
            builder.storeRef(cell2);
            let cell3 = beginCell();
            storeVmCont(vmCont.after)(cell3);
            builder.storeRef(cell3);
        })

    }
    if ((vmCont.kind == 'VmCont_vmc_pushint')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1111, 4);
            builder.storeInt(vmCont.value, 32);
            let cell1 = beginCell();
            storeVmCont(vmCont.next)(cell1);
            builder.storeRef(cell1);
        })

    }
    throw new Error('Expected one of "VmCont_vmc_std", "VmCont_vmc_envelope", "VmCont_vmc_quit", "VmCont_vmc_quit_exc", "VmCont_vmc_repeat", "VmCont_vmc_until", "VmCont_vmc_again", "VmCont_vmc_while_cond", "VmCont_vmc_while_body", "VmCont_vmc_pushint" in loading "VmCont", but data does not satisfy any constructor');
}

// _ (HashmapE 256 ^DNSRecord) = DNS_RecordSet;

// chunk_ref_empty$_ = TextChunkRef 0;

// chunk_ref$_ {n:#} ref:^(TextChunks (n + 1)) = TextChunkRef (n + 1);

export function loadTextChunkRef(slice: Slice, arg0: number): TextChunkRef {
    if ((arg0 == 0)) {
        return {
            kind: 'TextChunkRef_chunk_ref_empty',
        }

    }
    if (true) {
        let slice1 = slice.loadRef().beginParse(true);
        let ref: TextChunks = loadTextChunks(slice1, ((arg0 - 1) + 1));
        return {
            kind: 'TextChunkRef_chunk_ref',
            n: (arg0 - 1),
            ref: ref,
        }

    }
    throw new Error('Expected one of "TextChunkRef_chunk_ref_empty", "TextChunkRef_chunk_ref" in loading "TextChunkRef", but data does not satisfy any constructor');
}

export function storeTextChunkRef(textChunkRef: TextChunkRef): (builder: Builder) => void {
    if ((textChunkRef.kind == 'TextChunkRef_chunk_ref_empty')) {
        return ((builder: Builder) => {
        })

    }
    if ((textChunkRef.kind == 'TextChunkRef_chunk_ref')) {
        return ((builder: Builder) => {
            let cell1 = beginCell();
            storeTextChunks(textChunkRef.ref)(cell1);
            builder.storeRef(cell1);
        })

    }
    throw new Error('Expected one of "TextChunkRef_chunk_ref_empty", "TextChunkRef_chunk_ref" in loading "TextChunkRef", but data does not satisfy any constructor');
}

// text_chunk_empty$_ = TextChunks 0;

// text_chunk$_ {n:#} len:(## 8) data:(bits (len * 8)) next:(TextChunkRef n) = TextChunks (n + 1);

export function loadTextChunks(slice: Slice, arg0: number): TextChunks {
    if ((arg0 == 0)) {
        return {
            kind: 'TextChunks_text_chunk_empty',
        }

    }
    if (true) {
        let len: number = slice.loadUint(8);
        let data: BitString = slice.loadBits((len * 8));
        let next: TextChunkRef = loadTextChunkRef(slice, (arg0 - 1));
        return {
            kind: 'TextChunks_text_chunk',
            n: (arg0 - 1),
            len: len,
            data: data,
            next: next,
        }

    }
    throw new Error('Expected one of "TextChunks_text_chunk_empty", "TextChunks_text_chunk" in loading "TextChunks", but data does not satisfy any constructor');
}

export function storeTextChunks(textChunks: TextChunks): (builder: Builder) => void {
    if ((textChunks.kind == 'TextChunks_text_chunk_empty')) {
        return ((builder: Builder) => {
        })

    }
    if ((textChunks.kind == 'TextChunks_text_chunk')) {
        return ((builder: Builder) => {
            builder.storeUint(textChunks.len, 8);
            builder.storeBits(textChunks.data);
            storeTextChunkRef(textChunks.next)(builder);
        })

    }
    throw new Error('Expected one of "TextChunks_text_chunk_empty", "TextChunks_text_chunk" in loading "TextChunks", but data does not satisfy any constructor');
}

// text$_ chunks:(## 8) rest:(TextChunks chunks) = Text;

export function loadText(slice: Slice): Text {
    let chunks: number = slice.loadUint(8);
    let rest: TextChunks = loadTextChunks(slice, chunks);
    return {
        kind: 'Text',
        chunks: chunks,
        rest: rest,
    }

}

export function storeText(text: Text): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(text.chunks, 8);
        storeTextChunks(text.rest)(builder);
    })

}

// dns_text#1eda _:Text = DNSRecord;

// dns_next_resolver#ba93 resolver:MsgAddressInt = DNSRecord;

/*
dns_adnl_address#ad01 adnl_addr:bits256 flags:(## 8) { flags <= 1 }
  proto_list:flags . 0?ProtoList = DNSRecord;
*/

/*
dns_smc_address#9fd3 smc_addr:MsgAddressInt flags:(## 8) { flags <= 1 }
  cap_list:flags . 0?SmcCapList = DNSRecord;
*/

// dns_storage_address#7473 bag_id:bits256 = DNSRecord;

// proto_list_nil$0 = ProtoList;

// proto_list_next$1 head:Protocol tail:ProtoList = ProtoList;

export function storeProtoList(protoList: ProtoList): (builder: Builder) => void {
    if ((protoList.kind == 'ProtoList_proto_list_nil')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
        })

    }
    if ((protoList.kind == 'ProtoList_proto_list_next')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1, 1);
            storeProtocol(protoList.head)(builder);
            storeProtoList(protoList.tail)(builder);
        })

    }
    throw new Error('Expected one of "ProtoList_proto_list_nil", "ProtoList_proto_list_next" in loading "ProtoList", but data does not satisfy any constructor');
}

// proto_http#4854 = Protocol;

export function storeProtocol(protocol: Protocol): (builder: Builder) => void {
    return ((builder: Builder) => {
        builder.storeUint(0x4854, 16);
    })

}

// cap_list_nil$0 = SmcCapList;

// cap_list_next$1 head:SmcCapability tail:SmcCapList = SmcCapList;

export function storeSmcCapList(smcCapList: SmcCapList): (builder: Builder) => void {
    if ((smcCapList.kind == 'SmcCapList_cap_list_nil')) {
        return ((builder: Builder) => {
            builder.storeUint(0b0, 1);
        })

    }
    if ((smcCapList.kind == 'SmcCapList_cap_list_next')) {
        return ((builder: Builder) => {
            builder.storeUint(0b1, 1);
            storeSmcCapability(smcCapList.head)(builder);
            storeSmcCapList(smcCapList.tail)(builder);
        })

    }
    throw new Error('Expected one of "SmcCapList_cap_list_nil", "SmcCapList_cap_list_next" in loading "SmcCapList", but data does not satisfy any constructor');
}

// cap_method_seqno#5371 = SmcCapability;

// cap_method_pubkey#71f4 = SmcCapability;

// cap_is_wallet#2177 = SmcCapability;

// cap_name#ff name:Text = SmcCapability;

export function storeSmcCapability(smcCapability: SmcCapability): (builder: Builder) => void {
    if ((smcCapability.kind == 'SmcCapability_cap_method_seqno')) {
        return ((builder: Builder) => {
            builder.storeUint(0x5371, 16);
        })

    }
    if ((smcCapability.kind == 'SmcCapability_cap_method_pubkey')) {
        return ((builder: Builder) => {
            builder.storeUint(0x71f4, 16);
        })

    }
    if ((smcCapability.kind == 'SmcCapability_cap_is_wallet')) {
        return ((builder: Builder) => {
            builder.storeUint(0x2177, 16);
        })

    }
    if ((smcCapability.kind == 'SmcCapability_cap_name')) {
        return ((builder: Builder) => {
            builder.storeUint(0xff, 8);
            storeText(smcCapability.name)(builder);
        })

    }
    throw new Error('Expected one of "SmcCapability_cap_method_seqno", "SmcCapability_cap_method_pubkey", "SmcCapability_cap_is_wallet", "SmcCapability_cap_name" in loading "SmcCapability", but data does not satisfy any constructor');
}

/*
chan_config$_  init_timeout:uint32 close_timeout:uint32 a_key:bits256 b_key:bits256
  a_addr:^MsgAddressInt b_addr:^MsgAddressInt channel_id:uint64 min_A_extra:Grams = ChanConfig;
*/

// chan_state_init$000  signed_A:Bool signed_B:Bool min_A:Grams min_B:Grams expire_at:uint32 A:Grams B:Grams = ChanState;

// chan_state_close$001 signed_A:Bool signed_B:Bool promise_A:Grams promise_B:Grams expire_at:uint32 A:Grams B:Grams = ChanState;

// chan_state_payout$010 A:Grams B:Grams = ChanState;

// chan_promise$_ channel_id:uint64 promise_A:Grams promise_B:Grams = ChanPromise;

export function loadChanPromise(slice: Slice): ChanPromise {
    let channel_id: bigint = slice.loadUintBig(64);
    let promise_A: bigint = slice.loadCoins();
    let promise_B: bigint = slice.loadCoins();
    return {
        kind: 'ChanPromise',
        channel_id: channel_id,
        promise_A: promise_A,
        promise_B: promise_B,
    }

}
// chan_signed_promise#_ sig:(Maybe ^bits512) promise:ChanPromise = ChanSignedPromise;

// chan_msg_init#27317822 inc_A:Grams inc_B:Grams min_A:Grams min_B:Grams channel_id:uint64 = ChanMsg;

// chan_msg_close#f28ae183 extra_A:Grams extra_B:Grams promise:ChanSignedPromise  = ChanMsg;

// chan_msg_timeout#43278a28 = ChanMsg;

// chan_msg_payout#37fe7810 = ChanMsg;

// chan_signed_msg$_ sig_A:(Maybe ^bits512) sig_B:(Maybe ^bits512) msg:ChanMsg = ChanSignedMsg;

// chan_op_cmd#912838d1 msg:ChanSignedMsg = ChanOp;

// chan_data$_ config:^ChanConfig state:^ChanState = ChanData;

