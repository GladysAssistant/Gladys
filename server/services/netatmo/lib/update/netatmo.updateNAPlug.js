const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { readValues } = require('../device/netatmo.deviceMapping');

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
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](deviceNetatmo.rf_strength),
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
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:plug_connected_boiler`)
      .forEach((feature) => {
        if (typeof deviceNetatmo.plug_connected_boiler !== 'undefined') {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: feature.external_id,
            state: readValues[feature.category][feature.type](deviceNetatmo.plug_connected_boiler),
          });
        } else {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: feature.external_id,
            state: readValues[feature.category][feature.type](false),
          });
        }
      });
  } catch (e) {
    logger.error('deviceGladys NAPlug: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNAPlug,
};
