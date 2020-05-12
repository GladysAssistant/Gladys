const Promise = require('bluebird');
const {NotFoundError, ServiceNotConfiguredError} = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const {EVENTS, WEBSOCKET_MESSAGE_TYPES, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES,} = require('../../../utils/constants');


/**
 * @description Get devices from connected user.
 * @returns {Promise<Array>} Resolve with array of devicse.
 * @example
 * discoverDevices();
 */
async function discoverDevices() {
  const heatzyLogin = await this.gladys.variable.getValue('HEATZY_LOGIN', this.serviceId);
  const heatzyPassword = await this.gladys.variable.getValue('HEATZY_PASSWORD', this.serviceId);
  this.heatzyClient = (await new this.heatzyLibrary(heatzyLogin, heatzyPassword));

  const devices = await this.heatzyClient.getDevices().catch((error) => {
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.HEATZY.ERROR,
      payload: error,
    });
  });

  await Promise.map(devices, async (device) => {
    if (this.devices.filter(d => d.did = device.did).length === 0) {
      device.features = [
        {
          name: `${device.name} On/Off`,
          read_only: false,
          has_feedback: false,
          external_id: `${device.did}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
          selector: `${device.did}:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
          category: DEVICE_FEATURE_CATEGORIES.HEATER,
          type: DEVICE_FEATURE_TYPES.HEATER.BINARY,
          min: 0,
          max: 1,
        },
      ];
      device.external_id = device.did;
      device.service_id = this.serviceId;

      this.devices.push(device);
    }
  });

  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.HEATZY.DISCOVER,
    payload: this.devices,
  });

  return this.devices;
}

module.exports = {
  discoverDevices,
};
