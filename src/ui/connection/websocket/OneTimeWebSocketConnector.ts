import { getOptionalEnv } from '../../../utils/environment';
import { WebSocketConnectionOptions } from './types';
import { IUIConnector } from '../UIConnector';

export class OneTimeWebSocketConnector implements IUIConnector {
    private readonly websocketAddress: string;

    constructor({ wsPort = 7743, wsHost = 'localhost' }: WebSocketConnectionOptions) {
        this.websocketAddress =
            getOptionalEnv('SANDBOX_WEBSOCKET_ADDR') ?? `ws://${wsHost ?? 'localhost'}:${wsPort ?? '7743'}`;
    }

    send(data: string): void {
        // TODO: refine a little
        // This solution, requiring a reconnection for each sending, may seem inefficient.
        // But in case when not jest used, it's unclear when this connection should be closed.
        // Until the connection is closed, the Node process will not terminate, and Jest will issue
        // a warning, but the test will continue to wait for the connection to be closed.
        //
        // This solution does not have this problem since the connection is closed immediately after sending.
        // The reconnection time, meanwhile, is short enough to not be noticeable during tests.
        const ws = new WebSocket(this.websocketAddress);

        ws.addEventListener('open', () => {
            ws.send(data);
            ws.close();
        });

        ws.addEventListener('error', () => {
            console.warn(
                'Unable to connect to websocket server. Make sure the port and host match the sandbox server or VS Code settings. You can set the WebSocket address globally with `SANDBOX_WEBSOCKET_ADDR=ws://localhost:7743` or via `Blockchain.create({ uiOptions: { enabled: true, host: "localhost", port: 7743 } })`.',
            );
            ws.close();
        });
    }
}
