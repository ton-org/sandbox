fun setlibcode(lib: cell, mode: int): void
    asm "SETLIBCODE";

struct(0x00000001) DeployLibrary {
    mode: uint8;
    library: cell;
}

struct(0x00000002) UseLibrary {
    libraryRef: cell;
}

type AllowedMessage = DeployLibrary | UseLibrary;

fun onInternalMessage(in: InMessage) {
    val msg = AllowedMessage.fromSlice(in.body);
    match (msg) {
        DeployLibrary => {
            setlibcode(msg.library, msg.mode);
        }
        UseLibrary => {
            var libraryContent = msg.libraryRef.beginParse();
            val outMessage = createMessage({
                bounce: false,
                value: 0,
                dest: in.senderAddress,
                body: libraryContent,
            });
            outMessage.send(SEND_MODE_CARRY_ALL_REMAINING_MESSAGE_VALUE);
        }
    }
}