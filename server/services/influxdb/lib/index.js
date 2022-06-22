const { init } = require('./influxdb.init');
const { write } = require('./influxdb.write');
const { listen } = require('./influxdb.listen');
const { getConfiguration } = require('./influxdb.getConfiguration');
const { saveConfiguration } = require('./influxdb.saveConfiguration');

/**
 * @param {Object} gladys - The gladys object.
 * @param {string} serviceId - Identification of the service.
 * @description This function starts the InfluxDB service.
 * @example
 * InfluxdbManager(gladys, serviceId)
 */
const InfluxdbManager = function InfluxdbManager(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.configured = false;
};
InfluxdbManager.prototype.init = init;
InfluxdbManager.prototype.write = write;
InfluxdbManager.prototype.listen = listen;
InfluxdbManager.prototype.getConfiguration = getConfiguration;
InfluxdbManager.prototype.saveConfiguration = saveConfiguration;

module.exports = InfluxdbManager;
