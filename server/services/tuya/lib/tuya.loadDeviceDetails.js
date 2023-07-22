const logger = require('../../../utils/logger');
const { API } = require('./utils/tuya.constants');

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
  return { ...tuyaDevice, specifications: result };
}

module.exports = {
  loadDeviceDetails,
};
