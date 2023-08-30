
## Overview

By default, for projects created with Sandbox(create-ton contructor) contract test template generates. Examples of tests based on [fireworks.tact](https://github.com/reveloper/tact-fireworks/blob/main/contracts/fireworks.tact) contract.


```typescript
import ...

describe('Fireworks', () => {
....
        

        expect(deployResult.transactions).toHaveTransaction({
...
        });
    
});
```

### Transaction Success Test

```typescript

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and fireworks are ready to use
    });

    it('should launch fireworks', async () => {

            const launcherWallet = await blockchain.treasury('fireworks');
            console.log('launcherWallet = ', launcherWallet.address);
            console.log('Fireworks = ', fireworks.address);


            const launchResult = await fireworks.send(
                launcherWallet.getSender(),
                {
                    value: toNano('1'),
                },
                {
                    $$type: 'Launch',
                }
            );

            expect(launchResult.transactions).toHaveTransaction({
                from: launcherWallet.address,
                to: fireworks.address,
                success: true,
            });

            //const counterAfter = await fireworks.getCounter();

            console.log('launcher transaction details', printTransactionFees(launchResult.transactions));

    });
    
```


### Account Status Tests

```typescript

    it('should destroy after launching', async () => {

        const launcherWallet = await blockchain.treasury('fireworks');

        const launchResult = await fireworks.send(
            launcherWallet.getSender(),
            {
                value: toNano('1'),
            },
            {
                $$type: 'Launch',
            }
        );

        expect(launchResult.transactions).toHaveTransaction({
            from: launcherWallet.address,
            to: fireworks.address,
            success: true,
            endStatus: 'non-existing',
            destroyed: true
        });

    });
    
```


### Operation Code Tests

```typescript



    it('should be correct Launch op code for the launching', async () => {

        const launcherWallet = await blockchain.treasury('fireworks');

        const launchResult = await fireworks.send(
            launcherWallet.getSender(),
            {
                value: toNano('1'),
            },
            {
                $$type: 'Launch',
            }
        );

        expect(launchResult.transactions).toHaveTransaction({
            from: launcherWallet.address,
            to: fireworks.address,
            success: true,
            op: 0xa911b47f

        });

    });
```


### Message Counter Tests

```typescript
    it('should send 4 messages to wallet', async() => {

        const launcherWallet = await blockchain.treasury('fireworks');

        const launchResult = await fireworks.send(
            launcherWallet.getSender(),
            {
                value: toNano('1'),
            },
            {
                $$type: 'Launch',
            }
        );

        expect(launchResult.transactions).toHaveTransaction({
            from: launcherWallet.address,
            to: fireworks.address,
            success: true,
            outMessagesCount: 4
        });
    })
```


### Multi Transaction and Payload Tests

```typescript

    it('fireworks contract should send msgs with comments', async() => {

        const launcherWallet = await blockchain.treasury('fireworks');

        const launchResult = await fireworks.send(
            launcherWallet.getSender(),
            {
                value: toNano('1'),
            },
            {
                $$type: 'Launch',
            }
        );


        expect(launchResult.transactions).toHaveTransaction({
            from: fireworks.address,
            to: launcherWallet.address,
            success: true,
            op: 0x00000000, // 0x00000000 - comment op code
            body: beginCell().storeUint(0,32).storeStringTail("send mode = 0").endCell()

        });

            expect(launchResult.transactions).toHaveTransaction({
            from: fireworks.address,
            to: launcherWallet.address,
            success: true,
            op: 0x00000000, // 0x00000000 - comment op code
            body: beginCell().storeUint(0,32).storeStringTail("send mode = 1").endCell()
        });

        expect(launchResult.transactions).toHaveTransaction({
            from: fireworks.address,
            to: launcherWallet.address,
            success: true,
            op: 0x00000000, // 0x00000000 - comment op code
            body: beginCell().storeUint(0,32).storeStringTail("send mode = 2").endCell()
        });

        expect(launchResult.transactions).toHaveTransaction({
            from: fireworks.address,
            to: launcherWallet.address,
            success: true,
            op: 0x00000000, // 0x00000000 - comment op code
            body: beginCell().storeUint(0,32).storeStringTail("send mode = 128 + 32").endCell()
        });
    })
    
```


### Transaction Fees Tests

```typescript

    it('should be executed with expected fees', async() => {

        const launcherWallet = await blockchain.treasury('fireworks');

        const launchResult = await fireworks.send(
            launcherWallet.getSender(),
            {
                value: toNano('1'),
            },
            {
                $$type: 'Launch',
            }
        );

        console.log(printTransactionFees(launchResult.transactions));

        //totalFee
        console.log('total fees = ', launchResult.transactions[1].totalFees);

        const tx1 = launchResult.transactions[1];
        if (tx1.description.type !== 'generic') {
            throw new Error('Generic transaction expected');
        }

        //computeFee
        const computeFee = tx1.description.computePhase.type === 'vm' ? tx1.description.computePhase.gasFees : undefined;
        console.log('computeFee = ', computeFee);

        //actionFee
        const actionFee = tx1.description.actionPhase?.totalActionFees;
        console.log('actionFee = ', actionFee);

        //The check, if Compute Phase fees exceed 1 TON
        expect(computeFee).toBeLessThan(toNano('1'));


    });



```



