const logger = require('../../../../utils/logger');
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
    // we process the data from the thermostats
    if (this.devices[key].type === 'NATherm1') {
      try {
        batteryValue = this.devices[key].battery_percent;
        temperatureValue = this.devices[key].measured.temperature;
        setpointTempValue = this.devices[key].measured.setpoint_temp;
        setpointModeValue = NETATMO_VALUES.ENERGY.SETPOINT_MODE[this.devices[key].setpoint.setpoint_mode.toUpperCase()];
        heatPowerRequestValue = this.devices[key].therm_relay_cmd;
      } catch (e) {
        logger.error(
          `Netatmo : File netatmo.updateThermostat.js - ${this.devices[key].type} ${this.devices[key].name} - save values - error : ${e}`,
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
        await this.updateFeature(key, device, deviceSelector, 'reachable', reachableValue);
      } catch (e) {
        logger.error(
          `Netatmo : File netatmo.updateThermostat.js - Valve ${this.devices[key].type} ${this.devices[key].name} - reachable - error : ${e}`,
        );
      }
    }
    // we save the common data of thermostats and valves
    try {
      await this.updateFeature(key, device, deviceSelector, 'battery', batteryValue);
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateThermostat.js - ${this.devices[key].type} ${this.devices[key].name} - battery - error : ${e}`,
      );
    }
    try {
      await this.updateFeature(key, device, deviceSelector, 'temperature', temperatureValue);
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateThermostat.js - ${this.devices[key].type} ${this.devices[key].name} - temperature - error : ${e}`,
      );
    }
    try {
      await this.updateFeature(key, device, deviceSelector, 'therm_setpoint_temperature', setpointTempValue);
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateThermostat.js - ${this.devices[key].type} ${this.devices[key].name} - therm setpoint temperature - error : ${e}`,
      );
    }
    try {
      await this.updateFeature(key, device, deviceSelector, 'therm_setpoint_mode', setpointModeValue);
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateThermostat.js - ${this.devices[key].type} ${this.devices[key].name} - therm setpoint mode - error : ${e}`,
      );
    }
    try {
      await this.updateFeature(key, device, deviceSelector, 'heating_power_request', heatPowerRequestValue);
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateThermostat.js - ${this.devices[key].type} ${this.devices[key].name} - heating power request - error : ${e}`,
      );
    }
  } catch (e) {
    logger.error(
      `Netatmo : File netatmo.updateThermostat.js - ${this.devices[key] ? this.devices[key].type : '"type"'} ${
        this.devices[key] ? this.devices[key].name : '"name"'
      } - error : ${e}`,
    );
  }
}

module.exports = {
  updateThermostat,
};
