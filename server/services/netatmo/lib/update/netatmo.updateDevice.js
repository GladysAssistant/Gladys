const logger = require('../../../../utils/logger');
const { emitFeatureState } = require('../utils/netatmo.emitFeatureState');
const { UPDATE_MAPPINGS } = require('./netatmo.updateMappings');
const { SUPPORTED_MODULE_TYPE } = require('../utils/netatmo.constants');

const CAMERA_MODULE_TYPES = [SUPPORTED_MODULE_TYPE.NACAMERA, SUPPORTED_MODULE_TYPE.NOC];

/**
 * @description Save values of a supported Netatmo device from its declarative mapping.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateDevice(deviceGladys, deviceNetatmo, externalId);
 */
async function updateDevice(deviceGladys, deviceNetatmo, externalId) {
  const featureExtractors = UPDATE_MAPPINGS[deviceNetatmo.type];
  if (!featureExtractors) {
    return;
  }
  Object.entries(featureExtractors).forEach(([featureSuffix, extractValue]) => {
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:${featureSuffix}`)
      .forEach((feature) => {
        try {
          emitFeatureState(this.gladys, feature, extractValue(deviceNetatmo));
        } catch (e) {
          // a failing feature must not prevent the remaining features of the device from updating
          logger.error(
            `deviceGladys ${deviceNetatmo.type} - ${feature.external_id}: `,
            deviceGladys.name,
            'error: ',
            e,
          );
        }
      });
  });
  if (CAMERA_MODULE_TYPES.includes(deviceNetatmo.type) && deviceNetatmo.reachable !== false) {
    await this.updateCameraImage(deviceGladys, deviceNetatmo, externalId);
    // after the image refresh, so a local URL invalidated during the snapshot is
    // re-resolved within the same poll cycle
    await this.updateCameraLiveUrl(deviceGladys, deviceNetatmo);
  }
}

module.exports = {
  updateDevice,
};
