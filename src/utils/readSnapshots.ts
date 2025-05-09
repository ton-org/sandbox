import { join } from 'path';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { SnapshotMetric, SnapshotMetricList } from './collectMetric';

export async function readSnapshots(snapshotDir: string) {
    const list: SnapshotMetricList = {};
    if (!existsSync(snapshotDir)) {
        return list;
    }
    const byTimestamp = (a: string, b: string) => Number(b.split('.')[0]) - Number(a.split('.')[0]);
    const snapshotFiles = readdirSync(snapshotDir)
        .filter((f) => f.endsWith('.json'))
        .sort(byTimestamp);
    for (const snapshotFile of snapshotFiles) {
        const data = readFileSync(join(snapshotDir, snapshotFile), 'utf-8');
        try {
            const snapshot = JSON.parse(data) as SnapshotMetric;
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
