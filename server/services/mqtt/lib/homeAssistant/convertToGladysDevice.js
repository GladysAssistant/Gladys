const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  COVER_STATE,
} = require('../../../../utils/constants');
const {
  HOME_ASSISTANT,
  FEATURE_PROPERTIES,
  SENSOR_DEVICE_CLASSES,
  BINARY_SENSOR_DEVICE_CLASSES,
  UNITS,
} = require('./constants');

const DEFAULT_SENSOR_MIN = -100000;
const DEFAULT_SENSOR_MAX = 100000;

/**
 * @description Build a Gladys feature with default attributes.
 * @param {object} attributes - Feature attributes.
 * @returns {object} The Gladys feature.
 * @example
 * buildFeature({ name: 'Temperature', external_id: 'homeassistant:device:sensor:temp' });
 */
function buildFeature(attributes) {
  return {
    read_only: true,
    has_feedback: true,
    keep_history: true,
    min: 0,
    max: 1,
    ...attributes,
    selector: attributes.external_id,
  };
}

/**
 * @description Convert a Home Assistant sensor entity to Gladys features.
 * @param {string} externalIdBase - Base external id of the entity.
 * @param {string} name - Entity name.
 * @param {object} config - Expanded entity discovery configuration.
 * @returns {Array} Gladys features.
 * @example
 * convertSensor('homeassistant:my-device:sensor:temp', 'Temperature', { state_topic: 'my/topic' });
 */
function convertSensor(externalIdBase, name, config) {
  const mapping = SENSOR_DEVICE_CLASSES[config.device_class];
  if (!mapping || !config.state_topic) {
    return [];
  }
  const unit = UNITS[config.unit_of_measurement];
  const isPercent = unit === DEVICE_FEATURE_UNITS.PERCENT;
  return [
    buildFeature({
      name,
      external_id: externalIdBase,
      category: mapping.category,
      type: mapping.type,
      unit,
      min: isPercent ? 0 : DEFAULT_SENSOR_MIN,
      max: isPercent ? 100 : DEFAULT_SENSOR_MAX,
    }),
  ];
}

/**
 * @description Convert a Home Assistant binary sensor entity to Gladys features.
 * @param {string} externalIdBase - Base external id of the entity.
 * @param {string} name - Entity name.
 * @param {object} config - Expanded entity discovery configuration.
 * @returns {Array} Gladys features.
 * @example
 * convertBinarySensor('homeassistant:my-device:binary_sensor:motion', 'Motion', { state_topic: 'my/topic' });
 */
function convertBinarySensor(externalIdBase, name, config) {
  if (!config.state_topic) {
    return [];
  }
  const category = BINARY_SENSOR_DEVICE_CLASSES[config.device_class] || DEVICE_FEATURE_CATEGORIES.SWITCH;
  return [
    buildFeature({
      name,
      external_id: externalIdBase,
      category,
      type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
    }),
  ];
}

/**
 * @description Convert a Home Assistant switch entity to Gladys features.
 * @param {string} externalIdBase - Base external id of the entity.
 * @param {string} name - Entity name.
 * @param {object} config - Expanded entity discovery configuration.
 * @returns {Array} Gladys features.
 * @example
 * convertSwitch('homeassistant:my-device:switch:relay', 'Relay', { command_topic: 'my/topic' });
 */
function convertSwitch(externalIdBase, name, config) {
  if (!config.command_topic) {
    return [];
  }
  return [
    buildFeature({
      name,
      external_id: externalIdBase,
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      read_only: false,
      has_feedback: config.state_topic !== undefined,
    }),
  ];
}

/**
 * @description Convert a Home Assistant button entity to Gladys features.
 * @param {string} externalIdBase - Base external id of the entity.
 * @param {string} name - Entity name.
 * @param {object} config - Expanded entity discovery configuration.
 * @returns {Array} Gladys features.
 * @example
 * convertButton('homeassistant:my-device:button:restart', 'Restart', { command_topic: 'my/topic' });
 */
function convertButton(externalIdBase, name, config) {
  if (!config.command_topic) {
    return [];
  }
  return [
    buildFeature({
      name,
      external_id: externalIdBase,
      category: DEVICE_FEATURE_CATEGORIES.SWITCH,
      type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
      read_only: false,
      has_feedback: false,
      keep_history: false,
    }),
  ];
}

