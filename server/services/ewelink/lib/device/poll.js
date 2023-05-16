const Promise = require('bluebird');
const { EVENTS, DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { getDeviceParam, setDeviceParam } = require('../../../../utils/device');
const logger = require('../../../../utils/logger');
const { readOnlineValue } = require('../features');
const { pollBinary } = require('../features/binary');
const { pollHumidity } = require('../features/humidity');
const { pollTemperature } = require('../features/temperature');
const { DEVICE_FIRMWARE, EWELINK_REGION_KEY, DEVICE_ONLINE } = require('../utils/constants');
const { parseExternalId } = require('../utils/externalId');

/**
 *
 * @description Poll values of an eWeLink device.
 * @param {object} device - The device to poll.
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

  await Promise.mapSeries(device.features || [], (feature) => {
    let state;
    switch (feature.category) {
      case DEVICE_FEATURE_CATEGORIES.SWITCH: // Binary
        if (feature.type === DEVICE_FEATURE_TYPES.SWITCH.BINARY) {
          state = pollBinary(eWeLinkDevice, feature);
        }
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
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
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
