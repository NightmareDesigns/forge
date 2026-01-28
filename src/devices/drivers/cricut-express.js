const CricutDriver = require('../CricutDriver');

class CricutExpress extends CricutDriver {
  constructor() {
    super();
    this.id = 'cricut-express';
    this.name = 'Cricut Express (Explore 3 / Maker 3 family)';
    this.supportedModels = ['Explore 3', 'Maker 3', 'Explore Air 3'];
  }
}

module.exports = CricutExpress;