/**
 * @description Convert a Home Assistant light entity to Gladys features.
 * @param {string} externalIdBase - Base external id of the entity.
 * @param {string} name - Entity name.
 * @param {object} config - Expanded entity discovery configuration.
 * @returns {Array} Gladys features.
 * @example
 * convertLight('homeassistant:my-device:light:main', 'Main light', { command_topic: 'my/topic' });
 */
function convertLight(externalIdBase, name, config) {
  if (!config.command_topic) {
    return [];
  }
  const features = [];
  const isJsonSchema = config.schema === 'json';
  const supportedColorModes = config.supported_color_modes || [];

  features.push(
    buildFeature({
      name,
      external_id: `${externalIdBase}:${FEATURE_PROPERTIES.STATE}`,
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
      read_only: false,
      has_feedback: config.state_topic !== undefined,
    }),
  );

  const hasBrightness = isJsonSchema
    ? config.brightness === true
    : config.brightness_command_topic !== undefined || config.brightness_state_topic !== undefined;
  if (hasBrightness) {
    features.push(
      buildFeature({
        name: `${name} - brightness`,
        external_id: `${externalIdBase}:${FEATURE_PROPERTIES.BRIGHTNESS}`,
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
        read_only: false,
        min: 0,
        max: config.brightness_scale || 255,
      }),
    );
  }

  const hasColorTemp = isJsonSchema
    ? supportedColorModes.includes('color_temp')
    : config.color_temp_command_topic !== undefined || config.color_temp_state_topic !== undefined;
  if (hasColorTemp) {
    features.push(
      buildFeature({
        name: `${name} - color temperature`,
        external_id: `${externalIdBase}:${FEATURE_PROPERTIES.COLOR_TEMP}`,
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
        read_only: false,
        min: config.min_mireds || 153,
        max: config.max_mireds || 500,
      }),
    );
  }

  const hasColor = isJsonSchema
    ? supportedColorModes.some((mode) => ['rgb', 'rgbw', 'rgbww'].includes(mode))
    : config.rgb_command_topic !== undefined || config.rgb_state_topic !== undefined;
  if (hasColor) {
    features.push(
      buildFeature({
        name: `${name} - color`,
        external_id: `${externalIdBase}:${FEATURE_PROPERTIES.COLOR}`,
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.COLOR,
        read_only: false,
        min: 0,
        max: 16777215,
      }),
    );
  }

  return features;
}

/**
 * @description Convert a Home Assistant cover entity to Gladys features.
 * @param {string} externalIdBase - Base external id of the entity.
 * @param {string} name - Entity name.
 * @param {object} config - Expanded entity discovery configuration.
 * @returns {Array} Gladys features.
 * @example
 * convertCover('homeassistant:my-device:cover:shutter', 'Shutter', { command_topic: 'my/topic' });
 */
function convertCover(externalIdBase, name, config) {
  const features = [];
  if (config.command_topic) {
    features.push(
      buildFeature({
        name,
        external_id: `${externalIdBase}:${FEATURE_PROPERTIES.STATE}`,
        category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
        type: DEVICE_FEATURE_TYPES.SHUTTER.STATE,
        read_only: false,
        has_feedback: config.state_topic !== undefined,
        min: COVER_STATE.CLOSE,
        max: COVER_STATE.OPEN,
      }),
    );
  }
  if (config.set_position_topic || config.position_topic) {
    features.push(
      buildFeature({
        name: `${name} - position`,
        external_id: `${externalIdBase}:${FEATURE_PROPERTIES.POSITION}`,
        category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
        type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
        read_only: config.set_position_topic === undefined,
        has_feedback: config.position_topic !== undefined,
        min: 0,
        max: 100,
      }),
    );
  }
  return features;
}

/**
 * @description Convert a Home Assistant lock entity to Gladys features.
 * @param {string} externalIdBase - Base external id of the entity.
 * @param {string} name - Entity name.
 * @param {object} config - Expanded entity discovery configuration.
 * @returns {Array} Gladys features.
 * @example
 * convertLock('homeassistant:my-device:lock:door', 'Door lock', { command_topic: 'my/topic' });
 */
function convertLock(externalIdBase, name, config) {
  if (!config.command_topic) {
    return [];
  }
  return [
    buildFeature({
      name,
      external_id: externalIdBase,
      category: DEVICE_FEATURE_CATEGORIES.LOCK,
      type: DEVICE_FEATURE_TYPES.LOCK.BINARY,
      read_only: false,
      has_feedback: config.state_topic !== undefined,
    }),
  ];
}

