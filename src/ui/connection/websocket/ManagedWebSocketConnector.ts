import { getOptionalEnv } from '../../../utils/environment';
import { WebSocketConnectionOptions } from './types';
import { IUIConnector } from '../UIConnector';
import { CONNECT_ERROR_MESSAGE, DEFAULT_HOST, DEFAULT_PORT } from './constants';

export class ManagedWebSocketConnector implements IUIConnector {
    private readonly websocketAddress: string;

    ws: WebSocket | undefined;

    constructor({ wsPort = DEFAULT_PORT, wsHost = DEFAULT_HOST }: WebSocketConnectionOptions = {}) {
        this.websocketAddress = getOptionalEnv('SANDBOX_WEBSOCKET_ADDR') ?? `ws://${wsHost}:${wsPort}`;
    }

    async connect() {
        try {
            this.ws = await new Promise((resolve, reject) => {
                const ws = new WebSocket(this.websocketAddress);
                ws.addEventListener('open', () => resolve(ws), { once: true });
                ws.addEventListener(
                    'error',
                    (err) => {
                        ws.close();
                        reject(err);
                    },
                    { once: true },
                );
            });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.warn(CONNECT_ERROR_MESSAGE, err);
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
