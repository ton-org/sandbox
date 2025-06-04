import * as fs from 'fs';

import { simpleSnapshot } from './fixtures/data.fixture';
import { readSnapshots } from './readSnapshots';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

function mockFsFiles(value: string) {
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readdirSync.mockReturnValue(['001.json'] as unknown as any);
    mockedFs.readFileSync.mockReturnValue(value);
}

describe('readSnapshots', () => {
    const snapshotDir = '.benchmark';

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('returns empty object', async () => {
        mockedFs.existsSync.mockReturnValue(false);
        const result = await readSnapshots(snapshotDir);
        expect(result).toEqual({});
        expect(mockedFs.existsSync).toHaveBeenCalledWith(snapshotDir);
    });

    it('reads and parses snapshot', async () => {
        mockFsFiles(JSON.stringify(simpleSnapshot));
        const result = await readSnapshots(snapshotDir);
        expect(result).toHaveProperty('simple');
        expect(result.simple.name).toEqual('001.json');
        expect(result.simple.content.label).toEqual('simple');
        expect(result.simple.content.createdAt instanceof Date).toEqual(true);
        expect(result.simple.content.items.length).toEqual(1);
    });

    it('error for not valid JSON', async () => {
        mockFsFiles('invalid-json');
        await expect(readSnapshots(snapshotDir)).rejects.toThrow('Can not parse snapshot file: 001.json');
    });
});
