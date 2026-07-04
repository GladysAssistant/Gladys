const logger = require('../../../../utils/logger');
const { emitFeatureState } = require('../utils/netatmo.emitFeatureState');

/**
 * @description Save values of Smart Anemometer Module NAModule2 - Weather Station .
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateNAModule2(deviceGladys, deviceNetatmo, externalId);
 */
async function updateNAModule2(deviceGladys, deviceNetatmo, externalId) {
  const { dashboard_data: dashboardData } = deviceNetatmo;
  try {
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:battery_percent`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.battery_percent);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:wind_strength`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.wind_strength ?? dashboardData?.WindStrength);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:wind_angle`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.wind_angle ?? dashboardData?.WindAngle);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:wind_gust`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.wind_gust ?? dashboardData?.GustStrength);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:wind_gust_angle`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.wind_gust_angle ?? dashboardData?.GustAngle);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:max_wind_str`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, dashboardData?.max_wind_str);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:max_wind_angle`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, dashboardData?.max_wind_angle);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:rf_strength`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.rf_strength ?? dashboardData?.rf_status);
      });
  } catch (e) {
    logger.error('deviceGladys NAModule2: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNAModule2,
};
