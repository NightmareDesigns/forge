const CricutDriver = require('../CricutDriver');

class CricutExplore extends CricutDriver {
  constructor() {
    super();
    this.id = 'cricut-explore';
    this.name = 'Cricut Explore Series';
    this.supportedModels = ['Explore', 'Explore Air', 'Explore Air 2'];
  }
}

module.exports = CricutExplore;
