const Promise = require('bluebird');
const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { getDeviceParam, setDeviceParam } = require('../../../../utils/device');
const logger = require('../../../../utils/logger');
const { parseExternalId, readOnlineValue } = require('../features');
const power = require('../features/power');
const { DEVICE_FIRMWARE, EWELINK_REGION_KEY, DEVICE_ONLINE } = require('../utils/constants');

const pollPower = (eWeLinkDevice, feature) => {
  const { deviceId, channel } = parseExternalId(feature.external_id);
  let state = (eWeLinkDevice.params && eWeLinkDevice.params.switch) || false;
  const switches = (eWeLinkDevice.params && eWeLinkDevice.params.switches) || false;
  if (state || switches) {
    if (switches) {
      state = switches[channel - 1].switch;
    }
  }
  const currentPowerState = power.readValue(state);
  // if the value is different from the value we have, save new state
  if (state && feature.last_value !== currentPowerState) {
    logger.debug(`eWeLink: Polling device "${deviceId}", power new value = ${currentPowerState}`);
    return currentPowerState;
  }
  return null;
};

const pollHumidity = (eWeLinkDevice, feature) => {
  const { deviceId } = parseExternalId(feature.external_id);
  const currentHumidity = (eWeLinkDevice.params && eWeLinkDevice.params.currentHumidity) || false;
  // if the value is different from the value we have, save new state
  if (currentHumidity && feature.last_value !== currentHumidity) {
    logger.debug(`eWeLink: Polling device "${deviceId}", humidity new value = ${currentHumidity}`);
    return currentHumidity;
  }
  return null;
};

const pollTemperature = (eWeLinkDevice, feature) => {
  const { deviceId } = parseExternalId(feature.external_id);
  const currentTemperature = (eWeLinkDevice.params && eWeLinkDevice.params.currentTemperature) || false;
  // if the value is different from the value we have, save new state
  if (currentTemperature && feature.last_value !== currentTemperature) {
    logger.debug(`eWeLink: Polling device "${deviceId}", temperature new value = ${currentTemperature}`);
    return currentTemperature;
  }
  return null;
};

// const pollEnergyPower = async (gladys, eWeLinkDevice, feature) => {
//   const { deviceId } = parseExternalId(feature.external_id);
//   const response = await connection.getDevicePowerUsage(deviceId);
//   await this.throwErrorIfNeeded(response);

//   const currentEnergyPowerState = response.monthly;
//   // if the value is different from the value we have, save new state
//   if (feature && feature.last_value !== currentEnergyPowerState) {
//     logger.debug(`eWeLink: Polling device "${deviceId}", energyPower new value = ${currentEnergyPowerState}`);
//     await gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
//       device_feature_external_id: feature.external_id,
//       state: currentEnergyPowerState,
//     });
//   }
// };

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
  const { deviceId } = parseExternalId(device.external_id);
  const connection = new this.EweLinkApi({ at: this.accessToken, region });
  const eWeLinkDevice = await connection.getDevice(deviceId);
  logger.debug(`eWeLink: eWeLinkDevice: ${JSON.stringify(eWeLinkDevice)}`);
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

  await Promise.mapSeries(device.features || [], async (feature) => {
    let state;
    switch (feature.category) {
      case DEVICE_FEATURE_CATEGORIES.SWITCH: // Power
        if (feature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY) {
          state = pollPower(eWeLinkDevice, feature);
        }
        // } else if (feature.type === DEVICE_FEATURE_TYPES.SWITCH.POWER) {
        //   await pollEnergyPower(this.gladys, eWeLinkDevice, feature);
        // }
        break;
      case DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR: // Humidity
        state = pollHumidity(eWeLinkDevice, feature);
        break;
      case DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR: // Temperature
        state = pollTemperature(eWeLinkDevice, feature);
        break;
      default:
        break;
    }

    if (state !== null) {
      logger.debug(`eWeLink: Polling device "${deviceId}", emit feature "${feature.external_id}" update`);
      await this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: feature.external_id,
        state,
      });
    }
  });

  const firmwareParam = getDeviceParam(device, DEVICE_FIRMWARE);
  if (firmwareParam) {
    const currentVersion = (eWeLinkDevice.params && eWeLinkDevice.params.fwVersion) || false;
    // if the value is different from the value we have, save new param
    if (currentVersion && firmwareParam !== currentVersion) {
      logger.debug(`eWeLink: Polling device "${deviceId}", firmware new value = ${currentVersion}`);
      setDeviceParam(device, DEVICE_FIRMWARE, currentVersion);
    }
  }
}

module.exports = {
  poll,
};
