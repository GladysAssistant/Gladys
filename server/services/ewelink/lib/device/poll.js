const Promise = require('bluebird');
const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { getDeviceFeature, getDeviceParam, setDeviceParam } = require('../../../../utils/device');
const logger = require('../../../../utils/logger');
const { parseExternalId, readOnlineValue } = require('../features');
const power = require('../features/power');
const { DEVICE_FIRMWARE, EWELINK_REGION_KEY, DEVICE_ONLINE } = require('../utils/constants');

/**
 *
 * @description Poll values of an eWeLink device.
 * @param {Object} device - The device to poll.
 * @returns {Promise} Promise of nothing.
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

  const onlineParam = getDeviceParam(device, DEVICE_ONLINE);
  const currentOnline = readOnlineValue(eWeLinkDevice.online);
  // if the value is different from the value we have, save new param
  if (onlineParam !== currentOnline) {
    logger.debug(`eWeLink: Polling device "${deviceId}", online new value = ${currentOnline}`);
    setDeviceParam(device, DEVICE_ONLINE, currentOnline);
  }

  if (!eWeLinkDevice.online) {
    throw new NotFoundError('eWeLink: Error, device is not currently online');
  }

  const powerFeature = getDeviceFeature(device, DEVICE_FEATURE_CATEGORIES.SWITCH, DEVICE_FEATURE_TYPES.SWITCH.BINARY);
  if (powerFeature) {
    const response = await connection.getDevicePowerState(deviceId, channel);
    await this.throwErrorIfNeeded(response);

    const currentPowerState = power.readValue(response.state);
    // if the value is different from the value we have, save new state
    if (powerFeature && powerFeature.last_value !== currentPowerState) {
      logger.debug(`eWeLink: Polling device "${deviceId}", power new value = ${currentPowerState}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: powerFeature.external_id,
        state: currentPowerState,
      });
    }
  }

  const energyPowerFeature = getDeviceFeature(
    device,
    DEVICE_FEATURE_CATEGORIES.SWITCH,
    DEVICE_FEATURE_TYPES.SWITCH.POWER,
  );
  if (energyPowerFeature) {
    const response = await connection.getDevicePowerUsage(deviceId);
    await this.throwErrorIfNeeded(response);

    const currentEnergyPowerState = response.monthly;
    // if the value is different from the value we have, save new state
    if (energyPowerFeature && energyPowerFeature.last_value !== currentEnergyPowerState) {
      logger.debug(`eWeLink: Polling device "${deviceId}", energyPower new value = ${currentEnergyPowerState}`);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: energyPowerFeature.external_id,
        state: currentEnergyPowerState,
      });
    }
  }

  const humidityFeature = getDeviceFeature(
    device,
    DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
    DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
  );
  const temperatureFeature = getDeviceFeature(
    device,
    DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
    DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
  );
  if (humidityFeature || temperatureFeature) {
    const response = await connection.getDeviceCurrentTH(deviceId);
    await this.throwErrorIfNeeded(response);

    if (humidityFeature && response.humidity) {
      const currentHumidity = response.humidity;
      // if the value is different from the value we have, save new state
      if (temperatureFeature && temperatureFeature.last_value !== currentHumidity) {
        logger.debug(`eWeLink: Polling device "${deviceId}", humidity new value = ${currentHumidity}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: humidityFeature.external_id,
          state: currentHumidity,
        });
      }
    }
    if (temperatureFeature && response.temperature) {
      const currentTemperature = response.temperature;
      // if the value is different from the value we have, save new state
      if (temperatureFeature && temperatureFeature.last_value !== currentTemperature) {
        logger.debug(`eWeLink: Polling device "${deviceId}", temperature new value = ${currentTemperature}`);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: temperatureFeature.external_id,
          state: currentTemperature,
        });
      }
    }
  }

  const firmwareParam = getDeviceParam(device, DEVICE_FIRMWARE);
  if (firmwareParam) {
    const response = await connection.getFirmwareVersion(deviceId);
    await this.throwErrorIfNeeded(response);

    const currentVersion = response.fwVersion;
    // if the value is different from the value we have, save new param
    if (firmwareParam !== currentVersion) {
      logger.debug(`eWeLink: Polling device "${deviceId}", firmware new value = ${currentVersion}`);
      setDeviceParam(device, DEVICE_FIRMWARE, currentVersion);
    }
  }
}

module.exports = {
  poll,
};
