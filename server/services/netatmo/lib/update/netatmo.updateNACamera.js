const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { readValues, NETATMO_VALUES } = require('../device/netatmo.deviceMapping');

/**
 * @description Save values of Smart Indoor Camera NACamera.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateNACamera(deviceGladys, deviceNetatmo, externalId);
 */
async function updateNACamera(deviceGladys, deviceNetatmo, externalId) {
  try {
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:camera`)
      .forEach(async (feature) => {
        const cameraImage = await this.getImage(deviceGladys);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          text: readValues[feature.category][feature.type](cameraImage),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:status`)
      .forEach((feature) => {
        const status = NETATMO_VALUES.SECURITY.STATUS[deviceNetatmo.status];
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](status),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:wifi_strength`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](deviceNetatmo.wifi_strength),
        });
      });
  } catch (e) {
    logger.error('deviceGladys NACamera: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNACamera,
};
