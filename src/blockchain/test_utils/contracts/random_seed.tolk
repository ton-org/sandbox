@pure
fun randseed(): int
    asm "RANDSEED";

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

    sendRawMessage(
        beginCell()
            .storeUint(0x18, 6)
            .storeAddress(sender)
            .storeCoins(0)
            .storeUint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .storeUint(randseed(), 256)
            .endCell(),
        SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE
    );
}

get randomSeed(): int {
    return randseed();
}