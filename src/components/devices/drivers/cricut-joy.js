const BaseDriver = require('../BaseDriver');

class CricutJoyDriver extends BaseDriver {
  constructor() {
    super();
    this.id = 'cricut-joy';
    this.name = 'Cricut Joy';
    this.supportedModels = ['Joy'];
  }

  async connect(options) {
    this.connected = true;
    return { ok: true, model: this.supportedModels[0] };
  }

  async disconnect() {
    this.connected = false;
    return { ok: true };
  }
}

module.exports = new CricutJoyDriver();
