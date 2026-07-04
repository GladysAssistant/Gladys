const logger = require('../../../../utils/logger');

/**
 * @description Refresh the dashboard image of a camera device.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateCameraImage(deviceGladys, deviceNetatmo, externalId);
 */
async function updateCameraImage(deviceGladys, deviceNetatmo, externalId) {
  const cameraFeature = deviceGladys.features.find((feature) => feature.external_id === `${externalId}:camera`);
  if (!cameraFeature) {
    return;
  }
  try {
    const image = await this.getCameraImage(deviceNetatmo);
    if (!image) {
      return;
    }
    await this.gladys.device.camera.setImage(deviceGladys.selector, image);
  } catch (e) {
    logger.error(`deviceGladys ${deviceNetatmo.type} - camera image: `, deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateCameraImage,
};
