const logger = require('../../../../utils/logger');
const { emitFeatureState } = require('../utils/netatmo.emitFeatureState');

/**
 * @description Save values of valves NRV.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateNRV(deviceGladys, deviceNetatmo, externalId);
 */
async function updateNRV(deviceGladys, deviceNetatmo, externalId) {
  const { room } = deviceNetatmo;
  try {
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:battery_percent`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.battery_state);
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
      .filter((feature) => feature.external_id === `${externalId}:heating_power_request`)
      .forEach((feature) => {
        const heatingPowerRequest = room?.heating_power_request;
        emitFeatureState(
          this.gladys,
          feature,
          heatingPowerRequest === undefined || heatingPowerRequest === null ? undefined : heatingPowerRequest > 0,
        );
      });
  } catch (e) {
    logger.error('deviceGladys NRV: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNRV,
};
