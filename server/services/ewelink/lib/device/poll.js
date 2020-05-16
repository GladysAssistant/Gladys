const Promise = require('bluebird');
const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, STATE } = require('../../../../utils/constants');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { getDeviceFeature, getDeviceParam } = require('../../../../utils/device');
const logger = require('../../../../utils/logger');
const { DEVICE_FIRMWARE, EWELINK_REGION_KEY } = require('../utils/constants');
const { parseExternalId } = require('../utils/parseExternalId');

/**
 * @description Poll values of an eWeLink device.
 * @param {Object} device - The device to poll.
 * @example
 * poll(device);
 */
async function poll(device) {
  if (!this.connected) {
    await this.connect();
  }

  const region = await this.gladys.variable.getValue(EWELINK_REGION_KEY, this.serviceId);
  const { deviceId, channel } = parseExternalId(device.external_id);
  const connection = new this.EweLinkApi({ at: this.accessToken, region });
  const eWeLinkDevice = await connection.getDevice(deviceId);
  await this.throwErrorIfNeeded(eWeLinkDevice);
  if (!eWeLinkDevice.online) {
    throw new NotFoundError('EWeLink error: Device is not currently online');
  }

  const [binaryFeature, powFeature, tempFeature, humFeature, firmwareParam] = await Promise.all([
    getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SWITCH.BINARY),
    getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SWITCH.POWER),
    getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR, DEVICE_FEATURE_TYPES.SENSOR.DECIMAL),
    getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR, DEVICE_FEATURE_TYPES.SENSOR.DECIMAL),
    getDeviceParam(device, DEVICE_FIRMWARE),
  ]);

  if (binaryFeature) {
    const response = await connection.getDevicePowerState(deviceId, channel);
    await this.throwErrorIfNeeded(response);

    const currentBinaryState = response.state === 'on' ? STATE.ON : STATE.OFF;
    // if the value is different from the value we have, save new state
    if (binaryFeature.last_value !== currentBinaryState) {
      logger.debug(`Polling eWeLink ${deviceId}, new value = ${currentBinaryState}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `${binaryFeature.external_id}`,
        state: currentBinaryState,
      });
    }
  }

  if (powFeature) {
    const response = await connection.getDevicePowerUsage(deviceId);
    await this.throwErrorIfNeeded(response);

    const currentPowerState = response.monthly;
    // if the value is different from the value we have, save new state
    if (powFeature.last_value !== currentPowerState) {
      logger.debug(`Polling eWeLink ${deviceId}, new value = ${currentPowerState}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `${powFeature.external_id}`,
        state: currentPowerState,
      });
    }
  }

  if (tempFeature || humFeature) {
    const response = await connection.getDeviceCurrentTH(deviceId);
    await this.throwErrorIfNeeded(response);

    if (tempFeature && response.temperature) {
      const currentTemperature = response.temperature;
      // if the value is different from the value we have, save new state
      if (tempFeature.last_value !== currentTemperature) {
        logger.debug(`Polling eWeLink ${deviceId}, new value = ${currentTemperature}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `${tempFeature.external_id}`,
          state: currentTemperature,
        });
      }
    }
    if (humFeature && response.humidity) {
      const currentHumidity = response.humidity;
      // if the value is different from the value we have, save new state
      if (tempFeature.last_value !== currentHumidity) {
        logger.debug(`Polling eWeLink ${deviceId}, new value = ${currentHumidity}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `${humFeature.external_id}`,
          state: currentHumidity,
        });
      }
    }
  }

  if (firmwareParam) {
    const response = await connection.getFirmwareVersion(deviceId);
    await this.throwErrorIfNeeded(response);

    const currentVersion = response.fwVersion;
    // if the value is different from the value we have, save new param
    if (firmwareParam !== currentVersion) {
      logger.debug(`Polling eWeLink ${deviceId}, new value = ${currentVersion}`);
      this.gladys.event.emit(EVENTS.DEVICE.ADD_PARAM, {
        name: DEVICE_FIRMWARE,
        value: currentVersion,
      });
    }
  }
}

module.exports = {
  poll,
};
