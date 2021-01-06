const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { NETATMO_VALUES } = require('../constants');

/**
 * @description Poll value of a Netatmo devices
 * @param {Object} device - The device to control.
 * @example
 * poll(device);
 */
async function poll(device) {
  const axios = require('axios');
  const info = device.external_id.split('netatmo:');
  const sid = info[1];
  try {
    // we process the data from the thermostats
    if (this.devices[sid].type === 'NATherm1') {
      this.getThermostatsData();
      try {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:battery`,
          state: this.devices[sid].battery_percent,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:temperature`,
          state: this.devices[sid].measured.temperature,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:therm_setpoint_temperature`,
          state: this.devices[sid].measured.setpoint_temp,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:therm_setpoint_mode`,
          state: NETATMO_VALUES.ENERGY.SETPOINT_MODE[this.devices[sid].setpoint.setpoint_mode.toUpperCase()],
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:heating_power_request`,
          state: NETATMO_VALUES.ENERGY.HEATING_REQ[this.devices[sid].therm_relay_cmd],
        });
      } catch (e) {
        logger.error(`Netatmo : File netatmo.poll.js - Thermostat - error : ${e}`);
      }
    }

    // we process the data from the valves
    if (this.devices[sid].type === 'NRV') {
      this.getHomeStatusData();
      try {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:battery`,
          state: NETATMO_VALUES.BATTERY[this.devices[sid].homeStatus.battery_state.toUpperCase()],
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:temperature`,
          state: this.devices[sid].room.therm_measured_temperature,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:therm_setpoint_temperature`,
          state: this.devices[sid].room.therm_setpoint_temperature,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:therm_setpoint_mode`,
          state: NETATMO_VALUES.ENERGY.SETPOINT_MODE[this.devices[sid].room.therm_setpoint_mode.toUpperCase()],
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:heating_power_request`,
          state: this.devices[sid].room.heating_power_request,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:reachable`,
          state: this.devices[sid].homeStatus.reachable,
        });
      } catch (e) {
        logger.error(`Netatmo : File netatmo.poll.js - Valve - error : ${e}`);
      }
    }

    // we process the data from the cameras
    if (this.devices[sid].type === 'NACamera' || this.devices[sid].type === 'NOC') {
      this.getHomeData();
      try {
        axios
          .get(`${this.devices[sid].vpn_url}/live/snapshot_720.jpg`, { responseType: 'arraybuffer' })
          .then((response) => {
            const sharp = require('sharp');
            sharp(response.data)
              .rotate()
              .resize(400)
              .toBuffer()
              .then((data) => {
                const btoa = require('btoa');
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
                this.gladys.device.camera.setImage(device.selector, base64image);
              });
          })
          .catch((error) => {
            logger.error(`Netatmo : File netatmo.poll.js - Camera - error : ${error}`);
          });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:power`,
          state: NETATMO_VALUES.SECURITY.LIGHT[this.devices[sid].alim_status.toUpperCase()],
        });
        if (this.devices[sid].type === 'NACamera') {
          this.devices[sid].modules.forEach((module) => {
            const sidModule = module.id;
            try {
              // we process the data of the indoor sirens
              if (this.devices[sidModule].type === 'NIS') {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:battery`,
                  state: this.devices[sidModule].battery_percent,
                });
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:siren`,
                  state: NETATMO_VALUES.SECURITY.SIREN[this.devices[sidModule].status.toUpperCase()],
                });
              }
            } catch (e) {
              logger.error(`Netatmo : File netatmo.poll.js - DoorTag - error : ${e}`);
            }
            try {
              // we process the data from interior door / window opening detectors
              if (this.devices[sidModule].type === 'NACamDoorTag') {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:battery`,
                  state: this.devices[sidModule].battery_percent,
                });
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:doorTag`,
                  state: NETATMO_VALUES.SECURITY.DOOR_TAG[this.devices[sidModule].status.toUpperCase()],
                });
              }
            } catch (e) {
              logger.error(`Netatmo : File netatmo.poll.js - DoorTag - error : ${e}`);
            }
          });
        }
        if (this.devices[sid].type === 'NOC') {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `netatmo:${sid}:light`,
            state: NETATMO_VALUES.SECURITY.LIGHT[this.devices[sid].light_mode_status.toUpperCase()],
          });
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: `netatmo:${sid}:siren`,
            state: NETATMO_VALUES.SECURITY.SIREN[this.devices[sid].siren_status.toUpperCase()],
          });
        }
      } catch (e) {
        logger.error(`Netatmo : File netatmo.poll.js - Camera - error : ${e}`);
      }
    }

    // we process home coach data
    if (this.devices[sid].type === 'NHC') {
      this.getHealthyHomeCoachData();
      try {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:temperature`,
          state: this.devices[sid].dashboard_data.Temperature,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:humidity`,
          state: this.devices[sid].dashboard_data.Humidity,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:co2`,
          state: this.devices[sid].dashboard_data.CO2,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:pressure`,
          state: this.devices[sid].dashboard_data.Pressure,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:absolutePressure`,
          state: this.devices[sid].dashboard_data.AbsolutePressure,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:noise`,
          state: this.devices[sid].dashboard_data.Noise,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:health_idx`,
          state: this.devices[sid].dashboard_data.health_idx,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:reachable`,
          state: this.devices[sid].reachable,
        });
      } catch (e) {
        logger.error(`Netatmo : File netatmo.poll.js - Health Home Coach - error : ${e}`);
      }
    }

    // we process data from weather stations
    if (this.devices[sid].type === 'NAMain') {
      this.getStationsData();
      try {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:temperature`,
          state: this.devices[sid].dashboard_data.Temperature,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:humidity`,
          state: this.devices[sid].dashboard_data.Humidity,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:co2`,
          state: this.devices[sid].dashboard_data.CO2,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:pressure`,
          state: this.devices[sid].dashboard_data.Pressure,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:absolutePressure`,
          state: this.devices[sid].dashboard_data.AbsolutePressure,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:noise`,
          state: this.devices[sid].dashboard_data.Noise,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:min_temp`,
          state: this.devices[sid].dashboard_data.min_temp,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:max_temp`,
          state: this.devices[sid].dashboard_data.max_temp,
        });
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${sid}:reachable`,
          state: this.devices[sid].reachable,
        });
        // we process the data of the weather station modules
        this.devices[sid].modules.forEach((module) => {
          /* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
          const sidModule = module._id;
          try {
            // we process the data from the rain gauges
            if (module.data_type[0] === 'Rain') {
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:rain`,
                state: this.devices[sidModule].dashboard_data.Rain,
              });
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:sum_rain_1`,
                state: this.devices[sidModule].dashboard_data.sum_rain_1,
              });
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:sum_rain_24`,
                state: this.devices[sidModule].dashboard_data.sum_rain_24,
              });
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:battery`,
                state: this.devices[sidModule].battery_percent,
              });
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:reachable`,
                state: this.devices[sidModule].reachable,
              });
            }
          } catch (e) {
            logger.error(`Netatmo : File netatmo.poll.js - Rain - error : ${e}`);
          }
          try {
            // we process the data from the anemometers
            if (module.data_type[0] === 'Wind') {
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:WindStrength`,
                state: this.devices[sidModule].dashboard_data.WindStrength,
              });
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:WindAngle`,
                state: this.devices[sidModule].dashboard_data.WindAngle,
              });
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:GustStrength`,
                state: this.devices[sidModule].dashboard_data.GustStrength,
              });
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:GustAngle`,
                state: this.devices[sidModule].dashboard_data.GustAngle,
              });
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:max_wind_str`,
                state: this.devices[sidModule].dashboard_data.max_wind_str,
              });
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:max_wind_angle`,
                state: this.devices[sidModule].dashboard_data.max_wind_angle,
              });
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:battery`,
                state: this.devices[sidModule].battery_percent,
              });
              this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                device_feature_external_id: `netatmo:${sidModule}:reachable`,
                state: this.devices[sidModule].reachable,
              });
            }
          } catch (e) {
            logger.error(`Netatmo : File netatmo.poll.js - Wind - error : ${e}`);
          }
          if (module.data_type[0] !== 'Rain' && module.data_type[0] !== 'Wind') {
            try {
              // we process the data from outdoor hygrometers
              if (module.data_type.length === 2) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:temperature`,
                  state: this.devices[sidModule].dashboard_data.Temperature,
                });
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:humidity`,
                  state: this.devices[sidModule].dashboard_data.Humidity,
                });
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:min_temp`,
                  state: this.devices[sidModule].dashboard_data.min_temp,
                });
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:max_temp`,
                  state: this.devices[sidModule].dashboard_data.max_temp,
                });
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:battery`,
                  state: this.devices[sidModule].battery_percent,
                });
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:reachable`,
                  state: this.devices[sidModule].reachable,
                });
                // we process the data from indoor hygrometers
              } else if (module.data_type.length === 3) {
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:temperature`,
                  state: this.devices[sidModule].dashboard_data.Temperature,
                });
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:humidity`,
                  state: this.devices[sidModule].dashboard_data.Humidity,
                });
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:co2`,
                  state: this.devices[sidModule].dashboard_data.CO2,
                });
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:min_temp`,
                  state: this.devices[sidModule].dashboard_data.min_temp,
                });
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:max_temp`,
                  state: this.devices[sidModule].dashboard_data.max_temp,
                });
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:battery`,
                  state: this.devices[sidModule].battery_percent,
                });
                this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
                  device_feature_external_id: `netatmo:${sidModule}:reachable`,
                  state: this.devices[sidModule].reachable,
                });
              }
            } catch (e) {
              logger.error(`Netatmo : File netatmo.poll.js - Module - error : ${e}`);
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
}

module.exports = {
  poll,
};
