const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { readValues } = require('../device/netatmo.deviceMapping');

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
        const valueDeviceNetatmo = deviceNetatmo.temperature || (dashboardData && dashboardData.Temperature);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](valueDeviceNetatmo),
        });
      });
    if (room) {
      deviceGladys.features
        .filter((feature) => feature.external_id === `${externalId}:therm_measured_temperature`)
        .forEach((feature) => {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: feature.external_id,
            state: readValues[feature.category][feature.type](room.therm_measured_temperature),
          });
        });
    }
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:co2`)
      .forEach((feature) => {
        const valueDeviceNetatmo = deviceNetatmo.co2 || (dashboardData && dashboardData.CO2);
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
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:noise`)
      .forEach((feature) => {
        const valueDeviceNetatmo = deviceNetatmo.noise || (dashboardData && dashboardData.Noise);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](valueDeviceNetatmo),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:pressure`)
      .forEach((feature) => {
        const valueDeviceNetatmo = deviceNetatmo.pressure || (dashboardData && dashboardData.Pressure);
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](valueDeviceNetatmo),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:absolute_pressure`)
      .forEach((feature) => {
        const valueDeviceNetatmo = deviceNetatmo.absolute_pressure || (dashboardData && dashboardData.AbsolutePressure);
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
      .filter((feature) => feature.external_id === `${externalId}:wifi_strength`)
      .forEach((feature) => {
        const valueDeviceNetatmo = deviceNetatmo.wifi_strength || deviceNetatmo.wifi_status;
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](valueDeviceNetatmo),
        });
      });
  } catch (e) {
    logger.error('deviceGladys NAMain: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNAMain,
};
