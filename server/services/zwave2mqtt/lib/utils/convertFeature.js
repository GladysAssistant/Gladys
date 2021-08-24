const logger = require('../../../../utils/logger');
const { getDeviceFeatureExternalId } = require('./externalId');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS_BY_CATEGORY,
} = require('../../../../utils/constants');
const { COMMAND_CLASSES } = require('../constants');

/**
 * @description Find for the features linked to the Z-Wave device.
 * @param {Object} device - Z-Wave device.
 * @param {Object} cmd - Z-Wave command class.
 * @returns {Object} Gladys features.
 * @example
 * convertFeature(device, cmd);
 */
function convertFeature(device, cmd) {
  let feature;

  const externalId = getDeviceFeatureExternalId({
    node_id: device.id,
    class_id: cmd.commandClass,
    instance: cmd.endpoint,
    propertyKey:
      cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_METER ||
      cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_CENTRAL_SCENE
        ? `${cmd.property.toString().replace(' ', '_')}/${cmd.propertyKey}`
        : cmd.property.toString().replace(' ', '_'),
  });

  const defaultFeature = {
    name: cmd.label,
    external_id: externalId,
    min: cmd.min || 0,
    max: cmd.max || 1,
    unit: cmd.unit,
    read_only: cmd.targetValue !== undefined ? false : !cmd.writeable,
    has_feedback: cmd.targetValue !== undefined,
    keep_history: true,
    selector: `${device.id} - ${device.name} ${cmd.label} ${cmd.endpoint}`,
  };

  if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_BASIC) {
    // Basic
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_CONFIGURATION) {
    // Configuraton managed by zwave2mqtt
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_PROTECTION) {
    // Protection
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_VERSION) {
    // Library type
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_MANUFACTURER_SPECIFIC) {
    // Manufacturer managed by zwave2mqtt
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_CENTRAL_SCENE) {
    // Central scene
    if (cmd.property === 'scene') {
      feature = Object.assign({}, defaultFeature, {
        category: DEVICE_FEATURE_CATEGORIES.BUTTON,
        type: DEVICE_FEATURE_TYPES.BUTTON.CLICK,
      });
    }
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_ALARM) {
    // - Sensor status
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_WAKE_UP) {
    // Wake up
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_BATTERY) {
    // Battery
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY) {
    // "Binary Switch"
    if (cmd.property === 'currentValue') {
      feature = Object.assign({}, defaultFeature, {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      });
    }
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL) {
    // "Multilevel Switch"
    // duration
    if (cmd.property === 'currentValue') {
      feature = Object.assign({}, defaultFeature, {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.DIMMER,
      });
    } else if (cmd.property === 'targetValue') {
      //
    }
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SCENE_ACTIVATION) {
    // "Scene Activation"
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SENSOR_BINARY) {
    // 'Binary Sensor'
    if (cmd.property === 'Motion') {
      feature = Object.assign({}, defaultFeature, {
        category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      });
    } else if (cmd.property === 'Any') {
      //
    }
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SENSOR_MULTILEVEL) {
    // "Multilevel Sensor"
    if (cmd.property === 'Illuminance') {
      feature = Object.assign({}, defaultFeature, {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        max: 255,
      });
    } else if (cmd.property === 'Humidity') {
      feature = Object.assign({}, defaultFeature, {
        category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS_BY_CATEGORY[DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR],
        max: 100,
      });
    } else if (cmd.property === 'Air temperature') {
      feature = Object.assign({}, defaultFeature, {
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS_BY_CATEGORY[DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR],
        min: -30,
        max: 100,
      });
    } else if (cmd.property === 'Ultraviolet') {
      // No category
    }
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_METER) {
    // "Meter"
    if (cmd.propertyKeyName === 'Electric_A_Consumed') {
      feature = Object.assign({}, defaultFeature, {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.CURRENT,
        max: 10,
      });
    } else if (cmd.propertyKeyName === 'Electric_W_Consumed') {
      feature = Object.assign({}, defaultFeature, {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
        max: 10000,
      });
    } else if (cmd.propertyKeyName === 'Electric_kWh_Consumed') {
      feature = Object.assign({}, defaultFeature, {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
        max: 100,
      });
    }
  } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_COLOR) {
    // "Color Switch"
  } else {
    // Manufacturer managed by zwave2mqtt
    logger.info(cmd);
  }

  return feature;
}

module.exports = {
  convertFeature,
};
