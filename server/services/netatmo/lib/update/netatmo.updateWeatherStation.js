const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { getDeviceFeatureBySelector } = require('../../../../utils/device');

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
    let feature;
    if (device !== undefined) {
      const minTempValue = this.devices[key].dashboard_data.min_temp;
      const maxTempValue = this.devices[key].dashboard_data.max_temp;

      try {
        feature = getDeviceFeatureBySelector(device, `${deviceSelector}-min-temp`);
        if (feature.last_value !== minTempValue) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `netatmo:${key}:min_temp`,
            state: minTempValue,
          });
        }
      } catch (e) {
        logger.error(
          `Netatmo : File netatmo.poll.js - Weather Station ${this.devices[key].type} ${this.devices[key].name} - min temp - error : ${e}`,
        );
      }
      try {
        feature = getDeviceFeatureBySelector(device, `${deviceSelector}-max-temp`);
        if (feature.last_value !== maxTempValue) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `netatmo:${key}:max_temp`,
            state: maxTempValue,
          });
        }
      } catch (e) {
        logger.error(
          `Netatmo : File netatmo.poll.js - Weather Station ${this.devices[key].type} ${this.devices[key].name} - max temp - error : ${e}`,
        );
      }
    }
    // we process the data of the weather station modules
    this.devices[key].modules.forEach((module) => {
      try {
        /* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
        const sidModule = module._id;
        const moduleExternalId = `netatmo:${sidModule}`;
        const moduleSelector = moduleExternalId.replace(/:/gi, '-');
        const deviceModule = this.gladys.device.getBySelector(moduleSelector);
        try {
          // we back up common data
          const batteryPercentValue = module.battery_percent;
          const reachableModuleValue = module.reachable;

          try {
            feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-battery`);
            if (feature.last_value !== batteryPercentValue) {
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:battery`,
                state: batteryPercentValue,
              });
            }
          } catch (e) {
            logger.error(
              `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - battery percent - error : ${e}`,
            );
          }
          try {
            feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-reachable`);
            if (feature.last_value !== reachableModuleValue) {
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:reachable`,
                state: reachableModuleValue,
              });
            }
          } catch (e) {
            logger.error(
              `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - reachable - error : ${e}`,
            );
          }

          // we process the data from the rain gauges
          if (module.data_type[0] === 'Rain') {
            const rainValue = module.dashboard_data.Rain;
            const sumRain1Value = module.dashboard_data.sum_rain_1;
            const sumRain24Value = module.dashboard_data.sum_rain_24;

            try {
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-rain`);
              if (feature.last_value !== rainValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:rain`,
                  state: rainValue,
                });
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - rain - error : ${e}`,
              );
            }
            try {
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-sum-rain-1`);
              if (feature.last_value !== sumRain1Value) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:sum_rain_1`,
                  state: sumRain1Value,
                });
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - sum rain 1 hour - error : ${e}`,
              );
            }
            try {
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-sum-rain-24`);
              if (feature.last_value !== sumRain24Value) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:sum_rain_24`,
                  state: sumRain24Value,
                });
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - sum rain 24 hours - error : ${e}`,
              );
            }
          }
        } catch (e) {
          logger.error(`Netatmo : File netatmo.poll.js - ModuleWeather Rain - error : ${e}`);
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
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-windstrength`);
              if (feature.last_value !== windStrengthValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:WindStrength`,
                  state: windStrengthValue,
                });
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - wind strength - error : ${e}`,
              );
            }
            try {
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-windangle`);
              if (feature.last_value !== windAngleValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:WindAngle`,
                  state: windAngleValue,
                });
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - wind angle - error : ${e}`,
              );
            }
            try {
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-guststrength`);
              if (feature.last_value !== gustStrengthValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:GustStrength`,
                  state: gustStrengthValue,
                });
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - gust strength - error : ${e}`,
              );
            }
            try {
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-gustangle`);
              if (feature.last_value !== gustAngleValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:GustAngle`,
                  state: gustAngleValue,
                });
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - gust angle - error : ${e}`,
              );
            }
            try {
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-max-wind-str`);
              if (feature.last_value !== maxWindStrValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:max_wind_str`,
                  state: maxWindStrValue,
                });
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - max wind strength - error : ${e}`,
              );
            }
            try {
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-max-wind-angle`);
              if (feature.last_value !== maxWindAngleValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:max_wind_angle`,
                  state: maxWindAngleValue,
                });
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - max wind angle - error : ${e}`,
              );
            }
          }
        } catch (e) {
          logger.error(`Netatmo : File netatmo.poll.js - ModuleWeather Wind - error : ${e}`);
        }
        if (module.data_type[0] !== 'Rain' && module.data_type[0] !== 'Wind') {
          try {
            // we save the common data of outdoor and indoor hygrometers
            const temperatureModuleValue = module.dashboard_data.Temperature;
            const humidityModuleValue = module.dashboard_data.Humidity;
            const minTempModuleValue = module.dashboard_data.min_temp;
            const maxTempModuleValue = module.dashboard_data.max_temp;

            try {
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-temperature`);
              if (feature.last_value !== temperatureModuleValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:temperature`,
                  state: temperatureModuleValue,
                });
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - temperature - error : ${e}`,
              );
            }
            try {
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-humidity`);
              if (feature.last_value !== humidityModuleValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:humidity`,
                  state: humidityModuleValue,
                });
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - humidity - error : ${e}`,
              );
            }
            try {
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-min-temp`);
              if (feature.last_value !== minTempModuleValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:min_temp`,
                  state: minTempModuleValue,
                });
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - min temp - error : ${e}`,
              );
            }
            try {
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-max-temp`);
              if (feature.last_value !== maxTempModuleValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:max_temp`,
                  state: maxTempModuleValue,
                });
              }
            } catch (e) {
              logger.error(
                `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - max temp - error : ${e}`,
              );
            }
            // we save other indoor hygrometers data
            if (module.data_type.length === 3) {
              const co2ModuleValue = module.dashboard_data.CO2;
              try {
                feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-co2`);
                if (feature.last_value !== co2ModuleValue) {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${sidModule}:co2`,
                    state: co2ModuleValue,
                  });
                }
              } catch (e) {
                logger.error(
                  `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - co2 - error : ${e}`,
                );
              }
            }
          } catch (e) {
            logger.error(
              `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.name} - Indoor or outdoor - error : ${e}`,
            );
          }
        }
      } catch (e) {
        logger.error(
          `Netatmo : File netatmo.poll.js - Module Weather Station ${module.type} ${module.station_name} - error : ${e}`,
        );
      }
    });
  } catch (e) {
    logger.error(`Netatmo : File netatmo.poll.js - Weather Station ${this.devices[key].station_name} - error : ${e}`);
  }
}

module.exports = {
  updateWeatherStation,
};
