const logger = require('../../../../utils/logger');
const { getFeaturesByModel } = require('../model');
const { getDeviceFeatureExternalId } = require('./externalId');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');
const { COMMAND_CLASSES, INDEXES } = require('../constants');

/**
 * @description Find for the features linked to the Z-Wave device.
 * @param {Object} device - Z-Wave device.
 * @returns {Array} Gladys features.
 * @example
 * convertFeature(device);
 */
function convertFeature(device) {
  const features = getFeaturesByModel(device.deviceId);
  if (features.length === 0) {
    const cmdClasses = device.values;
    Object.keys(cmdClasses).forEach((cmdID) => {
      const cmd = cmdClasses[cmdID];

      const externalId = getDeviceFeatureExternalId({
        node_id: device.id,
        class_id: cmd.commandClass,
        instance: cmd.endpoint,
        propertyKey: cmd.property,
      });

      const defaultFeature = {
        name: cmd.label,
        external_id: externalId,
        min: 0,
        max: 1,
        unit: cmd.unit,
        read_only: true,
        has_feedback: true,
        keep_history: true,
        selector: externalId,
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
        /* features.push({
            name: cmd.label,
            category: DEVICE_FEATURE_CATEGORIES.BUTTON,
            type: DEVICE_FEATURE_TYPES.BUTTON.CLICK, 
            external_id: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: cmd.property
            }),
            min: 0,
            max: 1,
            read_only: true,
            has_feedback: true,
            keep_history: true,
            selector: cmd.label,
          }); */
      } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_ALARM) {
        // Notification 0x71
        // - Sensor status
        /* features.push({
            name: cmd.label,
            category: DEVICE_FEATURE_CATEGORIES.UNKNOWN,
            type: DEVICE_FEATURE_TYPES.UNKNOWN, 
            external_id: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: cmd.property
            }),
            min: 0,
            max: 255,
            read_only: true,
            has_feedback: true,
            keep_history: true,
            selector: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: cmd.property
            }),
          }); */
      } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_WAKE_UP) {
        // Wake up
      } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_BATTERY) {
        // Battery
      } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_BINARY) {
        // "Binary Switch"
        if (cmd.property === 'currentValue') {
          features.push({
            name: cmd.label,
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
            external_id: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: cmd.property,
            }),
            min: 0,
            max: 1,
            read_only: false,
            has_feedback: true,
            keep_history: true,
            selector: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: cmd.property,
            }),
          });
        }
      } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_MULTILEVEL) {
        // "Multilevel Switch"
        // duration
        if (cmd.property === 'currentValue') {
          features.push({
            name: cmd.label,
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SWITCH.DIMMER,
            external_id: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: cmd.property,
            }),
            min: 0,
            max: 255,
            read_only: false,
            has_feedback: true,
            keep_history: true,
            selector: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: cmd.property,
            }),
          });
        }
      } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SCENE_ACTIVATION) {
        // "Scene Activation"
      } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SENSOR_BINARY) {
        // 'Binary Sensor'
        if (cmd.property === 'Motion') {
          features.push({
            name: cmd.label,
            category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
            type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
            external_id: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: cmd.property,
            }),
            min: 0,
            max: 1,
            unit: cmd.unit,
            read_only: true,
            has_feedback: true,
            keep_history: true,
            selector: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: cmd.property,
            }),
          });
        } else if (cmd.propertyName === 'Any') {
        }
      } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SENSOR_MULTILEVEL) {
        // "Multilevel Sensor"
        if (cmd.property === 'Illuminance') {
          features.push(Object.assign({}, defaultFeature, {
            category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
            type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
            max: 255,
          }));
        } else if (cmd.property === 'Humidity') {
          features.push(Object.assign({}, defaultFeature, {
            category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
            type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
            max: 100,
          }));
        } else if (cmd.property === 'Air temperature') {
          features.push(Object.assign({}, defaultFeature, {
            category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
            type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
            min: -30,
            max: 100,
          }));
        } else if (cmd.property === 'Ultraviolet') {
        }
      } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_METER) {
        // "Meter"
        if (cmd.propertyKeyName === 'Electric_A_Consumed') {
          features.push({
            name: cmd.label,
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SWITCH.CURRENT,
            external_id: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: `${cmd.property}/${cmd.propertyKey}`,
            }),
            min: 0,
            max: 10,
            unit: cmd.unit,
            read_only: true,
            has_feedback: true,
            keep_history: true,
            selector: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: `${cmd.property}/${cmd.propertyKey}`,
            }),
          });
        } else if (cmd.propertyKeyName === 'Electric_W_Consumed') {
          features.push({
            name: cmd.label,
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
            external_id: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: `${cmd.property}/${cmd.propertyKey}`,
            }),
            min: 0,
            max: 10000,
            unit: cmd.unit,
            read_only: true,
            has_feedback: true,
            keep_history: true,
            selector: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: `${cmd.property}/${cmd.propertyKey}`,
            }),
          });
        } else if (cmd.propertyKeyName === 'Electric_kWh_Consumed') {
          features.push({
            name: cmd.label,
            category: DEVICE_FEATURE_CATEGORIES.SWITCH,
            type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
            external_id: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: `${cmd.property}/${cmd.propertyKey}`,
            }),
            min: 0,
            max: 100,
            unit: cmd.unit,
            read_only: true,
            has_feedback: true,
            keep_history: true,
            selector: getDeviceFeatureExternalId({
              node_id: device.id,
              class_id: cmd.commandClass,
              instance: cmd.endpoint,
              propertyKey: `${cmd.property}/${cmd.propertyKey}`,
            }),
          });
        }
      } else if (cmd.commandClass === COMMAND_CLASSES.COMMAND_CLASS_SWITCH_COLOR) {
        // "Color Switch"
      } else {
        // Manufacturer managed by zwave2mqtt
        logger.info(cmd);
      }
    });
  } else {
    features.forEach((feature) => {
      feature.external_id = getDeviceFeatureExternalId({
        node_id: device.id,
        class_id: feature.class_id,
        instance: feature.instance,
        propertyKey: feature.propertyKey,
      });
    });
  }
  return features;
}

module.exports = {
  convertFeature,
};
