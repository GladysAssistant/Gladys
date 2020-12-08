const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { THERMOSTAT_EXTERNAL_ID_BASE } = require('../utils/consts');

const logger = require('../../../../utils/logger');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { getDeviceFeature } = require('../../../../utils/device');

const MIN_VOLT = 2800;
const MAX_VOLT = 3300;

/**
 * @description Poll value of a Philips hue
 * @param {Object} device - The device to control.
 * @example
 * poll(device);
 */
async function poll(device) {
  sid = device.external_id.split('netatmo:')[1];
  this.getDevices()
  sensor = this.devices[sid]
  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: `netatmo:${sid}:battery`,
    state: this.devices[sid].battery_percent
  });
  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
    device_feature_external_id: `netatmo:${sid}:temperature`,
    state: this.devices[sid].measured.temperature
  });
}

module.exports = {
  poll,
};
