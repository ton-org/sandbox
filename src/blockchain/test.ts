import {Blockchain} from "./Blockchain";
import {WalletContract} from "ton";


class SingleNft {



    static init({}) {

    }

    transfer() {
        // this.provider.
    }
}
async function main() {
    let blkch = Blockchain.create()

    let wallet = blkch.openWallet('test', 1000n)
    let wallet2 = blkch.openWallet('test2', 1000n)

    let collection = blkch.deploy(NftCollection.init({ wc: 0, owner: wallet.address }))

    let res = collection.mint()

    expect(res).toMatch(
        transaction()
            .withDeploy({ from,  to,  })
            .withMessage({ })//
    )

    // wallet.address
    // wallet.sendMessage

}

main()