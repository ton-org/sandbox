import { table, TableUserConfig, ColumnUserConfig, SpanningCellConfig } from 'table';
import { ColorDelta, DeltaResult, toFlatDeltaResult } from './deltaResult';
import { sortByCreatedAt } from './collectMetric';

const gapCellWidth = 1;
const maxCellWidth = 25;
const border = {
    topBody: '─',
    topJoin: '┬',
    topLeft: '┌',
    topRight: '┐',
    bottomBody: '─',
    bottomJoin: '┴',
    bottomLeft: '└',
    bottomRight: '┘',
    bodyLeft: '│',
    bodyRight: '│',
    bodyJoin: '│',
    joinBody: '─',
    joinLeft: '├',
    joinRight: '┤',
    joinJoin: '┼',
};

function wrap(value: string, max: number) {
    if (value.length > max) {
        return `${value.slice(0, max - 3)}...`;
    }
    return value;
}

function prepareResult(list: DeltaResult[], color?: ColorDelta) {
    list = list.sort(sortByCreatedAt(true));

    const flat = toFlatDeltaResult(list);
    const rows: string[][] = [];
    const widthCols: number[] = [];

    for (const [contract, method, ...values] of flat.rows) {
        const row: string[] = [wrap(contract, maxCellWidth), wrap(method, maxCellWidth)];
        widthCols[0] = Math.max(widthCols[0] ?? 0, row[0].length);
        widthCols[1] = Math.max(widthCols[1] ?? 0, row[1].length);
        values.forEach((metric, idx) => {
            const value = color ? color(metric) : metric.value;
            row.push(value);
            const colIdx = idx + 2;
            widthCols[colIdx] = Math.max(widthCols[colIdx] ?? 0, metric.value.length);
        });
        rows.push(row);
    }
    const headers = flat.header;
    for (let i = 0; i < headers.length; i++) {
        widthCols[i] = Math.max(widthCols[i] ?? 0, headers[i].length + gapCellWidth);
    }
    const groupIndex: Record<string, { index: number; size: number }> = {};
    let current = 0;
    while (current < rows.length) {
        const contract = rows[current][0];
        let count = 1;
        while (rows[current + count]?.[0] === contract) {
            count++;
        }
        groupIndex[contract] = { index: current, size: count };
        current += count;
    }

    return {
        labels: list.map((s) => s.label),
        headers,
        widthCols,
        rows,
        groupIndex,
    };
}

export function gasReportTable(list: DeltaResult[], color?: ColorDelta) {
    const result = prepareResult(list, color);
    if (result.rows.length < 1) {
        return 'No data available';
    }
    const columns: ColumnUserConfig[] = [];
    for (let i = 0; i < result.headers.length; i++) {
        columns.push({ alignment: 'center', verticalAlignment: 'middle', width: result.widthCols[i] });
    }
    const spanningCells: SpanningCellConfig[] = [
        { col: 0, row: 0, rowSpan: 2, verticalAlignment: 'middle' }, // Contract title
        { col: 1, row: 0, rowSpan: 2, verticalAlignment: 'middle' }, // Method title
    ];
    for (const group of Object.values(result.groupIndex)) {
        // rowSpan for Contract name
        spanningCells.push({ col: 0, row: group.index + 2, rowSpan: group.size, verticalAlignment: 'middle' });
    }
    const data: string[][] = [[], ['', '']];
    data[0].push(...result.headers.slice(0, 2));
    data[1].push(...result.headers.slice(2));
    const metricCount = (result.headers.length - 2) / list.length;
    let labelTitleOffset = 2;
    for (const label of result.labels) {
        spanningCells.push({
            col: labelTitleOffset,
            row: 0,
            colSpan: metricCount,
            verticalAlignment: 'middle',
        });
        labelTitleOffset += metricCount;
        data[0].push(...[label, ...Array.from({ length: metricCount - 1 }, () => '')]);
    }
    data.push(...result.rows);
    const config: TableUserConfig = {
        columns,
        spanningCells,
        border,
    };
    return table(data, config);
}
