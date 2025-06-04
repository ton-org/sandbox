import { join } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';

import { SnapshotMetric, SnapshotMetricList } from './collectMetric';

export async function readSnapshots(snapshotDir: string) {
    const list: SnapshotMetricList = {};
    if (!existsSync(snapshotDir)) {
        return list;
    }
    const snapshotFiles = readdirSync(snapshotDir).filter((f) => f.endsWith('.json'));
    for (const snapshotFile of snapshotFiles) {
        const data = readFileSync(join(snapshotDir, snapshotFile), 'utf-8');
        try {
            const raw = JSON.parse(data) as Omit<SnapshotMetric, 'createdAt'> & { createdAt: string };
            const snapshot: SnapshotMetric = {
                ...raw,
                createdAt: new Date(raw.createdAt),
            };
            if (!list[snapshot.label]) {
                list[snapshot.label] = {
                    name: snapshotFile,
                    content: snapshot,
                };
            }
        } catch (_) {
            throw new Error(`Can not parse snapshot file: ${snapshotFile}`);
        }
    }
    return list;
}
