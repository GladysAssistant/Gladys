const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { getDeviceFeatureBySelector } = require('../../../../utils/device');

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
    let feature;
    const temperatureValue = this.devices[key].dashboard_data.Temperature;
    const humidityValue = this.devices[key].dashboard_data.Humidity;
    const co2Value = this.devices[key].dashboard_data.CO2;
    const pressureValue = this.devices[key].dashboard_data.Pressure;
    const absolutePressureValue = this.devices[key].dashboard_data.AbsolutePressure;
    const noiseValue = this.devices[key].dashboard_data.Noise;
    const reachableValue = this.devices[key].reachable;

    try {
      feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-temperature`);
      if (feature.last_value !== temperatureValue) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:temperature`,
          state: temperatureValue,
        });
      } else {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
          device_feature_external_id: `netatmo:${key}:temperature`,
        });
      }
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - temperature - error : ${e}`,
      );
    }
    try {
      feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-humidity`);
      if (feature.last_value !== humidityValue) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:humidity`,
          state: humidityValue,
        });
      } else {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
          device_feature_external_id: `netatmo:${key}:humidity`,
        });
      }
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - humidity - error : ${e}`,
      );
    }
    try {
      feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-co2`);
      if (feature.last_value !== co2Value) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:co2`,
          state: co2Value,
        });
      } else {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
          device_feature_external_id: `netatmo:${key}:co2`,
        });
      }
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - co2 - error : ${e}`,
      );
    }
    try {
      feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-pressure`);
      if (feature.last_value !== pressureValue) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:pressure`,
          state: pressureValue,
        });
      } else {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
          device_feature_external_id: `netatmo:${key}:pressure`,
        });
      }
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - pressure - error : ${e}`,
      );
    }
    try {
      feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-absolutepressure`);
      if (feature.last_value !== absolutePressureValue) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:absolutePressure`,
          state: absolutePressureValue,
        });
      } else {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
          device_feature_external_id: `netatmo:${key}:absolutePressure`,
        });
      }
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - absolute pressure - error : ${e}`,
      );
    }
    try {
      feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-noise`);
      if (feature.last_value !== noiseValue) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:noise`,
          state: noiseValue,
        });
      } else {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
          device_feature_external_id: `netatmo:${key}:noise`,
        });
      }
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateHomeCoachWeather.js - ${this.devices[key].type} ${this.devices[key].station_name} - noise - error : ${e}`,
      );
    }
    try {
      feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-reachable`);
      if (feature.last_value !== reachableValue) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:reachable`,
          state: reachableValue,
        });
      } else {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
          device_feature_external_id: `netatmo:${key}:reachable`,
        });
      }
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
