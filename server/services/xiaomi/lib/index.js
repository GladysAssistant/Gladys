const { Hub } = require('node-xiaomi-smart-home');
const logger = require('../../../utils/logger');

// EVENTS
const { addSensorTh } = require('./event/xiaomi.addSensorTh');
const { addSensorMagnet } = require('./event/xiaomi.addSensorMagnet');

// COMMANDS
const { getSensorTh } = require('./commands/xiaomi.getSensorTh');
const { getSensorMagnet } = require('./commands/xiaomi.getSensorMagnet');

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
  this.sensorTh = {};
  this.sensorMagnet = {};
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
  xiaomi.on('data.magnet', this.addSensorMagnet.bind(this));
};

// EVENTS
XiaomiManager.prototype.addSensorTh = addSensorTh;
XiaomiManager.prototype.addSensorMagnet = addSensorMagnet;

// COMMANDS
XiaomiManager.prototype.getSensorTh = getSensorTh;
XiaomiManager.prototype.getSensorMagnet = getSensorMagnet;

module.exports = XiaomiManager;
