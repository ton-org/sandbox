fun onInternalMessage(msgBody: slice) {
    while (msgBody.remainingRefsCount()) {
        val mode = msgBody.loadUint(8);
        sendRawMessage(msgBody.loadRef(), mode);
    }
}
