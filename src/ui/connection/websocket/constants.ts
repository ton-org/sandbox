export const DEFAULT_PORT = 7743;
export const DEFAULT_HOST = 'localhost';
export const CONNECT_ERROR_MESSAGE =
    'Unable to connect to websocket server. Make sure the port and host match the sandbox server or VS Code settings. You can set the WebSocket address globally with `SANDBOX_WEBSOCKET_ADDR=ws://localhost:7743` or via `Blockchain.create({ uiOptions: { enabled: true, wsHost: "localhost", wsPort: 7743 } })`.';
