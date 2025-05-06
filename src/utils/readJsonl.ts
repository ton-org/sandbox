import { createReadStream } from 'fs';
import { createInterface } from 'readline';

export async function readJsonl<T>(filePath: string): Promise<T[]> {
    const input = createReadStream(filePath, { encoding: 'utf8' });
    const readLine = createInterface({
        input,
        crlfDelay: Infinity,
    });
    const result: T[] = [];
    for await (const line of readLine) {
        if (!line.trim()) continue;
        try {
            result.push(JSON.parse(line) as T);
        } catch (_) {
            throw new Error(`Could not parse line: ${line}`);
        }
    }
    return result;
}
