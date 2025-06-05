import fs, { ReadStream } from 'fs';
import { Readable } from 'stream';

import { readJsonl } from './readJsonl';

function mockReadStream(chunk: string): ReadStream {
    const stream = new Readable({
        read() {
            this.push(chunk);
            this.push(null);
        },
    }) as unknown as ReadStream;
    Object.assign(stream, {
        close: jest.fn(),
        bytesRead: 0,
        path: 'mocked-path',
        pending: false,
    });
    return stream;
}

jest.mock('fs');

describe('readJsonl', () => {
    const data = '{"foo":"bar"}\n{"foo":"quz"}\n';
    const mock = fs as jest.Mocked<typeof fs>;

    afterEach(() => jest.resetAllMocks());

    it('should success read JSONL', async () => {
        mock.createReadStream.mockReturnValueOnce(mockReadStream(data));
        expect(await readJsonl<{ foo: string }>('foo.jsonl')).toEqual([{ foo: 'bar' }, { foo: 'quz' }]);
    });

    it('should throw on broken JSONL', async () => {
        mock.createReadStream.mockReturnValueOnce(mockReadStream(data.slice(1)));
        await expect(readJsonl<{ foo: string }>('foo.jsonl')).rejects.toThrowError(
            'Could not parse line: "foo":"bar"}',
        );
    });
});
