import { SnapshotMetric } from '../collectMetric';

export const firstSample: SnapshotMetric = {
    label: 'first',
    createdAt: new Date('2009-01-03T00:00:00Z'),
    items: [
        {
            address: 'EQBGhqLAZseEqRXz4ByFPTGV7SVMlI4hrbs-Sps_Xzx01x8G',
            codeHash: '0x5fc55c8d22a55f374ec0042a51d150c8fc3570025c7cea2abfb87d45deb2f0e8',
            contractName: 'SampleBench',
            methodName: 'sendDeploy',
            receiver: 'external-in',
            opCode: '0x0',
            execute: {
                compute: {
                    type: 'vm',
                    success: true,
                    gasUsed: 1937,
                    exitCode: 0,
                    vmSteps: 50,
                },
                action: {
                    success: true,
                    totalActions: 1,
                    skippedActions: 0,
                    resultCode: 0,
                    totalActionFees: 1,
                    totalFwdFees: 1188400,
                    totalMessageSize: {
                        cells: 10,
                        bits: 1782,
                    },
                },
            },
            message: {
                in: {
                    cells: 12,
                    bits: 2043,
                },
                out: {
                    cells: 11,
                    bits: 1789,
                },
            },
            state: {
                code: {
                    cells: 8,
                    bits: 1007,
                },
                data: {
                    cells: 1,
                    bits: 64,
                },
            },
        },
        {
            address: 'EQDGEWjgHrhKsOGg2cTKHsALxSnelaY76gbs2pGSkaigKU-I',
            codeHash: '0x5fc55c8d22a55f374ec0042a51d150c8fc3570025c7cea2abfb87d45deb2f0e8',
            contractName: 'SampleBench',
            methodName: 'send',
            receiver: 'internal',
            opCode: '0x0',
            execute: {
                compute: {
                    type: 'vm',
                    success: true,
                    gasUsed: 641,
                    exitCode: 0,
                    vmSteps: 11,
                },
                action: {
                    success: true,
                    totalActions: 0,
                    skippedActions: 0,
                    resultCode: 0,
                    totalActionFees: 0,
                    totalMessageSize: {
                        cells: 0,
                        bits: 0,
                    },
                },
            },
            message: {
                in: {
                    cells: 10,
                    bits: 1782,
                },
                out: {
                    cells: 0,
                    bits: 0,
                },
            },
            state: {
                code: {
                    cells: 8,
                    bits: 1007,
                },
                data: {
                    cells: 1,
                    bits: 64,
                },
            },
        },
        {
            testName: 'SampleBench tolk - should sent incrAction',
            address: 'EQABEq658dLg1KxPhXZxj0vapZMNYevotqeINH786lpwwSnT',
            codeHash: '0x5fc55c8d22a55f374ec0042a51d150c8fc3570025c7cea2abfb87d45deb2f0e8',
            contractName: 'SampleBench',
            methodName: 'sendIncrAction',
            receiver: 'external-in',
            opCode: '0x0',
            execute: {
                compute: {
                    type: 'vm',
                    success: true,
                    gasUsed: 1937,
                    exitCode: 0,
                    vmSteps: 50,
                },
                action: {
                    success: true,
                    totalActions: 1,
                    skippedActions: 0,
                    resultCode: 0,
                    totalActionFees: 1,
                    totalFwdFees: 400000,
                    totalMessageSize: {
                        cells: 1,
                        bits: 809,
                    },
                },
            },
            message: {
                in: {
                    cells: 3,
                    bits: 1070,
                },
                out: {
                    cells: 2,
                    bits: 816,
                },
            },
            state: {
                code: {
                    cells: 8,
                    bits: 1007,
                },
                data: {
                    cells: 1,
                    bits: 64,
                },
            },
        },
        {
            testName: 'SampleBench tolk - should sent incrAction',
            address: 'EQDGEWjgHrhKsOGg2cTKHsALxSnelaY76gbs2pGSkaigKU-I',
            codeHash: '0x5fc55c8d22a55f374ec0042a51d150c8fc3570025c7cea2abfb87d45deb2f0e8',
            contractName: 'SampleBench',
            receiver: 'internal',
            opCode: '0x49533468',
            execute: {
                compute: {
                    type: 'vm',
                    success: true,
                    gasUsed: 2787,
                    exitCode: 0,
                    vmSteps: 62,
                },
                action: {
                    success: true,
                    totalActions: 0,
                    skippedActions: 0,
                    resultCode: 0,
                    totalActionFees: 0,
                    totalMessageSize: {
                        cells: 0,
                        bits: 0,
                    },
                },
            },
            message: {
                in: {
                    cells: 1,
                    bits: 809,
                },
                out: {
                    cells: 0,
                    bits: 0,
                },
            },
            state: {
                code: {
                    cells: 8,
                    bits: 1007,
                },
                data: {
                    cells: 1,
                    bits: 64,
                },
            },
            methodName: 'Incr',
        },
        {
            testName: 'SampleBench tolk - should sent sendDecrAction',
            address: 'EQABEq658dLg1KxPhXZxj0vapZMNYevotqeINH786lpwwSnT',
            codeHash: '0x5fc55c8d22a55f374ec0042a51d150c8fc3570025c7cea2abfb87d45deb2f0e8',
            contractName: 'SampleBench',
            methodName: 'sendDecrAction',
            receiver: 'external-in',
            opCode: '0x0',
            execute: {
                compute: {
                    type: 'vm',
                    success: true,
                    gasUsed: 1937,
                    exitCode: 0,
                    vmSteps: 50,
                },
                action: {
                    success: true,
                    totalActions: 1,
                    skippedActions: 0,
                    resultCode: 0,
                    totalActionFees: 1,
                    totalFwdFees: 400000,
                    totalMessageSize: {
                        cells: 1,
                        bits: 809,
                    },
                },
            },
            message: {
                in: {
                    cells: 3,
                    bits: 1070,
                },
                out: {
                    cells: 2,
                    bits: 816,
                },
            },
            state: {
                code: {
                    cells: 8,
                    bits: 1007,
                },
                data: {
                    cells: 1,
                    bits: 64,
                },
            },
        },
        {
            testName: 'SampleBench tolk - should sent sendDecrAction',
            address: 'EQDGEWjgHrhKsOGg2cTKHsALxSnelaY76gbs2pGSkaigKU-I',
            codeHash: '0x5fc55c8d22a55f374ec0042a51d150c8fc3570025c7cea2abfb87d45deb2f0e8',
            contractName: 'SampleBench',
            receiver: 'internal',
            opCode: '0xee52db3',
            execute: {
                compute: {
                    type: 'vm',
                    success: true,
                    gasUsed: 2885,
                    exitCode: 0,
                    vmSteps: 66,
                },
                action: {
                    success: true,
                    totalActions: 0,
                    skippedActions: 0,
                    resultCode: 0,
                    totalActionFees: 0,
                    totalMessageSize: {
                        cells: 0,
                        bits: 0,
                    },
                },
            },
            message: {
                in: {
                    cells: 1,
                    bits: 809,
                },
                out: {
                    cells: 0,
                    bits: 0,
                },
            },
            state: {
                code: {
                    cells: 8,
                    bits: 1007,
                },
                data: {
                    cells: 1,
                    bits: 64,
                },
            },
            methodName: 'Decr',
        },
    ],
};

