import { randomUUID } from 'crypto';

import { Blockchain } from '../blockchain/Blockchain';
import { ManagedWebSocketConnector } from '../ui/connection/websocket/ManagedWebSocketConnector';

let websocketConnector: ManagedWebSocketConnector | undefined;

beforeAll(() => {
    const originalCreate = Blockchain.create.bind(Blockchain);

    Blockchain.create = async (...args): Promise<Blockchain> => {
        let [opts, ...otherArgs] = args;

        if (!opts?.uiOptions?.connector) {
            if (!websocketConnector) {
                websocketConnector = new ManagedWebSocketConnector(opts?.uiOptions);
                // eslint-disable-next-line no-console
                console.log('Connecting to websocket connector...');
                await websocketConnector.connect();
            }

            opts = {
                ...opts,
                uiOptions: {
                    ...opts?.uiOptions,
                    enabled: true,
                    connector: websocketConnector,
                },
            };
        }

        return await originalCreate(opts, ...otherArgs);
    };
});

beforeEach(() => {
    expect.setState({ testId: randomUUID() });
});

afterEach(() => {
    expect.setState({ testId: undefined });
});

afterAll(() => {
    websocketConnector?.disconnect();
});
