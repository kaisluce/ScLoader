const { randomUUID } = require('crypto')
const { EventEmitter } = require('events')

const MAX_ENTRIES = 500

class Logger extends EventEmitter {
  constructor() {
    super()
    this._logs = []
  }

  log(level, message) {
    const entry = {
      id: randomUUID(),
      timestamp: new Date(),
      level,
      message,
    }

    this._logs.push(entry)
    if (this._logs.length > MAX_ENTRIES) {
      this._logs.shift()
    }

    this.emit('log', entry)
    return entry
  }

  getLogs() {
    return [...this._logs]
  }

  clearLogs() {
    this._logs = []
    this.emit('clear')
  }
}

// Singleton
const logger = new Logger()

module.exports = logger
