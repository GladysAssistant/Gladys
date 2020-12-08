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
  if (this.devices[sid].type == 'NATherm1') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:battery`,
      state: this.devices[sid].battery_percent
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:temperature`,
      state: this.devices[sid].measured.temperature
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:setpoint`,
      state: this.devices[sid].measured.setpoint_temp
    });
  }
  if (this.devices[sid].type == 'NAMain') {
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:temperature`,
      state: this.devices[sid].dashboard_data.Temperature
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:humidity`,
      state: this.devices[sid].dashboard_data.Humidity
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:co2`,
      state: this.devices[sid].dashboard_data.CO2
    });
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `netatmo:${sid}:pressure`,
      state: this.devices[sid].dashboard_data.Pressure
    });
  }

}

module.exports = {
  poll,
};
