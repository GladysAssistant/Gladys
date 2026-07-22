const logger = require('../../../../utils/logger');
const { emitFeatureState } = require('../utils/netatmo.emitFeatureState');

/**
 * @description Save values of Smart Rain Gauge Module NAModule3.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateNAModule3(deviceGladys, deviceNetatmo, externalId);
 */
async function updateNAModule3(deviceGladys, deviceNetatmo, externalId) {
  const { dashboard_data: dashboardData } = deviceNetatmo;
  try {
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:battery_percent`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.battery_percent);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:rain`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.rain ?? dashboardData?.Rain);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:sum_rain_1`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.sum_rain_1 ?? dashboardData?.sum_rain_1);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:sum_rain_24`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.sum_rain_24 ?? dashboardData?.sum_rain_24);
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:rf_strength`)
      .forEach((feature) => {
        emitFeatureState(this.gladys, feature, deviceNetatmo.rf_strength ?? dashboardData?.rf_status);
      });
  } catch (e) {
    logger.error('deviceGladys NAModule3: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNAModule3,
};
