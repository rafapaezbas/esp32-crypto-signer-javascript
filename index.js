const { once } = require('events')
const { SerialPort } = require('serialport')

const SIGNATURE_LENGTH = 64
const PK_LENGTH = 32
const DH_LENGTH = 32

let buffer = Buffer.alloc(0)

module.exports = class SerialSigner {
  constructor (port) {
    this.serialport = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 115200 })
    this.opened = false
    this.processing = false
    this.queue = [] // FIFO messages queue
    this.serialport.on('open', () => {
      this.opened = true
    })
  }

  async ready () {
    if (!this.processing) {
      this.serialport.on('data', this._proccess.bind(this))
      this.processing = true
    }
    if (!this.opened) {
      return once(this.serialport, 'open')
    }
  }

  // process the messages sequencially
  _proccess (data) {
    buffer = Buffer.concat([buffer, data])
    const first = this.queue[0]
    const next = this.queue[1]
    if (buffer.length === first.responseLength) {
      first.resolve(buffer)
      buffer = Buffer.alloc(0)
      if (next) this.serialport.write(next.message)
      this.queue.shift()
    } else if (buffer.length > first.responseLength) {
      first.reject('Error in reading. Buffer size too large.')
      buffer = Buffer.alloc(0)
      if (next) this.serialport.write(next.message)
      this.queue.shift()
    }
  }

  _request (message, responseLength) {
    const promise = new Promise((resolve, reject) => {
      this.queue.push({ message, responseLength, resolve, reject })
    })
    if (this.queue.length === 1) this.serialport.write(message)
    return promise
  }

  async sign (message) {
    return this._request(message, SIGNATURE_LENGTH)
  }

  async publicKey () {
    return this._request('__public_key__', PK_LENGTH)
  }

  async dh (publicKey) {
    return this._request('__dh__', DH_LENGTH)
  }

  async close () {
    return new Promise(resolve => this.serialport.close(() => resolve))
  }
}
