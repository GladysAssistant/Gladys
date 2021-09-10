const logger = require('../../../../utils/logger');
const { EVENTS } = require('../constants');

/**
 * @description Poll value of a Netatmo devices
 * @param {string} key - Data received.
 * @param {Object} device - Data received.
 * @param {string} deviceSelector - Data received.
 * @example
 * updateWeatherStation();
 */
async function updateWeatherStation(key, device, deviceSelector) {
  try {
    if (device !== undefined) {
      const minTempValue = this.devices[key].dashboard_data.min_temp;
      const maxTempValue = this.devices[key].dashboard_data.max_temp;

      try {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:min_temp`,
          state: minTempValue,
        });
      } catch (e) {
        logger.error(
          `Netatmo : File netatmo.updateWeatherStation.js - Weather Station ${this.devices[key].type} ${this.devices[key].module_name} - min temp - error : ${e}`,
        );
      }
      try {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:max_temp`,
          state: maxTempValue,
        });
      } catch (e) {
        logger.error(
          `Netatmo : File netatmo.updateWeatherStation.js - Weather Station ${this.devices[key].type} ${this.devices[key].module_name} - max temp - error : ${e}`,
        );
      }
    }
    try {
      // we process the data of the weather station modules
      this.devices[key].modules.forEach(async (module) => {
        try {
          // we back up common data
          const batteryPercentValue = module.battery_percent;
          const reachableModuleValue = module.reachable;

          try {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:battery`,
              state: batteryPercentValue,
            });
          } catch (e) {
            logger.error(
              `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - battery percent - error : ${e}`,
            );
          }
          try {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:reachable`,
              state: reachableModuleValue,
            });
          } catch (e) {
            logger.error(
              `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - reachable - error : ${e}`,
            );
          }
          try {
            // we process the data from the rain gauges
            if (module.data_type[0] === 'Rain') {
              const rainValue = module.dashboard_data.Rain;
              const sumRain1Value = module.dashboard_data.sum_rain_1;
              const sumRain24Value = module.dashboard_data.sum_rain_24;

              try {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${key}:rain`,
                  state: rainValue,
                });
              } catch (e) {
                logger.error(
                  `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - rain - error : ${e}`,
                );
              }
              try {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${key}:sum_rain_1`,
                  state: sumRain1Value,
                });
              } catch (e) {
                logger.error(
                  `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - sum rain 1 hour - error : ${e}`,
                );
              }
              try {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${key}:sum_rain_24`,
                  state: sumRain24Value,
                });
              } catch (e) {
                logger.error(
                  `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - sum rain 24 hours - error : ${e}`,
                );
              }
            }
          } catch (e) {
            logger.error(
              `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - error : ${e}`,
            );
          }
          try {
            // we process the data from the anemometers
            if (module.data_type[0] === 'Wind') {
              const windStrengthValue = module.dashboard_data.WindStrength;
              const windAngleValue = module.dashboard_data.WindAngle;
              const gustStrengthValue = module.dashboard_data.GustStrength;
              const gustAngleValue = module.dashboard_data.GustAngle;
              const maxWindStrValue = module.dashboard_data.max_wind_str;
              const maxWindAngleValue = module.dashboard_data.max_wind_angle;

              try {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${key}:WindStrength`,
                  state: windStrengthValue,
                });
              } catch (e) {
                logger.error(
                  `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - wind strength - error : ${e}`,
                );
              }
              try {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${key}:WindAngle`,
                  state: windAngleValue,
                });
              } catch (e) {
                logger.error(
                  `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - wind angle - error : ${e}`,
                );
              }
              try {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${key}:GustStrength`,
                  state: gustStrengthValue,
                });
              } catch (e) {
                logger.error(
                  `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - gust strength - error : ${e}`,
                );
              }
              try {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${key}:GustAngle`,
                  state: gustAngleValue,
                });
              } catch (e) {
                logger.error(
                  `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - gust angle - error : ${e}`,
                );
              }
              try {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${key}:max_wind_str`,
                  state: maxWindStrValue,
                });
              } catch (e) {
                logger.error(
                  `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - max wind strength - error : ${e}`,
                );
              }
              try {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${key}:max_wind_angle`,
                  state: maxWindAngleValue,
                });
              } catch (e) {
                logger.error(
                  `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - max wind angle - error : ${e}`,
                );
              }
            }
          } catch (e) {
            logger.error(
              `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - error : ${e}`,
            );
          }
          if (module.data_type[0] !== 'Rain' && module.data_type[0] !== 'Wind') {
            try {
              // we save the common data of outdoor and indoor hygrometers
              const temperatureModuleValue = module.dashboard_data.Temperature;
              const humidityModuleValue = module.dashboard_data.Humidity;
              const minTempModuleValue = module.dashboard_data.min_temp;
              const maxTempModuleValue = module.dashboard_data.max_temp;

              try {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${key}:temperature`,
                  state: temperatureModuleValue,
                });
              } catch (e) {
                logger.error(
                  `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - temperature - error : ${e}`,
                );
              }
              try {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${key}:humidity`,
                  state: humidityModuleValue,
                });
              } catch (e) {
                logger.error(
                  `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - humidity - error : ${e}`,
                );
              }
              try {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${key}:min_temp`,
                  state: minTempModuleValue,
                });
              } catch (e) {
                logger.error(
                  `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - min temp - error : ${e}`,
                );
              }
              try {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${key}:max_temp`,
                  state: maxTempModuleValue,
                });
              } catch (e) {
                logger.error(
                  `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - max temp - error : ${e}`,
                );
              }
              // we save other indoor hygrometers data
              if (module.data_type.length === 3) {
                const co2ModuleValue = module.dashboard_data.CO2;
                try {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${key}:co2`,
                    state: co2ModuleValue,
                  });
                } catch (e) {
                  logger.error(
                    `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - co2 - error : ${e}`,
                  );
                }
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station ${module.data_type} ${module.module_name} - Indoor or outdoor - error : ${e}`,
              );
            }
          }
        } catch (e) {
          logger.debug(
            `Netatmo : File netatmo.updateWeatherStation.js - device netatmo ${
              module.data_type ? module.data_type : '"type"'
            } ${module.module_name ? module.module_name : '"name"'} no save in DB - error : ${e}`,
          );
        }
      });
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateWeatherStation.js - Module Weather Station error ${this.devices[key].module_name} - error : ${e}`,
      );
    }
  } catch (e) {
    logger.error(
      `Netatmo : File netatmo.updateWeatherStation.js - Weather Station ${this.devices[key].module_name} - error : ${e}`,
    );
  }
}

module.exports = {
  updateWeatherStation,
};
