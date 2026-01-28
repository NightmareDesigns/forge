const BaseDriver = require('../BaseDriver');

class CricutMakerDriver extends BaseDriver {
  constructor() {
    super();
    this.id = 'cricut-maker';
    this.name = 'Cricut Maker';
    this.supportedModels = ['Maker', 'Maker 2'];
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

module.exports = new CricutMakerDriver();
