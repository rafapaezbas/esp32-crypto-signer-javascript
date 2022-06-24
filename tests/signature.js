const { test, solo } = require('brittle') // eslint-disable-line
const sodium = require('sodium-native')
const SerialSigner = require('../')

test('signature and scalarmult', async ({ assert, pass, teardown }) => {
  const signer = new SerialSigner('/dev/ttyUSB0')
  await signer.ready()
  const pk = await signer.publicKey()

  const message = Buffer.allocUnsafe(256)
  const signature = await signer.sign(message)
  assert.ok(sodium.crypto_sign_verify_detached(signature, message, pk))

  await signer.dh(pk)
  pass()

  teardown(async () => {
    await signer.close()
  })
})
