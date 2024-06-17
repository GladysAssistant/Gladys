const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { readValues } = require('./netatmo.deviceMapping');

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
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](deviceNetatmo.battery_state),
        });
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
      .filter((feature) => feature.external_id === `${externalId}:therm_setpoint_temperature`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](room.therm_setpoint_temperature),
        });
      });
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:open_window`)
      .forEach((feature) => {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](room.open_window),
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
    deviceGladys.features
      .filter((feature) => feature.external_id === `${externalId}:heating_power_request`)
      .forEach((feature) => {
        const value = room.heating_power_request > 0;
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: feature.external_id,
          state: readValues[feature.category][feature.type](value),
        });
      });
  } catch (e) {
    logger.error('deviceGladys NRV: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateNRV,
};
