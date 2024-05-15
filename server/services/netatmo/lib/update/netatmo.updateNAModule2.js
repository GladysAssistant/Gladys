const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { readValues } = require('../device/netatmo.deviceMapping');

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
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `${externalId}:battery_percent`,
          state: readValues[feature.category][feature.type](deviceNetatmo.battery_percent),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:wind_strength`)
      .forEach((feature) => {
        const valueDeviceNetatmo = deviceNetatmo.wind_strength || (dashboardData && dashboardData.WindStrength);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](valueDeviceNetatmo),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:wind_angle`)
      .forEach((feature) => {
        const valueDeviceNetatmo = deviceNetatmo.wind_angle || (dashboardData && dashboardData.WindAngle);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](valueDeviceNetatmo),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:wind_gust`)
      .forEach((feature) => {
        const valueDeviceNetatmo = deviceNetatmo.wind_gust || (dashboardData && dashboardData.GustStrength);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](valueDeviceNetatmo),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:wind_gust_angle`)
      .forEach((feature) => {
        const valueDeviceNetatmo = deviceNetatmo.wind_gust_angle || (dashboardData && dashboardData.GustAngle);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](valueDeviceNetatmo),
        });
      });
    if (dashboardData) {
      deviceGladys.features
        .filter((feature) => feature.external_id === `${externalId}:max_wind_str`)
        .forEach((feature) => {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: feature.external_id,
            state: readValues[feature.category][feature.type](dashboardData.max_wind_str),
          });
        });
      deviceGladys.features
        .filter((feature) => feature.external_id === `${externalId}:max_wind_angle`)
        .forEach((feature) => {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: feature.external_id,
            state: readValues[feature.category][feature.type](dashboardData.max_wind_angle),
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
    logger.error('deviceGladys NAModule2: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNAModule2,
};
