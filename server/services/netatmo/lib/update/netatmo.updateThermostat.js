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

        feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-reachable`);
        if (parseInt(feature.last_value, 16) !== parseInt(reachableValue, 16)) {
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
          `Netatmo : File netatmo.updateThermostat.js - Valve ${this.devices[key].type} ${this.devices[key].name} - reachable - error : ${e}`,
        );
      }
    }
    // we save the common data of thermostats and valves
    try {
      feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-battery`);
      if (parseInt(feature.last_value, 16) !== parseInt(batteryValue, 16)) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:battery`,
          state: batteryValue,
        });
      } else {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
          device_feature_external_id: `netatmo:${key}:battery`,
        });
      }
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateThermostat.js - ${this.devices[key].type} ${this.devices[key].name} - battery - error : ${e}`,
      );
    }
    try {
      feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-temperature`);
      if (parseFloat(feature.last_value) !== parseFloat(temperatureValue)) {
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
        `Netatmo : File netatmo.updateThermostat.js - ${this.devices[key].type} ${this.devices[key].name} - temperature - error : ${e}`,
      );
    }
    try {
      feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-therm-setpoint-temperature`);
      if (parseFloat(feature.last_value) !== parseFloat(setpointTempValue)) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:therm_setpoint_temperature`,
          state: setpointTempValue,
        });
      } else {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
          device_feature_external_id: `netatmo:${key}:therm_setpoint_temperature`,
        });
      }
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateThermostat.js - ${this.devices[key].type} ${this.devices[key].name} - therm setpoint temperature - error : ${e}`,
      );
    }
    try {
      feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-therm-setpoint-mode`);
      if (parseInt(feature.last_value, 16) !== parseInt(setpointModeValue, 16)) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:therm_setpoint_mode`,
          state: setpointModeValue,
        });
      } else {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
          device_feature_external_id: `netatmo:${key}:therm_setpoint_mode`,
        });
      }
    } catch (e) {
      logger.error(
        `Netatmo : File netatmo.updateThermostat.js - ${this.devices[key].type} ${this.devices[key].name} - therm setpoint mode - error : ${e}`,
      );
    }
    try {
      feature = await getDeviceFeatureBySelector(device, `${deviceSelector}-heating-power-request`);
      if (parseInt(feature.last_value, 16) !== parseInt(heatPowerRequestValue, 16)) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: `netatmo:${key}:heating_power_request`,
          state: heatPowerRequestValue,
        });
      } else {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE_NO_CHANGED, {
          device_feature_external_id: `netatmo:${key}:heating_power_request`,
        });
      }
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
