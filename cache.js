require('dotenv').config();
const Redis = require('ioredis');
const { REDIS_URL } = process.env;
console.log("REDIS:", REDIS_URL);
const redis = new Redis(`${REDIS_URL}`);

class Cache {
    async get(key) {
        if (!key.startsWith('jig://') && !key.startsWith('berry://') && !key.startsWith('gop://')) return;

        let valueString = await redis.get(key);
        if (valueString) {
            return JSON.parse(valueString);
        }
    }

    async set(key, value) {
        if (!key.startsWith('jig://') && !key.startsWith('berry://') && !key.startsWith('gop://')) return;

        const valueString = JSON.stringify(value);
        await redis.set(key, valueString);
    }
}

module.exports = Cache;
