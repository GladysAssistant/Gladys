const { getUpcoming } = require('./premieres.getUpcoming');
const { getProviders } = require('./premieres.getProviders');

const Premieres = function Premieres(service) {
  this.service = service;
};

Premieres.prototype.getUpcoming = getUpcoming;
Premieres.prototype.getProviders = getProviders;

module.exports = Premieres;
