const logger = require('../../../../utils/logger');
const { EVENTS } = require('../constants');

/**
 * @description Update value from home coach weather
 * @param {string} key - ID.
 * @param {Object} device - Device.
 * @example
 * updateHomeCoachWeather();
 */
async function updateHomeCoachWeather(key, device) {
  try {
    const temperatureValue = this.devices[key].dashboard_data.Temperature;
    const humidityValue = this.devices[key].dashboard_data.Humidity;
    const co2Value = this.devices[key].dashboard_data.CO2;
    const pressureValue = this.devices[key].dashboard_data.Pressure;
    const absolutePressureValue = this.devices[key].dashboard_data.AbsolutePressure;
    const noiseValue = this.devices[key].dashboard_data.Noise;
    const reachableValue = this.devices[key].reachable;
    try {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:temperature`,
        state: temperatureValue,
      });
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - temperature - error : ${e}`,
      );
    }
    try {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:humidity`,
        state: humidityValue,
      });
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - humidity - error : ${e}`,
      );
    }
    try {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:co2`,
        state: co2Value,
      });
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - co2 - error : ${e}`,
      );
    }
    try {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:pressure`,
        state: pressureValue,
      });
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - pressure - error : ${e}`,
      );
    }
    try {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:absolutePressure`,
        state: absolutePressureValue,
      });
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - absolute pressure - error : ${e}`,
      );
    }
    try {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:noise`,
        state: noiseValue,
      });
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - noise - error : ${e}`,
      );
    }
    try {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:reachable`,
        state: reachableValue,
      });
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - reachable - error : ${e}`,
      );
    }
  } catch (e) {
    logger.error(
      `Netatmo : File netatmo.updateHomeCoachWeather.js - Health Home Coach or weather station - error : ${e}`,
    );
  }
}

module.exports = {
  updateHomeCoachWeather,
};
