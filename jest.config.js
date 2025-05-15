module.exports = {
    preset: 'ts-jest',
    testEnvironment: './jest-environment.js',
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/examples/'],
    reporters: [
        'default',
        ['./jest-reporter.js', {
            reportName: '.benchmark',
            mode: 'onlyMetric',
        }],
    ],
};
