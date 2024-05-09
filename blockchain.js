require('dotenv').config();

const { Address, Script } = require('@ts-bitcoin/core');
require('isomorphic-fetch')

const Run = require('run-sdk');
const localCache = new Run.plugins.LocalCache({ maxSizeMB: 100 });

const Redis = require('ioredis');
const { REDIS_URL } = process.env;



console.log("REDIS:", REDIS_URL);
const redis = new Redis(`${REDIS_URL}`);
const fetched = []

async function searchForCacheKey(cacheKey){
	let out = await localCache.get(cacheKey);
	if (!out) {
		out = await redis.get(cacheKey);
	}
	if (!out) {
		return false
	}else{
		return out
	}
}

class Blockchain {
    network = 'main';

    async broadcast(rawtx) {
        throw new Error('Not Implemented');
    }

     async fetch(txid) {
        const cacheKey = `tx:${txid}`;
        // console.log('fetching', txid, cacheKey)
		let cached = await searchForCacheKey(cacheKey)
		let rawtx = cached
		if (!rawtx){
            const url = `https://junglebus.gorillapool.io/v1/transaction/get/${txid}/bin`
            // console.log('fetching', url)
            for (let i = 0; i < 5; i++) {
                try {
                    const resp = await fetch(url);
                    if (resp.status !== 200) {
                        throw new Error('Transaction not found');
                    }
                    rawtx = Buffer.from(await resp.arrayBuffer()).toString('hex');
                    break;
                } catch (e) {
                    if (i === 4) {
                        throw e;
                    }
                    // console.error(e);
                }
            }
            // const resp = await fetch(url);
            // if (resp.status !== 200) {
            //     throw new Error('Transaction not found');
            // }
            // rawtx = Buffer.from(await resp.arrayBuffer()).toString('hex');

            await redis.set(cacheKey, rawtx);
            localCache.set(cacheKey, rawtx);
			cached = rawtx
        }

        // console.log('fetched', txid, cacheKey, rawtx)
        return cached;
    }
    async time(txid) {
        throw new Error('Not Implemented');
    }

    async spends(txid, vout) {
		console.log(txid, vout)
		const cacheKey = `spends:${txid}_o${vout}`
		let cached = await searchForCacheKey(cacheKey)
		let spent_txid = cached
		if (!spent_txid){
			const resp = await fetch(`https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/${vout}/spent`);
			if (resp.status !== 200) {
				return ""
			}
			const spent_txid = (await resp.json()).txid;
			console.log("Spends: "+spent_txid)
			await redis.set(cacheKey, spent_txid);
            localCache.set(cacheKey, spent_txid);
			cached = spent_txid
		}	
		return cached
        
    }

    async utxos(scriptHex) {
		console.log(scriptHex)
		const cacheKey = `utxos:${scriptHex}`
		let cached = await searchForCacheKey(cacheKey)
		let utxos = cached
		if (!utxos){
			const script = Script.fromHex(scriptHex);
			const address = Address.fromTxOutScript(script);
			console.log(address)
			const resp = await fetch(`https://ordinals.gorillapool.io/api/txos/address/${address}/unspent`);
			if (resp.status !== 200) {	
				throw new Error('Transaction not found');
			}
			const utxos = await resp.json().map(u => ({
				txid: u.txid,
				vout: u.vout,
				value: u.satoshis,
				script: scriptHex,
			}));
			await redis.set(cacheKey,utxos);
            localCache.set(cacheKey, utxos);
		
			cached = utxos
		}
		return cached
    }
}

module.exports = Blockchain;
