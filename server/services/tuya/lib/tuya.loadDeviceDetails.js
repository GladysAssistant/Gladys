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

  const [specificationsResponse, detailsResponse] = await Promise.all([
    this.connector.request({
      method: 'GET',
      path: `${API.VERSION_1_0}/devices/${deviceId}/specification`,
    }),
    this.connector.request({
      method: 'GET',
      path: `${API.VERSION_1_0}/devices/${deviceId}`,
    }),
  ]);

  const specifications = specificationsResponse.result || {};
  const details = detailsResponse.result || {};

  // Temporary verbose logging to inspect what Tuya cloud returns
  logger.debug(`[Tuya] Device details raw for ${deviceId}: ${JSON.stringify(details)}`);
  logger.debug(`[Tuya] Device specifications raw for ${deviceId}: ${JSON.stringify(specifications)}`);

  return { ...tuyaDevice, ...details, specifications };
}

module.exports = {
  loadDeviceDetails,
};
