const BaseDriver = require('../BaseDriver');

class CricutMaker3Driver extends BaseDriver {
  constructor() {
    super();
    this.id = 'cricut-maker-3';
    this.name = 'Cricut Maker 3';
    this.supportedModels = ['Maker 3'];
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

module.exports = new CricutMaker3Driver();
