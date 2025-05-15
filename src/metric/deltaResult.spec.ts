import { aggregatedCompareMetric, makeGasReport } from './deltaResult';
import { zero, one, oneFirst, zeroFirst, oneSecond, zeroSecond } from './fixtures/data.fixture';
import { sampleList } from './fixtures/snapshot.fixture';
import complexList from './fixtures/complex.fixture';

describe('deltaResult', () => {
    describe('aggregatedCompareMetric', () => {
        it('diff metric should be same zero', () => {
            const actual = aggregatedCompareMetric(zero, zero);
            expect(Object.keys(actual).length).toEqual(36);
            expect(actual).toMatchSnapshot();
        });

        it('diff metric should be same one', () => {
            const actual = aggregatedCompareMetric(one, one);
            expect(Object.keys(actual).length).toEqual(36);
            expect(actual).toMatchSnapshot();
        });

        it('diff metric should be increase', () => {
            const actual = aggregatedCompareMetric(zero, one);
            expect(Object.keys(actual).length).toEqual(36);
            expect(actual).toMatchSnapshot();
        });

        it('diff metric should be decrease', () => {
            const actual = aggregatedCompareMetric(one, zero);
            expect(Object.keys(actual).length).toEqual(36);
            expect(actual).toMatchSnapshot();
        });

        it('not pair should be skip', () => {
            delete one.execute.action;
            const actual = aggregatedCompareMetric(one, zero);
            expect(Object.keys(actual).length).toEqual(29);
        });
    });

    describe('makeGasReport', () => {
        it('makeGasReport only after', () => {
            const actual = makeGasReport([oneFirst]);
            expect(actual).toMatchSnapshot();
        });

        it('makeGasReport same', () => {
            const actual = makeGasReport([oneSecond, oneFirst]);
            expect(actual).toMatchSnapshot();
        });

        it('makeGasReport increase', () => {
            const actual = makeGasReport([zeroSecond, oneFirst]);
            expect(actual).toMatchSnapshot();
        });

        it('makeGasReport decrease', () => {
            const actual = makeGasReport([oneSecond, zeroFirst]);
            expect(actual).toMatchSnapshot();
        });

        it('makeGasReport sample', () => {
            const actual = makeGasReport(sampleList);
            expect(actual).toMatchSnapshot();
        });

        it('makeGasReport complex', () => {
            const actual = makeGasReport(complexList);
            expect(actual).toMatchSnapshot();
        });
    });
});
