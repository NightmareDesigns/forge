class BaseDriver {
  constructor() {
    this.id = 'base';
    this.name = 'Base Device Driver';
    this.connected = false;
  }

  async connect(options) {
    this.connected = true;
    return { ok: true, message: 'Connected (base)'};
  }

  async disconnect() {
    this.connected = false;
    return { ok: true, message: 'Disconnected (base)'};
  }

  info() {
    return { id: this.id, name: this.name };
  }
}

module.exports = BaseDriver;
