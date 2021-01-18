const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
const { getDeviceFeatureBySelector } = require('../../../../utils/device');
const { NETATMO_VALUES } = require('../constants');

/**
 * @description Poll value of a Netatmo devices
 * @param {string} key - Data received.
 * @param {Object} device - Data received.
 * @param {string} deviceSelector - Data received.
 * @example
 * updateThermostat();
 */
async function updateThermostat(key, device, deviceSelector) {
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
        setpointModeValue = NETATMO_VALUES.ENERGY.SETPOINT_MODE[this.devices[key].setpoint.setpoint_mode.toUpperCase()];
        heatPowerRequestValue = NETATMO_VALUES.ENERGY.HEATING_REQ[this.devices[key].therm_relay_cmd];
      } catch (e) {
        logger.error(
          `Netatmo : File netatmo.poll.js - ${this.devices[key].type} ${this.devices[key].name} - save values - error : ${e}`,
        );
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
        logger.error(
          `Netatmo : File netatmo.poll.js - Valve ${this.devices[key].type} ${this.devices[key].name} - reachable - error : ${e}`,
        );
      }
    }
    // we save the common data of thermostats and valves
    try {
      feature = getDeviceFeatureBySelector(device, `${deviceSelector}-battery`);
      if (feature.last_value !== batteryValue) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:battery`,
          state: batteryValue,
        });
      }
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.poll.js - ${this.devices[key].type} ${this.devices[key].name} - battery - error : ${e}`,
      );
    }
    try {
      feature = getDeviceFeatureBySelector(device, `${deviceSelector}-temperature`);
      if (feature.last_value !== temperatureValue) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:temperature`,
          state: temperatureValue,
        });
      }
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.poll.js - ${this.devices[key].type} ${this.devices[key].name} - temperature - error : ${e}`,
      );
    }
    try {
      feature = getDeviceFeatureBySelector(device, `${deviceSelector}-therm-setpoint-temperature`);
      if (feature.last_value !== setpointTempValue) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:therm_setpoint_temperature`,
          state: setpointTempValue,
        });
      }
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.poll.js - ${this.devices[key].type} ${this.devices[key].name} - therm setpoint temperature - error : ${e}`,
      );
    }
    try {
      feature = getDeviceFeatureBySelector(device, `${deviceSelector}-therm-setpoint-mode`);
      if (feature.last_value !== setpointModeValue) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:therm_setpoint_mode`,
          state: setpointModeValue,
        });
      }
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.poll.js - ${this.devices[key].type} ${this.devices[key].name} - therm setpoint mode - error : ${e}`,
      );
    }
    try {
      feature = getDeviceFeatureBySelector(device, `${deviceSelector}-heating-power-request`);
      if (feature.last_value !== heatPowerRequestValue) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:heating_power_request`,
          state: heatPowerRequestValue,
        });
      }
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.poll.js - ${this.devices[key].type} ${this.devices[key].name} - heating power request - error : ${e}`,
      );
    }
  } catch (e) {
    logger.error(`Netatmo : File netatmo.poll.js - ${this.devices[key].type} ${this.devices[key].name} - error : ${e}`);
  }
}

module.exports = {
  updateThermostat,
};
