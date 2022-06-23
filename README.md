# Serial-signer

Serialport communication module for [esp32-crypto-signer](https://github.com/rafapaezbas/esp32-crypto-signer)

## Usage

```js
    const signer = new SerialSigner('/dev/ttyUSB0')
    await signer.ready()
    const pk = await signer.publicKey()
    const message = Buffer.from('hello world')
    const signature = await signer.sign(message)
    assert.ok(sodium.crypto_sign_verify_detached(signature, message, pk))
```
