const path = require('path');
const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { readValues } = require('../device/netatmo.deviceMapping');

/**
 * @description Save values of Smart Home Weather Station NAMain Indoor.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} deviceNetatmo - Device object coming from the Netatmo API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateNACamera(deviceGladys, deviceNetatmo, externalId);
 */
async function updateNACamera(deviceGladys, deviceNetatmo, externalId) {
  const { room, dashboard_data: dashboardData } = deviceNetatmo;
  try {
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:camera`)
      .forEach((feature) => {
        try {
          const selectorCamera = externalId.replace(/:/gi, '-');
          const cameraUrlParam = `${deviceNetatmo.vpn_url}/live/snapshot_720.jpg`;
          // we create a temp folder
          const now = new Date();
          const filePath = path.join(
            this.gladys.config.tempFolder,
            `camera-${deviceNetatmo.id}-${now.getMilliseconds()}-${now.getSeconds()}-${now.getMinutes()}-${now.getHours()}.jpg`,
          );
          readValues[feature.category][feature.type](selectorCamera, filePath, cameraUrlParam)
        } catch (e) {
          logger.error(
            `Netatmo : File netatmo.updateCamera.js - Camera ${deviceNetatmo.type} ${deviceNetatmo.name} - vpn_url - error : ${e}`,
          );
        }
        // this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        //   device_feature_external_id: feature.external_id,
        //   state: readValues[feature.category][feature.type](deviceNetatmo.temperature),
        // });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:therm_measured_temperature`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](room.therm_measured_temperature),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:co2`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](deviceNetatmo.co2),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:humidity`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](deviceNetatmo.humidity),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:noise`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](deviceNetatmo.noise),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:pressure`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](deviceNetatmo.pressure),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:absolute_pressure`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](deviceNetatmo.absolute_pressure),
        });
      });
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
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:wifi_strength`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](deviceNetatmo.wifi_strength),
        });
      });
  } catch (e) {
    logger.error('deviceGladys NAMain: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNACamera,
};
