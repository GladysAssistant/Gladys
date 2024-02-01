const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { readValues } = require('./netatmo.deviceMapping');

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
      .filter((feature) => feature.external_id === `${externalId}:rain`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](deviceNetatmo.rain),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:sum_rain_1`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](deviceNetatmo.sum_rain_1),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:sum_rain_24`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](dashboardData.sum_rain_24),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:rf_strength`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](deviceNetatmo.rf_strength),
        });
      });
  } catch (e) {
    logger.error('deviceGladys NAModule3: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNAModule3,
};
