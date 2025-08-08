import {cac} from "cac";
import {startServer, type StartServerOptions} from "./server";

const version = "0.35.46";

interface CliOptions {
    readonly port: number | undefined;
    readonly host: string | undefined;
    readonly help: boolean | undefined;
}

async function runServer(options: CliOptions): Promise<void> {
    const serverOptions: StartServerOptions = {
        port: options.port ?? 7743,
        host: options.host,
    };

    try {
        startServer(serverOptions);
    } catch (error) {
        if (error instanceof Error) {
            console.error("Failed to start server:", error.message);
        }
        process.exit(1);
    }
}

export async function main(): Promise<void> {
    const cli = cac("sandbox-server");

    cli.version(version)
        .usage("[options]")
        .option("-p, --port <port>", "Port to listen on", {default: 7743})
        .option("-h, --host <host>", "Host to bind to (default: 0.0.0.0)")
        .help();

    const parsed = cli.parse();
    const {port, host, help} = parsed.options as CliOptions;
    if (help) {
        return;
    }

    await runServer({port, host, help});
}

process.on("uncaughtException", (error) => {
    console.error("Unexpected error:", error.message);
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
    process.exit(1);
});
