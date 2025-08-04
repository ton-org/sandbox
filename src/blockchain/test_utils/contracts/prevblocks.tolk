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

fun onInternalMessage(in: InMessage) {
    val op = in.body.loadMessageOp();

    if (op == 1) {
        var msg = createMessage({
            bounce: false,
            value: 0,
            dest: in.senderAddress,
            body: beginCell()
                .storeUint(1, 32)
                .storeUint(blockIdSeqno(prevKeyBlock()), 32)
                .storeUint(blockIdSeqno(prevMcBlocks().get(0)), 32),
        });
        msg.send(SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE);
        return;
    }

    throw 0xffff;
}

get fun prevBlockSeqnos(): (int, int) {
    return (
        blockIdSeqno(prevKeyBlock()),
        blockIdSeqno(prevMcBlocks().get(0))
    );
}