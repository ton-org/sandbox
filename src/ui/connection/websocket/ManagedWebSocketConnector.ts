import { getOptionalEnv } from '../../../utils/environment';
import { WebSocketConnectionOptions } from './types';
import { IUIConnector } from '../UIConnector';

// TODO: reconnects? handshake?
export class ManagedWebSocketConnector implements IUIConnector {
    private readonly websocketAddress: string;

    ws: WebSocket | undefined;

    constructor({ wsPort = 7743, wsHost = 'localhost' }: WebSocketConnectionOptions = {}) {
        this.websocketAddress =
            getOptionalEnv('SANDBOX_WEBSOCKET_ADDR') ?? `ws://${wsHost ?? 'localhost'}:${wsPort ?? '7743'}`;
    }

    async connect() {
        try {
            this.ws = await new Promise((resolve, reject) => {
                const ws = new WebSocket(this.websocketAddress);
                ws.addEventListener('open', () => resolve(ws));
                ws.addEventListener('error', reject);
            });
        } catch (err) {
            console.warn(
                'Unable to connect to websocket server. Make sure the port and host match the sandbox server or VS Code settings. You can set the WebSocket address globally with `SANDBOX_WEBSOCKET_ADDR=ws://localhost:7743` or via `Blockchain.create({ uiOptions: { enabled: true, wsHost: "localhost", wsPort: 7743 } })`.',
                err,
            );
        }
    }

    disconnect() {
        this.ws?.close();
        this.ws = undefined;
    }

    send(data: string): void {
        if (this?.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        }
    }
}
