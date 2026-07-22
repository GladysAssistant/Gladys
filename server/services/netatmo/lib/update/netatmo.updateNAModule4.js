const logger = require('../../../../utils/logger');
const { emitFeatureState } = require('../utils/netatmo.emitFeatureState');

/**
 * @description Save values of Smart Indoor Module NAModule4 - Weather Station .
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateNAModule4(deviceGladys, deviceNetatmo, externalId);
 */
async function updateNAModule4(deviceGladys, deviceNetatmo, externalId) {
  const { room, dashboard_data: dashboardData } = deviceNetatmo;
  try {
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:battery_percent`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.battery_percent);
      });
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
      .filter((feature) => feature.external_id === `${externalId}:rf_strength`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.rf_strength ?? dashboardData?.rf_status);
      });
  } catch (e) {
    logger.error('deviceGladys NAModule4: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNAModule4,
};
