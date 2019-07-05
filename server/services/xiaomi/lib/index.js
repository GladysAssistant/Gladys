const { Hub } = require('node-xiaomi-smart-home');
const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');

// EVENTS
const { addSensorTh } = require('./event/xiaomi.addSensorTh');

// COMMANDS
const { getSensorTh } = require('./commands/xiaomi.getSensorTh');

/**
 * @param {Object} gladys - The gladys object.
 * @param {string} serviceId - Identification of the service.
 * @description Create all device if not exist by listening
 * @example
 * hubDiscover(gladys, serviceId)
 */
const XiaomiManager = function hubDiscover(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.sensorTh = [];
  // eslint-disable-next-line vars-on-top
  const xiaomi = new Hub();

  xiaomi.listen();

  // eslint-disable-next-line func-names
  xiaomi.on('error', function(e) {
    // eslint-disable-next-line no-console
    logger.debug(`${e}`);
  });

  // eslint-disable-next-line func-names
  xiaomi.on('data.weather', this.addSensorTh.bind(this));
}

// EVENTS
XiaomiManager.prototype.addSensorTh = addSensorTh;

// COMMANDS
XiaomiManager.prototype.getSensorTh = getSensorTh;

module.exports = XiaomiManager;
