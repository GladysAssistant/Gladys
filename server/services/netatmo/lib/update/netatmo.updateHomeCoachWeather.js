const logger = require('../../../../utils/logger');

/**
 * @description Poll value of a Netatmo devices
 * @param {string} key - Data received.
 * @param {Object} device - Data received.
 * @param {string} deviceSelector - Data received.
 * @example
 * updateHomeCoachWeather();
 */
async function updateHomeCoachWeather(key, device, deviceSelector) {
  try {
    const temperatureValue = this.devices[key].dashboard_data.Temperature;
    const humidityValue = this.devices[key].dashboard_data.Humidity;
    const co2Value = this.devices[key].dashboard_data.CO2;
    const pressureValue = this.devices[key].dashboard_data.Pressure;
    const absolutePressureValue = this.devices[key].dashboard_data.AbsolutePressure;
    const noiseValue = this.devices[key].dashboard_data.Noise;
    const reachableValue = this.devices[key].reachable;
    try {
      await this.updateFeature(key, device, deviceSelector, 'temperature', temperatureValue);
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - temperature - error : ${e}`,
      );
    }
    try {
      await this.updateFeature(key, device, deviceSelector, 'humidity', humidityValue);
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - humidity - error : ${e}`,
      );
    }
    try {
      await this.updateFeature(key, device, deviceSelector, 'co2', co2Value);
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - co2 - error : ${e}`,
      );
    }
    try {
      await this.updateFeature(key, device, deviceSelector, 'pressure', pressureValue);
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - pressure - error : ${e}`,
      );
    }
    try {
      await this.updateFeature(key, device, deviceSelector, 'absolutePressure', absolutePressureValue);
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - absolute pressure - error : ${e}`,
      );
    }
    try {
      await this.updateFeature(key, device, deviceSelector, 'noise', noiseValue);
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - noise - error : ${e}`,
      );
    }
    try {
      await this.updateFeature(key, device, deviceSelector, 'reachable', reachableValue);
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
