const logger = require('../../../../utils/logger');
const { emitFeatureState } = require('../utils/netatmo.emitFeatureState');
const { UPDATE_MAPPINGS } = require('./netatmo.updateMappings');

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
  try {
    Object.entries(featureExtractors).forEach(([featureSuffix, extractValue]) => {
      deviceGladys.features
        .filter((feature) => feature.external_id === `${externalId}:${featureSuffix}`)
        .forEach((feature) => {
          emitFeatureState(this.gladys, feature, extractValue(deviceNetatmo));
        });
    });
  } catch (e) {
    logger.error(`deviceGladys ${deviceNetatmo.type}: `, deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateDevice,
};
