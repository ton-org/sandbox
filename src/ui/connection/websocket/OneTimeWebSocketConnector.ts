import { getOptionalEnv } from '../../../utils/environment';
import { WebSocketConnectionOptions } from './types';
import { IUIConnector } from '../UIConnector';
import { CONNECT_ERROR_MESSAGE, DEFAULT_HOST, DEFAULT_PORT } from './constants';

export class OneTimeWebSocketConnector implements IUIConnector {
    private readonly websocketAddress: string;

    constructor({ wsPort = DEFAULT_PORT, wsHost = DEFAULT_HOST }: WebSocketConnectionOptions) {
        this.websocketAddress = getOptionalEnv('SANDBOX_WEBSOCKET_ADDR') ?? `ws://${wsHost}:${wsPort}`;
    }

    send(data: string): void {
        // This solution, which requires a reconnection for each send, may seem inefficient.
        // However, when Jest is not used, it’s unclear when the connection should be closed.
        // Until the connection is closed, the Node process will not terminate, and Jest will issue
        // a warning, while the test will continue to wait for the connection to close.
        //
        // This solution avoids that problem, as the connection is closed immediately after sending.
        // Meanwhile, the reconnection time is short enough to be unnoticeable during tests.
        const ws = new WebSocket(this.websocketAddress);

        ws.addEventListener(
            'open',
            () => {
                ws.send(data);
                ws.close();
            },
            { once: true },
        );

        ws.addEventListener(
            'error',
            (err) => {
                // eslint-disable-next-line no-console
                console.warn(CONNECT_ERROR_MESSAGE, err);
                ws.close();
            },
            { once: true },
        );
    }
}
