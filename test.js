const fs = require('fs')
const Blockchain = require('./blockchain')
const Cache = require('./cache')
const Run = require('run-sdk')
const { Address } = require('@ts-bitcoin/core')

async function main() {
    const blockchain = new Blockchain()
    const cache = new Cache()
    const run  = new Run({ 
        network: 'main', 
        blockchain, 
        timeout: 600000,
        cache,
        trust: '*',
        state: new Run.plugins.LocalState(),
    })

    // const jig = await run.load('5dae7f3d2143bc6e5f0061c8367d2e592bf172e21dac7e429e4e18f7550d4837_o3')
    // console.log(jig)

    // fs.writeFileSync(`jigs/${jig.location}.json`, JSON.stringify({
    //     ...jig,
    //     constructor: {
    //         ...jig.constructor
    //     }
    // }, null, 2))
    
	const origins = ['0223aaaf78d5f37c75cf4f69c63f3dd35249578f0ab991464ace0a1a1dc88648',
'1d8ecc731ddce53b3f21584ffcc197a812d87ea81087a1f413a2ee0d75e3c91c',
'4114b574723d309bcb83657f80a0a2ef39ab2ebf63b4ed377b1e9037f68c34ff',
'61c87bfbcc8fac5f226f7eb6897684e000472efb2f1ac2d461ba64367d933705',
'81c0a2b73bda954538dfa0c1e47f0dc04e2887c9987542f1c83014299891ddff',
'a55e53ae66b425618776476424add8853ee9d8a35489bf84dd1082ae88c6c63d',
'aabb28cc4dcdfa25e454ecfd2990783c35544e5a9e72d87a40ac1eeffe99a28b',
'ae3392668f3474afde24ce666637668fc605d2c87065580f2c6e3f8a2a1cbfd5',
'b9b7eaab917638522f80ba722bcd74684027908b9ef16ca14ac49dcf312fd20b',
'e2267e10892d8d35451bc900dd2752fdfb7754c78858d5ce3adb6fe4c43953fb',
'fb381480a9576d3e6f9fd19c48b49b79258103496aa1db8aac8a996cad7ca811',
'fdc36647a015170fbbb8bf847869d176674fdb67ff056adf8f4c0c94bf52d51e']
	const file = "traits.txt"
	const contents = JSON.parse(fs.readFileSync(file))
	const start_offset = process.argv[2] | 0
	for (let i = start_offset; i < contents.length;i++){
		if (await cache.get("gop://"+contents[i].jig_txid) != undefined){
			
			console.log(i, await cache.get("gop://"+contents[i].jig_txid))
			
		}else{
			console.log(i, contents[i].jig_txid)
			const origin = await run.load(contents[i].jig_txid)
			console.log(origin)
			await origin.sync()
			
			console.log(origin)
			await cache.set("gop://"+origin.origin, origin)
		}
	}
	
	
	
    const utxos = await blockchain.utxos(Address.fromString('112KZhhnrK4b3La4sgBhzRtJmtomVtEa8e').toTxOutScript().toHex())
    console.log("utxos", utxos.length)
    const jigs = [];
    for (const utxo of utxos) {
        // if(utxo.value != 273) continue
        try {
            const jig = await run.load(`${utxo.txid}_o${utxo.vout}`)
            jigs.push(jig)
            console.log("jig", jig, "meta:", jig.constructor.metadata)
            fs.writeFileSync(`jigs/${jig.location}.json`, JSON.stringify({
                ...jig,
                constructor: {
                    ...jig.constructor
                }
            }, null, 2))
        } catch (e) {
            console.error(e)
        }
    }
}

main().catch(console.error).then(() => process.exit(0))