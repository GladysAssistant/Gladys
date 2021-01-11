const axios = require('axios');
const sharp = require('sharp');
const btoa = require('btoa');
const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { NETATMO_VALUES } = require('../constants');
const { getDeviceFeatureBySelector } = require('../../../../utils/device');

/**
 * @description Poll value of a Netatmo devices
 * @example
 * pollManual();
 */
async function pollManual() {
  await this.getThermostatsData();
  await this.getHomeStatusData();
  await this.getHomeData();
  await this.getHealthyHomeCoachData();
  await this.getStationsData();
  Object.keys(this.devices).forEach((key) => {
    let deviceExternalId;
    if (this.devices[key].id !== undefined) {
      deviceExternalId = `netatmo:${this.devices[key].id}`;
    } else {
      deviceExternalId = `netatmo:${this.devices[key]._id}`;
    }
    const deviceSelector = deviceExternalId.replace(/:/gi, '-');
    const device = this.gladys.device.getBySelector(deviceSelector);
    try {
      if (this.devices[key].type === 'NATherm1' || this.devices[key].type === 'NRV') {
        try {
          let batteryValue;
          let temperatureValue;
          let setpointTempValue;
          let setpointModeValue;
          let heatPowerRequestValue;
          let feature;
          // we process the data from the thermostats
          if (this.devices[key].type === 'NATherm1') {
            try {
              batteryValue = this.devices[key].battery_percent;
              temperatureValue = this.devices[key].measured.temperature;
              setpointTempValue = this.devices[key].measured.setpoint_temp;
              setpointModeValue =
                NETATMO_VALUES.ENERGY.SETPOINT_MODE[this.devices[key].setpoint.setpoint_mode.toUpperCase()];
              heatPowerRequestValue = NETATMO_VALUES.ENERGY.HEATING_REQ[this.devices[key].therm_relay_cmd];
            } catch (e) {
              logger.error(`Netatmo : File netatmo.poll.js - Thermostat - error : ${e}`);
            }
          }
          // we process the data from the valves
          if (this.devices[key].type === 'NRV') {
            try {
              batteryValue = NETATMO_VALUES.BATTERY[this.devices[key].homeStatus.battery_state.toUpperCase()];
              temperatureValue = this.devices[key].room.therm_measured_temperature;
              setpointTempValue = this.devices[key].room.therm_setpoint_temperature;
              setpointModeValue =
                NETATMO_VALUES.ENERGY.SETPOINT_MODE[this.devices[key].room.therm_setpoint_mode.toUpperCase()];
              heatPowerRequestValue = this.devices[key].room.heating_power_request;
              const reachableValue = this.devices[key].homeStatus.reachable;

              feature = getDeviceFeatureBySelector(device, `${deviceSelector}-reachable`);
              if (feature.last_value !== reachableValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${key}:reachable`,
                  state: reachableValue,
                });
              }
            } catch (e) {
              logger.error(`Netatmo : File netatmo.poll.js - Valve - error : ${e}`);
            }
          }
          // we save the common data of thermostats and valves
          feature = getDeviceFeatureBySelector(device, `${deviceSelector}-battery`);
          if (feature.last_value !== batteryValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:battery`,
              state: batteryValue,
            });
          }
          feature = getDeviceFeatureBySelector(device, `${deviceSelector}-temperature`);
          if (feature.last_value !== temperatureValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:temperature`,
              state: temperatureValue,
            });
          }
          feature = getDeviceFeatureBySelector(device, `${deviceSelector}-therm-setpoint-temperature`);
          if (feature.last_value !== setpointTempValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:therm_setpoint_temperature`,
              state: setpointTempValue,
            });
          }
          feature = getDeviceFeatureBySelector(device, `${deviceSelector}-therm-setpoint-mode`);
          if (feature.last_value !== setpointModeValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:therm_setpoint_mode`,
              state: setpointModeValue,
            });
          }
          feature = getDeviceFeatureBySelector(device, `${deviceSelector}-heating-power-request`);
          if (feature.last_value !== heatPowerRequestValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:heating_power_request`,
              state: heatPowerRequestValue,
            });
          }
        } catch (e) {
          logger.error(`Netatmo : File netatmo.poll.js - Thermostat or Valve - error : ${e}`);
        }
      }

      // we process the data from the cameras
      if (this.devices[key].type === 'NACamera' || this.devices[key].type === 'NOC') {
        const externalIdCamera = `netatmo:${this.devices[key].id}`;
        const selectorCamera = externalIdCamera.replace(/:/gi, '-');
        try {
          axios
            .get(`${this.devices[key].vpn_url}/live/snapshot_720.jpg`, { responseType: 'arraybuffer' })
            .then((response) => {
              sharp(response.data)
                .rotate()
                .resize(400)
                .toBuffer()
                .then((data) => {
                  const b64encoded = btoa(
                    [].reduce.call(
                      new Uint8Array(data),
                      function(p, c) {
                        return p + String.fromCharCode(c);
                      },
                      '',
                    ),
                  );
                  const mimetype = 'image/jpeg';
                  const base64image = `data:${mimetype};base64,${b64encoded}`;
                  this.gladys.device.camera.setImage(selectorCamera, base64image);
                });
            })
            .catch((error) => {
              logger.error(`Netatmo : File netatmo.poll.js - Camera - error : ${error}`);
            });

          const powerValue = NETATMO_VALUES.SECURITY.LIGHT[this.devices[key].alim_status.toUpperCase()];
          let feature = getDeviceFeatureBySelector(device, `${deviceSelector}-power`);
          if (feature.last_value !== powerValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:power`,
              state: powerValue,
            });
          }
          if (this.devices[key].type === 'NACamera') {
            this.devices[key].modules.forEach((module) => {
              const sidModule = module.id;
              const moduleExternalId = `netatmo:${sidModule}`;
              const moduleSelector = moduleExternalId.replace(/:/gi, '-');
              const deviceModule = this.gladys.device.getBySelector(moduleSelector);
              try {
                // we save the common data of home coaches and weather stations
                if (this.devices[sidModule].type === 'NIS' || this.devices[sidModule].type === 'NACamDoorTag') {
                  const batteryValue = this.devices[sidModule].battery_percent;
                  feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-battery`);
                  if (feature.last_value !== batteryValue) {
                    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                      device_feature_external_id: `netatmo:${sidModule}:battery`,
                      state: batteryValue,
                    });
                  }
                }
              } catch (e) {
                logger.error(`Netatmo : File netatmo.poll.js - Sirene or DoorTag - error : ${e}`);
              }
              try {
                // we save other indoor sirens data
                if (this.devices[sidModule].type === 'NIS') {
                  const sirenValue = NETATMO_VALUES.SECURITY.SIREN[this.devices[sidModule].status.toUpperCase()];
                  feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-siren`);
                  if (feature.last_value !== sirenValue) {
                    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                      device_feature_external_id: `netatmo:${sidModule}:siren`,
                      state: sirenValue,
                    });
                  }
                }
              } catch (e) {
                logger.error(`Netatmo : File netatmo.poll.js - Sirene - error : ${e}`);
              }
              try {
                // we save other interior door / window opening detectors data
                if (this.devices[sidModule].type === 'NACamDoorTag') {
                  const doorTagValue = NETATMO_VALUES.SECURITY.DOOR_TAG[this.devices[sidModule].status.toUpperCase()];
                  feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-doortag`);
                  if (feature.last_value !== doorTagValue) {
                    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                      device_feature_external_id: `netatmo:${sidModule}:doorTag`,
                      state: doorTagValue,
                    });
                  }
                }
              } catch (e) {
                logger.error(`Netatmo : File netatmo.poll.js - DoorTag - error : ${e}`);
              }
            });
          }
          if (this.devices[key].type === 'NOC') {
            const lightValue = NETATMO_VALUES.SECURITY.LIGHT[this.devices[key].light_mode_status.toUpperCase()];
            const sirenValue = NETATMO_VALUES.SECURITY.SIREN[this.devices[key].siren_status.toUpperCase()];
            feature = getDeviceFeatureBySelector(device, `${deviceSelector}-light`);
            if (feature.last_value !== lightValue) {
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${key}:light`,
                state: lightValue,
              });
            }
            feature = getDeviceFeatureBySelector(device, `${deviceSelector}-siren`);
            if (feature.last_value !== sirenValue) {
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${key}:siren`,
                state: sirenValue,
              });
            }
          }
        } catch (e) {
          logger.error(`Netatmo : File netatmo.poll.js - Camera - error : ${e}`);
        }
      }

      // we save the common data of home coaches and weather stations
      if (this.devices[key].type === 'NHC' || this.devices[key].type === 'NAMain') {
        try {
          const temperatureValue = this.devices[key].dashboard_data.Temperature;
          const humidityValue = this.devices[key].dashboard_data.Humidity;
          const co2Value = this.devices[key].dashboard_data.CO2;
          const pressureValue = this.devices[key].dashboard_data.Pressure;
          const absolutePressureValue = this.devices[key].dashboard_data.AbsolutePressure;
          const noiseValue = this.devices[key].dashboard_data.Noise;
          const reachableValue = this.devices[key].reachable;

          let feature = getDeviceFeatureBySelector(device, `${deviceSelector}-temperature`);
          if (feature.last_value !== temperatureValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:temperature`,
              state: temperatureValue,
            });
          }
          feature = getDeviceFeatureBySelector(device, `${deviceSelector}-humidity`);
          if (feature.last_value !== humidityValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:humidity`,
              state: humidityValue,
            });
          }
          feature = getDeviceFeatureBySelector(device, `${deviceSelector}-co2`);
          if (feature.last_value !== co2Value) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:co2`,
              state: co2Value,
            });
          }
          feature = getDeviceFeatureBySelector(device, `${deviceSelector}-pressure`);
          if (feature.last_value !== pressureValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:pressure`,
              state: pressureValue,
            });
          }
          feature = getDeviceFeatureBySelector(device, `${deviceSelector}-absolutepressure`);
          if (feature.last_value !== absolutePressureValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:absolutePressure`,
              state: absolutePressureValue,
            });
          }
          feature = getDeviceFeatureBySelector(device, `${deviceSelector}-noise`);
          if (feature.last_value !== noiseValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:noise`,
              state: noiseValue,
            });
          }
          feature = getDeviceFeatureBySelector(device, `${deviceSelector}-reachable`);
          if (feature.last_value !== reachableValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:reachable`,
              state: reachableValue,
            });
          }
        } catch (e) {
          logger.error(`Netatmo : File netatmo.poll.js - Health Home Coach or  weather station - error : ${e}`);
        }
      }

      // we save other home coach data
      if (this.devices[key].type === 'NHC') {
        try {
          const healthIndexValue = this.devices[key].dashboard_data.health_idx;

          const feature = getDeviceFeatureBySelector(device, `${deviceSelector}-health-idx`);
          if (feature.last_value !== healthIndexValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:health_idx`,
              state: healthIndexValue,
            });
          }
        } catch (e) {
          logger.error(`Netatmo : File netatmo.poll.js - Health Home Coach - error : ${e}`);
        }
      }

      // we save the other weather station data
      if (this.devices[key].type === 'NAMain') {
        try {
          const minTempValue = this.devices[key].dashboard_data.min_temp;
          const maxTempValue = this.devices[key].dashboard_data.max_temp;

          let feature = getDeviceFeatureBySelector(device, `${deviceSelector}-min-temp`);
          if (feature.last_value !== minTempValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:min_temp`,
              state: minTempValue,
            });
          }
          feature = getDeviceFeatureBySelector(device, `${deviceSelector}-max-temp`);
          if (feature.last_value !== maxTempValue) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: `netatmo:${key}:max_temp`,
              state: maxTempValue,
            });
          }
          // we process the data of the weather station modules
          this.devices[key].modules.forEach((module) => {
            /* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
            const sidModule = module._id;
            const moduleExternalId = `netatmo:${sidModule}`;
            const moduleSelector = moduleExternalId.replace(/:/gi, '-');
            const deviceModule = this.gladys.device.getBySelector(moduleSelector);
            try {
              // we back up common data
              const batteryPercentValue = this.devices[sidModule].battery_percent;
              const reachableModuleValue = this.devices[sidModule].reachable;

              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-battery`);
              if (feature.last_value !== batteryPercentValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:battery`,
                  state: batteryPercentValue,
                });
              }
              feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-reachable`);
              if (feature.last_value !== reachableModuleValue) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:reachable`,
                  state: reachableModuleValue,
                });
              }

              // we process the data from the rain gauges
              if (module.data_type[0] === 'Rain') {
                const rainValue = this.devices[sidModule].dashboard_data.Rain;
                const sumRain1Value = this.devices[sidModule].dashboard_data.sum_rain_1;
                const sumRain24Value = this.devices[sidModule].dashboard_data.sum_rain_24;

                feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-rain`);
                if (feature.last_value !== rainValue) {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${sidModule}:rain`,
                    state: rainValue,
                  });
                }
                feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-sum-rain-1`);
                if (feature.last_value !== sumRain1Value) {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${sidModule}:sum_rain_1`,
                    state: sumRain1Value,
                  });
                }
                feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-sum-rain-24`);
                if (feature.last_value !== sumRain24Value) {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${sidModule}:sum_rain_24`,
                    state: sumRain24Value,
                  });
                }
              }
            } catch (e) {
              logger.error(`Netatmo : File netatmo.poll.js - ModuleWeather Rain - error : ${e}`);
            }
            try {
              // we process the data from the anemometers
              if (module.data_type[0] === 'Wind') {
                const windStrengthValue = this.devices[sidModule].dashboard_data.WindStrength;
                const windAngleValue = this.devices[sidModule].dashboard_data.WindAngle;
                const gustStrengthValue = this.devices[sidModule].dashboard_data.GustStrength;
                const gustAngleValue = this.devices[sidModule].dashboard_data.GustAngle;
                const maxWindStrValue = this.devices[sidModule].dashboard_data.max_wind_str;
                const maxWindAngleValue = this.devices[sidModule].dashboard_data.max_wind_angle;

                feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-windstrength`);
                if (feature.last_value !== windStrengthValue) {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${sidModule}:WindStrength`,
                    state: windStrengthValue,
                  });
                }
                feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-windangle`);
                if (feature.last_value !== windAngleValue) {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${sidModule}:WindAngle`,
                    state: windAngleValue,
                  });
                }
                feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-guststrength`);
                if (feature.last_value !== gustStrengthValue) {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${sidModule}:GustStrength`,
                    state: gustStrengthValue,
                  });
                }
                feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-gustangle`);
                if (feature.last_value !== gustAngleValue) {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${sidModule}:GustAngle`,
                    state: gustAngleValue,
                  });
                }
                feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-max-wind-str`);
                if (feature.last_value !== maxWindStrValue) {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${sidModule}:max_wind_str`,
                    state: maxWindStrValue,
                  });
                }
                feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-max-wind-angle`);
                if (feature.last_value !== maxWindAngleValue) {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${sidModule}:max_wind_angle`,
                    state: maxWindAngleValue,
                  });
                }
              }
            } catch (e) {
              logger.error(`Netatmo : File netatmo.poll.js - ModuleWeather Wind - error : ${e}`);
            }
            if (module.data_type[0] !== 'Rain' && module.data_type[0] !== 'Wind') {
              try {
                // we save the common data of outdoor and indoor hygrometers
                const temperatureModuleValue = this.devices[sidModule].dashboard_data.Temperature;
                const humidityModuleValue = this.devices[sidModule].dashboard_data.Humidity;
                const minTempModuleValue = this.devices[sidModule].dashboard_data.min_temp;
                const maxTempModuleValue = this.devices[sidModule].dashboard_data.max_temp;

                feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-temperature`);
                if (feature.last_value !== temperatureModuleValue) {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${sidModule}:temperature`,
                    state: temperatureModuleValue,
                  });
                }
                feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-humidity`);
                if (feature.last_value !== humidityModuleValue) {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${sidModule}:humidity`,
                    state: humidityModuleValue,
                  });
                }
                feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-min-temp`);
                if (feature.last_value !== minTempModuleValue) {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${sidModule}:min_temp`,
                    state: minTempModuleValue,
                  });
                }
                feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-max-temp`);
                if (feature.last_value !== maxTempModuleValue) {
                  this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                    device_feature_external_id: `netatmo:${sidModule}:max_temp`,
                    state: maxTempModuleValue,
                  });
                }
                // we save other indoor hygrometers data
                if (module.data_type.length === 3) {
                  const co2ModuleValue = this.devices[sidModule].dashboard_data.CO2;

                  feature = getDeviceFeatureBySelector(deviceModule, `${moduleSelector}-co2`);
                  if (feature.last_value !== co2ModuleValue) {
                    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                      device_feature_external_id: `netatmo:${sidModule}:co2`,
                      state: co2ModuleValue,
                    });
                  }
                }
              } catch (e) {
                logger.error(`Netatmo : File netatmo.poll.js - ModuleWeather Indoor or outdoor - error : ${e}`);
              }
            }
          });
        } catch (e) {
          logger.error(`Netatmo : File netatmo.poll.js - Weather - error : ${e}`);
        }
      }
    } catch (e) {
      logger.error(`Netatmo : File netatmo.poll.js - error : ${e}`);
    }
  });
}

module.exports = {
  pollManual,
};
