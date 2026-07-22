const logger = require('../../../../utils/logger');
const { emitFeatureState } = require('../utils/netatmo.emitFeatureState');

/**
 * @description Save values of Smart Home Weather Station NAMain Indoor.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateNAMain(deviceGladys, deviceNetatmo, externalId);
 */
async function updateNAMain(deviceGladys, deviceNetatmo, externalId) {
  const { room, dashboard_data: dashboardData } = deviceNetatmo;
  try {
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:temperature`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.temperature ?? dashboardData?.Temperature);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:therm_measured_temperature`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, room?.therm_measured_temperature);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:co2`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.co2 ?? dashboardData?.CO2);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:humidity`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.humidity ?? dashboardData?.Humidity);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:noise`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.noise ?? dashboardData?.Noise);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:pressure`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.pressure ?? dashboardData?.Pressure);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:absolute_pressure`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.absolute_pressure ?? dashboardData?.AbsolutePressure);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:min_temp`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, dashboardData?.min_temp);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:max_temp`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, dashboardData?.max_temp);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:wifi_strength`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.wifi_strength ?? deviceNetatmo.wifi_status);
      });
  } catch (e) {
    logger.error('deviceGladys NAMain: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNAMain,
};
