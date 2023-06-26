const Bottleneck = require('bottleneck/es5');

const { poll } = require('./smart-device.poll');
const { getDevices } = require('./smart-device.getDevices');
const { setValue } = require('./smart-device.setValue');

// we rate-limit the number of request per seconds to poll plugs
const pollLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100, // 100 ms
});

// we rate-limit the number of request per seconds to control plugs
const setValueLimiter = new Bottleneck({
  minTime: 100, // 100 ms
});

/**
 * @description Add ability to control a Philips Hue light.
 * @param {object} gladys - Gladys instance.
 * @param {object} tpLinkClient - TP-LinkClient.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const exampleLightHandler = new ExampleLightHandler(gladys, client, serviceId);
 */
const TPLinkSmartDeviceHandler = function TPLinkSmartDeviceHandler(gladys, tpLinkClient, serviceId) {
  this.gladys = gladys;
  this.client = tpLinkClient;
  this.serviceId = serviceId;
  this.tpLinkDevicesBySerialNumber = new Map();
  this.discoverDevicesDelay = 2000;
};

TPLinkSmartDeviceHandler.prototype.getDevices = getDevices;
TPLinkSmartDeviceHandler.prototype.poll = pollLimiter.wrap(poll);
TPLinkSmartDeviceHandler.prototype.setValue = setValueLimiter.wrap(setValue);

module.exports = TPLinkSmartDeviceHandler;
