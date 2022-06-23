const { test, solo } = require('brittle') // eslint-disable-line
const sodium = require('sodium-native')
const SerialSigner = require('../')

test('signature is valid', async ({ assert, teardown }) => {
    const signer = new SerialSigner('/dev/ttyUSB0')
    await signer.ready()
    const pk = await signer.publicKey()
    const message = Buffer.from('hello world')
    const signature = await signer.sign(message)
    assert.ok(sodium.crypto_sign_verify_detached(signature, message, pk))

    teardown(async () => {
        await signer.close()
    })
})
