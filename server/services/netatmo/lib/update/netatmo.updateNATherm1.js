const logger = require('../../../../utils/logger');
const { emitFeatureState } = require('../utils/netatmo.emitFeatureState');

/**
 * @description Save values of Thermostats NATherm1.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateNATherm1(deviceGladys, deviceNetatmo, externalId);
 */
async function updateNATherm1(deviceGladys, deviceNetatmo, externalId) {
  const { measured, room } = deviceNetatmo;
  try {
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:battery_percent`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.battery_percent);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:temperature`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, measured?.temperature);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:therm_measured_temperature`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, room?.therm_measured_temperature);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:therm_setpoint_temperature`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, room?.therm_setpoint_temperature);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:open_window`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, room?.open_window);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:rf_strength`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.rf_strength);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:boiler_status`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.boiler_status);
      });
  } catch (e) {
    logger.error('deviceGladys NATherm1: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNATherm1,
};
