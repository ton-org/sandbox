import {WebSocketServer, WebSocket} from "ws";

export type StartServerOptions = {
    readonly port: number;
    readonly host?: string;
};

export function startServer(options: StartServerOptions): WebSocketServer {
    const {port, host} = options;
    const wss = new WebSocketServer({port, host});
    const clients = new Set<WebSocket>();

    wss.on("connection", ws => {
        clients.add(ws);

        ws.on("message", data => {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            const message = data.toString();

            for (const client of clients) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            }
        });

        ws.on("close", () => {
            clients.delete(ws);
        });
    });

    const boundHost = host ?? "0.0.0.0";
    console.log(`Sandbox WebSocket running on ${boundHost}:${port}`);
    return wss;
}
