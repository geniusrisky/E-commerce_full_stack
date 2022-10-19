const { createClient } = require("redis");
const env = require('./../environment/config.env')

try {
    const client = createClient({
        url: `redis://${env.redis.username}:${env.redis.password}@${env.redis.host}:${env.redis.port}`
    });

    client.connect()
        .then(_ => console.log("✅ Redis is connected!"))
        .catch(e => console.log("⚠️ Redis Error: ", e.message));

    module.exports = client

} catch (e) {
    console.log(e)
}

/*
    const s = await client.setEx('key', 60, 'value')
    const s = await client.set('key', 'value')
    const s = await client.get('key')
*/