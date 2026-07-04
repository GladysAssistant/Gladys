const logger = require('../../../../utils/logger');
const { emitFeatureState } = require('../utils/netatmo.emitFeatureState');

/**
 * @description Save values of NAPlug.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateNAPlug(deviceGladys, deviceNetatmo, externalId);
 */
async function updateNAPlug(deviceGladys, deviceNetatmo, externalId) {
  try {
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:rf_strength`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.rf_strength);
      });

    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:wifi_strength`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.wifi_strength);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:plug_connected_boiler`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.plug_connected_boiler ?? false);
      });
  } catch (e) {
    logger.error('deviceGladys NAPlug: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNAPlug,
};
