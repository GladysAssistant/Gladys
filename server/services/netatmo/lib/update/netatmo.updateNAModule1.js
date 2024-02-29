const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { readValues } = require('../device/netatmo.deviceMapping');

/**
 * @description Save values of Smart Outdoor Module NAModule1 - Weather Station .
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateNAModule1(deviceGladys, deviceNetatmo, externalId);
 */
async function updateNAModule1(deviceGladys, deviceNetatmo, externalId) {
  const { dashboard_data: dashboardData } = deviceNetatmo;
  try {
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:battery_percent`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](deviceNetatmo.battery_percent),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:temperature`)
      .forEach((feature) => {
        const valueDeviceNetatmo = deviceNetatmo.temperature || (dashboardData && dashboardData.Temperature);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](valueDeviceNetatmo),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:humidity`)
      .forEach((feature) => {
        const valueDeviceNetatmo = deviceNetatmo.humidity || (dashboardData && dashboardData.Humidity);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](valueDeviceNetatmo),
        });
      });
    if (dashboardData) {
      deviceGladys.features
        .filter((feature) => feature.external_id === `${externalId}:min_temp`)
        .forEach((feature) => {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: feature.external_id,
            state: readValues[feature.category][feature.type](dashboardData.min_temp),
          });
        });
      deviceGladys.features
        .filter((feature) => feature.external_id === `${externalId}:max_temp`)
        .forEach((feature) => {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: feature.external_id,
            state: readValues[feature.category][feature.type](dashboardData.max_temp),
          });
        });
    }
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:rf_strength`)
      .forEach((feature) => {
        const valueDeviceNetatmo = deviceNetatmo.rf_strength || (dashboardData && dashboardData.rf_status);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](valueDeviceNetatmo),
        });
      });
  } catch (e) {
    logger.error('deviceGladys NAModule1: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNAModule1,
};