/**
 * @description Convert a Home Assistant climate entity to Gladys features.
 * @param {string} externalIdBase - Base external id of the entity.
 * @param {string} name - Entity name.
 * @param {object} config - Expanded entity discovery configuration.
 * @returns {Array} Gladys features.
 * @example
 * convertClimate('homeassistant:my-device:climate:thermostat', 'Thermostat', {
 *   temperature_command_topic: 'my/topic',
 * });
 */
function convertClimate(externalIdBase, name, config) {
  const features = [];
  const unit = config.temperature_unit === 'F' ? DEVICE_FEATURE_UNITS.FAHRENHEIT : DEVICE_FEATURE_UNITS.CELSIUS;
  if (config.temperature_command_topic) {
    features.push(
      buildFeature({
        name,
        external_id: `${externalIdBase}:${FEATURE_PROPERTIES.TARGET_TEMPERATURE}`,
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        unit,
        read_only: false,
        has_feedback: config.temperature_state_topic !== undefined,
        min: config.min_temp !== undefined ? config.min_temp : 7,
        max: config.max_temp !== undefined ? config.max_temp : 35,
      }),
    );
  }
  if (config.current_temperature_topic) {
    features.push(
      buildFeature({
        name: `${name} - current temperature`,
        external_id: `${externalIdBase}:${FEATURE_PROPERTIES.CURRENT_TEMPERATURE}`,
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit,
        min: DEFAULT_SENSOR_MIN,
        max: DEFAULT_SENSOR_MAX,
      }),
    );
  }
  return features;
}

const CONVERTERS_BY_COMPONENT = {
  sensor: convertSensor,
  binary_sensor: convertBinarySensor,
  switch: convertSwitch,
  button: convertButton,
  light: convertLight,
  cover: convertCover,
  lock: convertLock,
  climate: convertClimate,
};

/**
 * @description Convert a Home Assistant discovery entity to Gladys features.
 * @param {string} deviceExternalId - External id of the Gladys device.
 * @param {string} entityKey - Unique key of the entity.
 * @param {object} config - Expanded entity discovery configuration.
 * @returns {Array} Gladys features.
 * @example
 * convertEntityToFeatures('homeassistant:my-device', 'sensor:temp', { state_topic: 'my/topic' });
 */
function convertEntityToFeatures(deviceExternalId, entityKey, config) {
  const [component] = entityKey.split(':');
  const converter = CONVERTERS_BY_COMPONENT[component];
  if (!converter) {
    return [];
  }
  const externalIdBase = `${deviceExternalId}:${entityKey}`;
  const name = (config.name || entityKey.split(':').pop()).substring(0, 80);
  return converter(externalIdBase, name, config);
}

/**
 * @description Convert a discovered Home Assistant device to a Gladys device.
 * @param {string} serviceId - UUID of the MQTT service.
 * @param {object} discoveredDevice - Discovered device with device info and entities.
 * @returns {object} The Gladys device.
 * @example
 * convertToGladysDevice('7fdbdcbf-7628-4364-8558-0ad00234f8c9', {
 *   identifier: 'my-device',
 *   info: { name: 'My device' },
 *   entities: { 'sensor:temp': { state_topic: 'my/topic', device_class: 'temperature' } },
 * });
 */
function convertToGladysDevice(serviceId, discoveredDevice) {
  const { identifier, info = {}, entities } = discoveredDevice;
  const externalId = `${HOME_ASSISTANT.EXTERNAL_ID_PREFIX}:${identifier}`;

  const features = [];
  const params = [];

  Object.keys(entities)
    .sort()
    .forEach((entityKey) => {
      const config = entities[entityKey];
      const entityFeatures = convertEntityToFeatures(externalId, entityKey, config);
      features.push(...entityFeatures);
      if (entityFeatures.length > 0) {
        // Store the entity configuration (without device/origin metadata)
        // so Gladys can listen to states & send commands after creation
        const { device, origin, availability, ...entityConfig } = config;
        params.push({
          name: `${HOME_ASSISTANT.DEVICE_PARAM_PREFIX}${entityKey}`,
          value: JSON.stringify(entityConfig),
        });
      }
    });

  return {
    name: (info.name || identifier).substring(0, 80),
    external_id: externalId,
    selector: externalId,
    model: info.model || null,
    service_id: serviceId,
    should_poll: false,
    features,
    params,
  };
}

module.exports = {
  convertToGladysDevice,
  convertEntityToFeatures,
};
