const { once } = require('events')
const { SerialPort } = require('serialport')

module.exports = class SerialSigner {
  constructor (port) {
    this.serialport = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 115200 })
    this.opened = false
    this.serialport.on('open', () => {
      this.opened = true
    })
  }

  async ready () {
    if (!this.opened) {
      return once(this.serialport, 'open')
    }
  }

  async sign (message) {
    this.serialport.write(message)
    let signature = Buffer.alloc(0)
    return new Promise(resolve => {
      this.serialport.on('data', (data) => {
        signature = Buffer.concat([signature, data])
        if (signature.length === 64) resolve(signature)
      })
    })
  }

  async publicKey () {
    this.serialport.write('__public_key__')
    let pk = Buffer.alloc(0)
    return new Promise(resolve => {
      this.serialport.on('data', (data) => {
        pk = Buffer.concat([pk, data])
        if (pk.length === 32) resolve(pk)
      })
    })
  }

  async dh (publicKey) {
    const header = Buffer.from('__dh__')
    this.serialport.write(Buffer.concat([header, publicKey]))
    let signature = Buffer.alloc(0)
    return new Promise(resolve => {
      this.serialport.on('data', (data) => {
        signature = Buffer.concat([signature, data])
        if (signature.length === 32) resolve(signature)
      })
    })
  }

  async close () {
    return new Promise(resolve => this.serialport.close(() => resolve))
  }
}
