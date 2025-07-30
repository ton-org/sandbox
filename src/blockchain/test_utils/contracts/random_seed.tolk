@pure
fun randseed(): uint256
    asm "RANDSEED";

fun onInternalMessage(in: InMessage) {
    var msg = createMessage({
        bounce: false,
        value: 0,
        dest: in.senderAddress,
        body: randseed(),
    });
    msg.send(SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE);
}

get fun randomSeed(): int {
    return randseed();
}