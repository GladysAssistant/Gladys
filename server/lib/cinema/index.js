const { getUpcoming } = require('./cinema.getUpcoming');
const { getProviders } = require('./cinema.getProviders');

const Cinema = function Cinema(service) {
  this.service = service;
};

Cinema.prototype.getUpcoming = getUpcoming;
Cinema.prototype.getProviders = getProviders;

module.exports = Cinema;
