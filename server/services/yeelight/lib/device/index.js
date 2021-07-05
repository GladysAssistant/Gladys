const { discover } = require('./discover');
const { poll } = require('./poll');
const { setValue } = require('./setValue');

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
YeelightHandler.prototype.poll = poll;
YeelightHandler.prototype.setValue = setValue;

module.exports = YeelightHandler;
