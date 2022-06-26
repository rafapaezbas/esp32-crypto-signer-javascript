const { test, solo } = require('brittle') // eslint-disable-line
const sodium = require('sodium-native')
const SerialSigner = require('../')

const signer = new SerialSigner('/dev/ttyUSB0')

test('consecutive synchrounous signatures', async ({ plan, assert, pass, teardown }) => {
  await signer.ready()
  const pk = await signer.publicKey()

  const numOfMessages = 20
  const messageByteLength = 256
  const messages = []

  plan(numOfMessages)

  for (let i = 0; i < numOfMessages; i++) {
    messages.push(Buffer.allocUnsafe(messageByteLength))
  }

  const signatures = await Promise.all(messages.map(m => signer.sign(m)))

  signatures.forEach((s, i) => {
    assert.ok(sodium.crypto_sign_verify_detached(s, messages[i], pk))
  })
})

test('signature and scalarmult', async ({ plan, assert, pass, teardown }) => {
  await signer.ready()
  plan(2)

  const pk = await signer.publicKey()
  const message = Buffer.allocUnsafe(256)
  const signature = await signer.sign(message)

  await signer.dh(pk)

  assert.ok(sodium.crypto_sign_verify_detached(signature, message, pk))

  pass()

  signer.close()
})
