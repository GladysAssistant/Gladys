const Bottleneck = require('bottleneck/es5');
const { discover } = require('./discover');
const { poll } = require('./poll');
const { setValue } = require('./setValue');

// we rate-limit the number of request per seconds to poll lights
const pollLimiter = new Bottleneck({
  maxConcurrent: 4,
  minTime: 400, // 400 ms
});

// we rate-limit the number of request per seconds to control lights
const setValueLimiter = new Bottleneck({
  maxConcurrent: 4,
  minTime: 400, // 400 ms
});

/**
 * @description Add ability to control a Yeelight device
 * @param {Object} gladys - Gladys instance.
 * @param {Object} yeelightApi - Yeelight Client.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const yeelightHandler = new YeelightHandler(gladys, client, serviceId);
 */
const YeelightHandler = function YeelightHandler(gladys, yeelightApi, serviceId) {
  this.gladys = gladys;
  this.yeelightApi = yeelightApi;
  this.serviceId = serviceId;

  this.discoveryInProgress = false;
  this.discovery = undefined;
};

YeelightHandler.prototype.discover = discover;
YeelightHandler.prototype.poll = pollLimiter.wrap(poll);
YeelightHandler.prototype.setValue = setValueLimiter.wrap(setValue);

module.exports = YeelightHandler;
