fun slice.loadStdAddress(mutate self): address
    asm( -> 1 0) "LDSTDADDR"

fun onInternalMessage(msgBody: slice) {
    val addr = msgBody.loadStdAddress();
    debug.print(addr);
}
