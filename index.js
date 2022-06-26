const { once } = require('events')
const { SerialPort } = require('serialport')

const SIGNATURE_LENGTH = 64
const PK_LENGTH = 32
const DH_LENGTH = 32
const PK_HEADER = '__public_key__'
const DH_HEADER = '__dh__'

let buffer = Buffer.alloc(0)

module.exports = class SerialSigner {
  constructor (port) {
    this.serialport = new SerialPort({ path: port, baudRate: 115200 })
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

    const nextMessage = () => {
      buffer = Buffer.alloc(0)
      if (next) this.serialport.write(next.message)
      this.queue.shift()
    }

    if (buffer.length === first.responseLength) {
      first.resolve(buffer)
      nextMessage()
    } else if (buffer.length > first.responseLength) {
      first.reject('Error in reading. Buffer size too large.')
      nextMessage()
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
    return this._request(PK_HEADER, PK_LENGTH)
  }

  async dh (key) {
    return this._request(DH_HEADER + key, DH_LENGTH)
  }

  async close () {
    return new Promise(resolve => this.serialport.close(() => resolve))
  }
}
