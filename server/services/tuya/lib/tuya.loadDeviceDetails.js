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

  const [specResult, detailsResult] = await Promise.allSettled([
    this.connector.request({
      method: 'GET',
      path: `${API.VERSION_1_0}/devices/${deviceId}/specification`,
    }),
    this.connector.request({
      method: 'GET',
      path: `${API.VERSION_1_0}/devices/${deviceId}`,
    }),
  ]);

  if (specResult.status === 'rejected') {
    const reason = specResult.reason && specResult.reason.message ? specResult.reason.message : specResult.reason;
    logger.warn(`[Tuya] Failed to load specifications for ${deviceId}: ${reason}`);
  }
  if (detailsResult.status === 'rejected') {
    const reason =
      detailsResult.reason && detailsResult.reason.message ? detailsResult.reason.message : detailsResult.reason;
    logger.warn(`[Tuya] Failed to load details for ${deviceId}: ${reason}`);
  }

  const specifications = specResult.status === 'fulfilled' ? specResult.value.result || {} : {};
  const details = detailsResult.status === 'fulfilled' ? detailsResult.value.result || {} : {};

  logger.debug(`[Tuya] Device details loaded for ${deviceId}`);
  logger.debug(`[Tuya] Device specifications loaded for ${deviceId}`);

  return { ...tuyaDevice, ...details, specifications };
}

module.exports = {
  loadDeviceDetails,
};
