import {WebSocketServer, WebSocket} from "ws";

export async function main(): Promise<void> {
    const wss = new WebSocketServer({port: 8081});
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

    console.log("WebSocket running on port 8081");
}
