const { default: axios } = require('axios');
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
  const roomId = device.params.find((oneParam) => oneParam.name === PARAMS.ROOM_ID);
  if (!homeId || !roomId) {
    throw new BadParameters(
      `Netatmo device external_id: "${externalId}" should contains parameters "HOME_ID" and "ROOM_ID"`,
    );
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

  const paramsForm = {
    home_id: homeId.value, // mandatory
    room_id: roomId.value, // mandatory
    mode: 'manual', // mandatory
    temp: transformedValue,
  };
  try {
    await axios({
      url: API.SET_ROOM_THERMPOINT,
      method: 'post',
      headers: { accept: API.HEADER.ACCEPT, Authorization: `Bearer ${this.accessToken}` },
      data: paramsForm,
    });
    logger.debug(`Value has been changed on the device ${device.name} / ${featureName}: ${transformedValue}`);
  } catch (e) {
    logger.error(
      'setValue error with status code: ',
      e.code,
      ' - ',
      e.response.status,
      'and with status message: ',
      e.response.statusText,
    );
    logger.error('error details: ', e.response.data.error.code, ' - ', e.response.data.error.message);
    if (e.response.status === 403 && e.response.data.error.code === 13) {
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
  }
}

module.exports = {
  setValue,
};
