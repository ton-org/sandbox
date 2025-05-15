import { gasReportTable } from './gasReportTable';
import { oneFirst, oneSecond, zeroFirst } from './fixtures/data.fixture';
import { DeltaResult, makeGasReport } from './deltaResult';
import { sampleList } from './fixtures/snapshot.fixture';
import complexList from './fixtures/complex.fixture';

describe('gasReportTable', () => {
    it.each([
        { list: new Array<DeltaResult>() },
        {
            list: [
                {
                    label: 'empty',
                    createdAt: new Date('2009-01-03T00:00:00Z'),
                    result: {},
                } as DeltaResult,
            ],
        },
        {
            list: [
                {
                    label: 'empty',
                    createdAt: new Date('2009-01-03T00:00:00Z'),
                    result: { contractName: {} },
                },
            ],
        },
    ])('empty data', (data) => {
        const actual = gasReportTable(data.list);
        expect(actual).toEqual('No data available');
    });

    it('table single result', () => {
        const actual = gasReportTable(makeGasReport([oneFirst]));
        expect(actual).toMatchSnapshot();
    });

    it('table delta result same', () => {
        const actual = gasReportTable(makeGasReport([oneSecond, oneFirst]));
        expect(actual).toMatchSnapshot();
    });

    it('table delta result increase', () => {
        const actual = gasReportTable(makeGasReport([oneSecond, zeroFirst]));
        expect(actual).toMatchSnapshot();
    });

    it('table sample', () => {
        const actual = gasReportTable(makeGasReport(sampleList));
        expect(actual).toMatchSnapshot();
    });

    it('table complex', () => {
        const actual = gasReportTable(makeGasReport(complexList));
        expect(actual).toMatchSnapshot();
    });
});
