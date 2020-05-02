const Bottleneck = require('bottleneck/es5');
const { discover } = require('./discover');
const { poll } = require('./poll');
const { setValue } = require('./setValue');
const { testConnection } = require('./testConnection');
// const logger = require('../../../../utils/logger');

// we rate-limit the number of request per seconds to poll lights
const pollLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 1000, // 1 s
});

// we rate-limit the number of request per seconds to control lights
const setValueLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100, // 100 ms
});

/**
 * @description Add ability to control an DSP-W215 device.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const W215Handler = new W215Handler(gladys, serviceId);
 */
const W215Handler = function W215Handler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.configured = false;
  this.connected = false;
  this.ip_adress = '';
  this.username = 'admin';
  this.pin_code = '';
};

W215Handler.prototype.discover = discover;
W215Handler.prototype.testConnection = testConnection;
W215Handler.prototype.poll = pollLimiter.wrap(poll);
W215Handler.prototype.setValue = setValueLimiter.wrap(setValue);

module.exports = W215Handler;
