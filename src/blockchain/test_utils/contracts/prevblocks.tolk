@pure
fun prevKeyBlock(): tuple
    asm "PREVKEYBLOCK";

@pure
fun prevMcBlocks(): tuple
    asm "PREVMCBLOCKS";

@pure
fun blockIdSeqno(blockId: tuple): int {
    return blockId.get(2);
}

fun onInternalMessage(myBalance: int, msgValue: int, msgFull: cell, msgBody: slice) {
    if (msgBody.isEnd()) {
        return;
    }

    var cs = msgFull.beginParse();
    val flags = cs.loadMessageFlags();
    if (isMessageBounced(flags)) {
        return;
    }

    val sender = cs.loadAddress();

    val op = msgBody.loadMessageOp();

    if (op == 1) {
        sendRawMessage(
            beginCell()
            .storeUint(0x18, 6)
            .storeAddress(sender)
            .storeCoins(0)
            .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .storeUint(1, 32)
            .storeUint(blockIdSeqno(prevKeyBlock()), 32)
            .storeUint(blockIdSeqno(prevMcBlocks().get(0)), 32)
            .endCell(),
            SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE
        );
        return;
    }

    throw 0xffff;
}

get prevBlockSeqnos(): (int, int) {
    return (
        blockIdSeqno(prevKeyBlock()),
        blockIdSeqno(prevMcBlocks().get(0))
    );
}