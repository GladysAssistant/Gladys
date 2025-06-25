const logger = require('../../../utils/logger');
const { API, INFRARED_CATEGORIES } = require('./utils/tuya.constants');

/**
 * @description Load Tuya device details.
 * @param {object} tuyaDevice - Tuya device.
 * @returns {Promise} Device with details.
 * @example
 * await loadDeviceDetails({ id: 'tuyaId' });
 */
async function loadDeviceDetails(tuyaDevice) {
  const { id: deviceId } = tuyaDevice;
  logger.debug(`Loading ${deviceId} Tuya device specifications`);

  const responsePage = await this.connector.request({
    method: 'GET',
    path: `${API.VERSION_1_2}/devices/${deviceId}/specification`,
  });
  const { result } = responsePage;

  if ([INFRARED_CATEGORIES.INFRARED_TV, INFRARED_CATEGORIES.INFRARED_AC].includes(responsePage.result.category)) {
    const getListOfKeys = await this.connector.request({
      method: 'GET',
      path: `${API.VERSION_2_0}/infrareds/${tuyaDevice.gateway_id}/remotes/${deviceId}/keys`,
    });
    return {
      ...tuyaDevice,
      specifications: result,
      keys: getListOfKeys.result.key_list
        .filter((key) => key.standard_key)
        .map((key) => ({
          ...key,
          category_id: getListOfKeys.result.category_id,
        })),
    };
  }

  return { ...tuyaDevice, specifications: result };
}

module.exports = {
  loadDeviceDetails,
};