export const currentSample: SnapshotMetric = {
    label: 'current',
    createdAt: new Date('2009-01-04T00:00:00Z'),
    items: [
        {
            address: 'EQBGhqLAZseEqRXz4ByFPTGV7SVMlI4hrbs-Sps_Xzx01x8G',
            codeHash: '0x782efbe3126d142429d8e9623c2203f547a64e760ecfcd8f13bea0a4c2837183',
            contractName: 'SampleBench',
            methodName: 'sendDeploy',
            receiver: 'external-in',
            opCode: '0x0',
            execute: {
                compute: {
                    type: 'vm',
                    success: true,
                    gasUsed: 1937,
                    exitCode: 0,
                    vmSteps: 50,
                },
                action: {
                    success: true,
                    totalActions: 1,
                    skippedActions: 0,
                    resultCode: 0,
                    totalActionFees: 1,
                    totalFwdFees: 1169200,
                    totalMessageSize: {
                        cells: 10,
                        bits: 1734,
                    },
                },
            },
            message: {
                in: {
                    cells: 12,
                    bits: 1995,
                },
                out: {
                    cells: 11,
                    bits: 1741,
                },
            },
            state: {
                code: {
                    cells: 8,
                    bits: 959,
                },
                data: {
                    cells: 1,
                    bits: 64,
                },
            },
        },
        {
            address: 'EQDb7PATzmb3IOrm2OS3Exh3r3jtjvq79e5ThiKsp-iBdwIC',
            codeHash: '0x782efbe3126d142429d8e9623c2203f547a64e760ecfcd8f13bea0a4c2837183',
            contractName: 'SampleBench',
            methodName: 'send',
            receiver: 'internal',
            opCode: '0x0',
            execute: {
                compute: {
                    type: 'vm',
                    success: true,
                    gasUsed: 589,
                    exitCode: 0,
                    vmSteps: 9,
                },
                action: {
                    success: true,
                    totalActions: 0,
                    skippedActions: 0,
                    resultCode: 0,
                    totalActionFees: 0,
                    totalMessageSize: {
                        cells: 0,
                        bits: 0,
                    },
                },
            },
            message: {
                in: {
                    cells: 10,
                    bits: 1734,
                },
                out: {
                    cells: 0,
                    bits: 0,
                },
            },
            state: {
                code: {
                    cells: 8,
                    bits: 959,
                },
                data: {
                    cells: 1,
                    bits: 64,
                },
            },
        },
        {
            testName: 'SampleBench tolk - should sent incrAction',
            address: 'EQABEq658dLg1KxPhXZxj0vapZMNYevotqeINH786lpwwSnT',
            codeHash: '0x782efbe3126d142429d8e9623c2203f547a64e760ecfcd8f13bea0a4c2837183',
            contractName: 'SampleBench',
            methodName: 'sendIncrAction',
            receiver: 'external-in',
            opCode: '0x0',
            execute: {
                compute: {
                    type: 'vm',
                    success: true,
                    gasUsed: 1937,
                    exitCode: 0,
                    vmSteps: 50,
                },
                action: {
                    success: true,
                    totalActions: 1,
                    skippedActions: 0,
                    resultCode: 0,
                    totalActionFees: 1,
                    totalFwdFees: 400000,
                    totalMessageSize: {
                        cells: 1,
                        bits: 809,
                    },
                },
            },
            message: {
                in: {
                    cells: 3,
                    bits: 1070,
                },
                out: {
                    cells: 2,
                    bits: 816,
                },
            },
            state: {
                code: {
                    cells: 8,
                    bits: 959,
                },
                data: {
                    cells: 1,
                    bits: 64,
                },
            },
        },
        {
            testName: 'SampleBench tolk - should sent incrAction',
            address: 'EQDb7PATzmb3IOrm2OS3Exh3r3jtjvq79e5ThiKsp-iBdwIC',
            codeHash: '0x782efbe3126d142429d8e9623c2203f547a64e760ecfcd8f13bea0a4c2837183',
            contractName: 'SampleBench',
            receiver: 'internal',
            opCode: '0x49533468',
            execute: {
                compute: {
                    type: 'vm',
                    success: true,
                    gasUsed: 2743,
                    exitCode: 0,
                    vmSteps: 60,
                },
                action: {
                    success: true,
                    totalActions: 0,
                    skippedActions: 0,
                    resultCode: 0,
                    totalActionFees: 0,
                    totalMessageSize: {
                        cells: 0,
                        bits: 0,
                    },
                },
            },
            message: {
                in: {
                    cells: 1,
                    bits: 809,
                },
                out: {
                    cells: 0,
                    bits: 0,
                },
            },
            state: {
                code: {
                    cells: 8,
                    bits: 959,
                },
                data: {
                    cells: 1,
                    bits: 64,
                },
            },
            methodName: 'Incr',
        },
        {
            testName: 'SampleBench tolk - should sent sendDecrAction',
            address: 'EQABEq658dLg1KxPhXZxj0vapZMNYevotqeINH786lpwwSnT',
            codeHash: '0x782efbe3126d142429d8e9623c2203f547a64e760ecfcd8f13bea0a4c2837183',
            contractName: 'SampleBench',
            methodName: 'sendDecrAction',
            receiver: 'external-in',
            opCode: '0x0',
            execute: {
                compute: {
                    type: 'vm',
                    success: true,
                    gasUsed: 1937,
                    exitCode: 0,
                    vmSteps: 50,
                },
                action: {
                    success: true,
                    totalActions: 1,
                    skippedActions: 0,
                    resultCode: 0,
                    totalActionFees: 1,
                    totalFwdFees: 400000,
                    totalMessageSize: {
                        cells: 1,
                        bits: 809,
                    },
                },
            },
            message: {
                in: {
                    cells: 3,
                    bits: 1070,
                },
                out: {
                    cells: 2,
                    bits: 816,
                },
            },
            state: {
                code: {
                    cells: 8,
                    bits: 959,
                },
                data: {
                    cells: 1,
                    bits: 64,
                },
            },
        },
        {
            testName: 'SampleBench tolk - should sent sendDecrAction',
            address: 'EQDb7PATzmb3IOrm2OS3Exh3r3jtjvq79e5ThiKsp-iBdwIC',
            codeHash: '0x782efbe3126d142429d8e9623c2203f547a64e760ecfcd8f13bea0a4c2837183',
            contractName: 'SampleBench',
            receiver: 'internal',
            opCode: '0xee52db3',
            execute: {
                compute: {
                    type: 'vm',
                    success: true,
                    gasUsed: 2820,
                    exitCode: 0,
                    vmSteps: 64,
                },
                action: {
                    success: true,
                    totalActions: 0,
                    skippedActions: 0,
                    resultCode: 0,
                    totalActionFees: 0,
                    totalMessageSize: {
                        cells: 0,
                        bits: 0,
                    },
                },
            },
            message: {
                in: {
                    cells: 1,
                    bits: 809,
                },
                out: {
                    cells: 0,
                    bits: 0,
                },
            },
            state: {
                code: {
                    cells: 8,
                    bits: 959,
                },
                data: {
                    cells: 1,
                    bits: 64,
                },
            },
            methodName: 'Decr',
        },
    ],
};

export const sampleList: SnapshotMetric[] = [firstSample, currentSample];
