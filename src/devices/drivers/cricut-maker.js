const CricutDriver = require('../CricutDriver');

class CricutMaker extends CricutDriver {
  constructor() {
    super();
    this.id = 'cricut-maker';
    this.name = 'Cricut Maker Series';
    this.supportedModels = ['Maker', 'Maker 2', 'Maker 3'];
  }
}

module.exports = CricutMaker;
