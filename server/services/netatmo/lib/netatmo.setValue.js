const { fetch } = require('undici');
const logger = require('../../../utils/logger');
const { API, STATUS, PARAMS } = require('./utils/netatmo.constants');
const { BadParameters } = require('../../../utils/coreErrors');
const { writeValues } = require('./device/netatmo.deviceMapping');

/**
 * @description Send the new device value over device protocol.
 * @param {object} device - Updated Gladys device.
 * @param {object} deviceFeature - Updated Gladys device feature.
 * @param {string|number} value - The new device feature value.
 * @example
 * setValue(device, deviceFeature, 0);
 */
async function setValue(device, deviceFeature, value) {
  const externalId = deviceFeature.external_id;
  const homeId = device.params.find((oneParam) => oneParam.name === PARAMS.HOME_ID);
  if (!homeId) {
    throw new BadParameters(`Netatmo device external_id: "${externalId}" should contains parameter "HOME_ID"`);
  }
  const [prefix, ...topic] = externalId.split(':');
  if (prefix !== 'netatmo') {
    throw new BadParameters(`Netatmo device external_id is invalid: "${externalId}" should starts with "netatmo:"`);
  }
  if (!topic || topic.length === 0) {
    throw new BadParameters(`Netatmo device external_id is invalid: "${externalId}" have no id and category indicator`);
  }
  const featureName = topic[topic.length - 1];

  const transformedValue = writeValues[deviceFeature.category][deviceFeature.type](value);
  logger.debug(`Change value for device ${device.name} / ${featureName} to value ${transformedValue}...`);

  try {
    let response;
    if (featureName === 'monitoring') {
      const moduleId = topic.slice(0, topic.length - 1).join(':');
      response = await fetch(API.SET_STATE, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          Accept: API.HEADER.ACCEPT,
        },
        body: JSON.stringify({
          home: {
            id: homeId.value,
            modules: [{ id: moduleId, monitoring: transformedValue }],
          },
        }),
      });
    } else {
      const roomId = device.params.find((oneParam) => oneParam.name === PARAMS.ROOM_ID);
      if (!roomId) {
        throw new BadParameters(
          `Netatmo device external_id: "${externalId}" should contains parameters "HOME_ID" and "ROOM_ID"`,
        );
      }
      const paramsForm = {
        home_id: homeId.value,
        room_id: roomId.value,
        mode: 'manual',
        temp: transformedValue,
      };
      response = await fetch(API.SET_ROOM_THERMPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': API.HEADER.CONTENT_TYPE,
          Accept: API.HEADER.ACCEPT,
        },
        body: new URLSearchParams(paramsForm).toString(),
      });
    }
    const rawBody = await response.text();
    if (!response.ok) {
      logger.error('Netatmo error: ', response.status, rawBody);
      if (response.status === 403 && JSON.parse(rawBody).error.code === 13) {
        await this.saveStatus({
          statusType: STATUS.ERROR.SET_DEVICES_VALUES,
          message: 'set_devices_value_fail_scope_rights',
        });
      } else {
        await this.saveStatus({
          statusType: STATUS.ERROR.SET_DEVICES_VALUES,
          message: 'set_devices_value_error_unknown',
        });
      }
      throw new Error(`Netatmo setValue error: HTTP ${response.status}`);
    }
    logger.debug(`Value has been changed on the device ${device.name} / ${featureName}: ${transformedValue}`);
  } catch (e) {
    logger.error(`setValue Netatmo error on device ${device.name} / ${featureName}: `, e);
    throw e;
  }
}

module.exports = {
  setValue,
};
