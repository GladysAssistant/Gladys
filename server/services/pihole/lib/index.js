const { getPiholeSummary } = require('./getPiholeSummary');

/**
 * @description Get the pihole status.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const piholeHandler = new PiholeHandler(gladys, serviceId);
 */
const PiholeHandler = function PiholeHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

PiholeHandler.prototype.getPiholeSummary = getPiholeSummary;

module.exports = PiholeHandler;
