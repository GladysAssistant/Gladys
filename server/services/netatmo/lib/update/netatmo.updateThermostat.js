const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { NETATMO_VALUES } = require('../constants');
const { NotFoundError } = require('../../../../utils/coreErrors');

/**
 * @description Update Thermostat value
 * @param {string} key - ID.
 * @param {Object} device - Device.
 * @example
 * updateThermostat();
 */
async function updateThermostat(key, device) {
  try {
    let batteryValue;
    let temperatureValue;
    let setpointTempValue;
    let setpointModeValue;
    let heatPowerRequestValue;
    let reachableValue;
    switch (this.devices[key].type) {
      case 'NATherm1':
        // we process the data from the thermostats
        try {
          batteryValue = this.devices[key].fullData.battery_percent;
          temperatureValue = this.devices[key].fullData.measured.temperature;
          setpointTempValue = this.devices[key].fullData.measured.setpoint_temp;
          heatPowerRequestValue = this.devices[key].fullData.therm_relay_cmd;
          reachableValue = this.devices[key].homeStatus.reachable;
        } catch (e) {
          logger.error(`${this.devices[key].type} ${this.devices[key].name} - save values - ${e}`);
          this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
            type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
            payload: `Error ${this.devices[key].type} ${this.devices[key].name} - save values - ${e}`,
          });
        }
        try {
          setpointModeValue =
            NETATMO_VALUES.ENERGY.SETPOINT_MODE[this.devices[key].fullData.setpoint.setpoint_mode.toUpperCase()];
        } catch (e) {
          logger.error(`${this.devices[key].type} ${this.devices[key].name} - save values - ${e}`);
          this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
            type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
            payload: `Error ${this.devices[key].type} ${this.devices[key].name} - save values - ${e}`,
          });
        }
        break;
      case 'NRV':
        // we process the data from the valves
        try {
          temperatureValue = this.devices[key].room.therm_measured_temperature;
          setpointTempValue = this.devices[key].room.therm_setpoint_temperature;
          heatPowerRequestValue = this.devices[key].room.heating_power_request;
          reachableValue = this.devices[key].homeStatus.reachable;
        } catch (e) {
          logger.error(`${this.devices[key].type} ${this.devices[key].name} - save values - ${e}`);
          this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
            type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
            payload: `Error ${this.devices[key].type} ${this.devices[key].name} - save values - ${e}`,
          });
        }
        try {
          batteryValue = NETATMO_VALUES.BATTERY[this.devices[key].homeStatus.battery_state.toUpperCase()];
        } catch (e) {
          logger.error(`${this.devices[key].type} ${this.devices[key].name} - save values - ${e}`);
          this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
            type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
            payload: `Error ${this.devices[key].type} ${this.devices[key].name} - save values - ${e}`,
          });
        }
        try {
          setpointModeValue =
            NETATMO_VALUES.ENERGY.SETPOINT_MODE[this.devices[key].room.therm_setpoint_mode.toUpperCase()];
        } catch (e) {
          logger.error(`${this.devices[key].type} ${this.devices[key].name} - save values - ${e}`);
          this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
            type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
            payload: `Error ${this.devices[key].type} ${this.devices[key].name} - save values - ${e}`,
          });
        }
        break;
      default:
        logger.debug(`Message type not handled`);
        this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERRORDATA,
          payload: `Error ${this.devices[key].type} ${this.devices[key].name} - type unknown`,
        });
    }
    // we save the common data of thermostats and valves
    if (reachableValue) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:reachable`,
        state: reachableValue,
      });
    }
    if (batteryValue) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:battery`,
        state: batteryValue,
      });
    }
    if (temperatureValue) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:temperature`,
        state: temperatureValue,
      });
    }
    if (setpointTempValue) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:therm_setpoint_temperature`,
        state: setpointTempValue,
      });
    }
    if (setpointModeValue) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:therm_setpoint_mode`,
        state: setpointModeValue,
      });
    }
    if (heatPowerRequestValue) {
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: `netatmo:${key}:heating_power_request`,
        state: heatPowerRequestValue,
      });
    }
  } catch (e) {
    throw new NotFoundError(`NETATMO : File netatmo.updateThermostat.js - error : ${e}`);
  }
}

module.exports = {
  updateThermostat,
};
