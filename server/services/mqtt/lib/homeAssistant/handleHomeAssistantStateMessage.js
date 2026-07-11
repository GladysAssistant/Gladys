const logger = require('../../../../utils/logger');
const { EVENTS, STATE } = require('../../../../utils/constants');
const { FEATURE_PROPERTIES, DEFAULT_PAYLOADS, COVER_STATE_BY_PAYLOAD_KEY } = require('./constants');
const { applyValueTemplate } = require('./applyValueTemplate');

/**
 * @description Convert a Home Assistant RGB color to the Gladys integer format.
 * @param {string|Array|object} color - The color, as "r,g,b" string, [r, g, b] array or { r, g, b } object.
 * @returns {number} The color as integer, or undefined.
 * @example
 * rgbToInt('255,0,0');
 */
function rgbToInt(color) {
  let red;
  let green;
  let blue;
  if (typeof color === 'string') {
    [red, green, blue] = color.split(',').map(Number);
  } else if (Array.isArray(color)) {
    [red, green, blue] = color.map(Number);
  } else if (color && typeof color === 'object') {
    red = Number(color.r);
    green = Number(color.g);
    blue = Number(color.b);
  }
  if ([red, green, blue].some((part) => part === undefined || Number.isNaN(part))) {
    return undefined;
  }
  // eslint-disable-next-line no-bitwise
  return (red << 16) + (green << 8) + blue;
}

/**
 * @description Convert a value to a binary Gladys state by comparing it with on/off payloads.
 * @param {any} value - The received value.
 * @param {string} onPayload - The payload meaning "on".
 * @param {string} offPayload - The payload meaning "off".
 * @returns {number} STATE.ON, STATE.OFF or undefined.
 * @example
 * toBinaryState('ON', 'ON', 'OFF');
 */
function toBinaryState(value, onPayload, offPayload) {
  if (String(value) === String(onPayload)) {
    return STATE.ON;
  }
  if (String(value) === String(offPayload)) {
    return STATE.OFF;
  }
  return undefined;
}

/**
 * @description Convert a value to a number, or undefined when not a number.
 * @param {any} value - The received value.
 * @returns {number} The number, or undefined.
 * @example
 * toNumber('12.5');
 */
function toNumber(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * @description Parse an incoming state message of a light entity.
 * @param {object} binding - The state binding.
 * @param {string} message - The MQTT message.
 * @returns {number} The Gladys state, or undefined.
 * @example
 * parseLightState(binding, 'ON');
 */
function parseLightState(binding, message) {
  const { property, config } = binding;
  if (config.schema === 'json') {
    let json;
    try {
      json = JSON.parse(message);
    } catch (e) {
      return undefined;
    }
    switch (property) {
      case FEATURE_PROPERTIES.BRIGHTNESS:
        return toNumber(json.brightness);
      case FEATURE_PROPERTIES.COLOR_TEMP:
        return toNumber(json.color_temp);
      case FEATURE_PROPERTIES.COLOR:
        return json.color ? rgbToInt(json.color) : undefined;
      default:
        return toBinaryState(json.state, DEFAULT_PAYLOADS.PAYLOAD_ON, DEFAULT_PAYLOADS.PAYLOAD_OFF);
    }
  }
  switch (property) {
    case FEATURE_PROPERTIES.BRIGHTNESS:
      return toNumber(applyValueTemplate(config.brightness_value_template, message));
    case FEATURE_PROPERTIES.COLOR_TEMP:
      return toNumber(applyValueTemplate(config.color_temp_value_template, message));
    case FEATURE_PROPERTIES.COLOR:
      return rgbToInt(applyValueTemplate(config.rgb_value_template, message));
    default:
      return toBinaryState(
        applyValueTemplate(config.state_value_template, message),
        config.payload_on || DEFAULT_PAYLOADS.PAYLOAD_ON,
        config.payload_off || DEFAULT_PAYLOADS.PAYLOAD_OFF,
      );
  }
}

/**
 * @description Parse an incoming state message of a cover entity.
 * @param {object} binding - The state binding.
 * @param {string} message - The MQTT message.
 * @returns {number} The Gladys state, or undefined.
 * @example
 * parseCoverState(binding, 'open');
 */
function parseCoverState(binding, message) {
  const { property, config } = binding;
  if (property === FEATURE_PROPERTIES.POSITION) {
    const position = toNumber(applyValueTemplate(config.position_template, message));
    if (position === undefined) {
      return undefined;
    }
    const positionOpen = config.position_open !== undefined ? config.position_open : 100;
    const positionClosed = config.position_closed !== undefined ? config.position_closed : 0;
    if (positionOpen === positionClosed) {
      return undefined;
    }
    return Math.round(((position - positionClosed) / (positionOpen - positionClosed)) * 100);
  }
  const value = String(applyValueTemplate(config.value_template, message));
  const matchingPayloadKey = Object.keys(COVER_STATE_BY_PAYLOAD_KEY).find((payloadKey) => {
    const payload = config[payloadKey] || DEFAULT_PAYLOADS[payloadKey.toUpperCase()];
    return value === payload;
  });
  return matchingPayloadKey !== undefined ? COVER_STATE_BY_PAYLOAD_KEY[matchingPayloadKey] : undefined;
}

/**
 * @description Parse an incoming Home Assistant state message and return the Gladys state.
 * @param {object} binding - The state binding (component, property, entity config).
 * @param {string} message - The MQTT message.
 * @returns {number} The Gladys state, or undefined when the message should be ignored.
 * @example
 * parseHomeAssistantIncomingState({ component: 'sensor', config: {} }, '12.5');
 */
function parseHomeAssistantIncomingState(binding, message) {
  const { component, config } = binding;
  switch (component) {
    case 'light':
      return parseLightState(binding, message);
    case 'cover':
      return parseCoverState(binding, message);
    case 'switch':
      return toBinaryState(
        applyValueTemplate(config.value_template, message),
        config.state_on || config.payload_on || DEFAULT_PAYLOADS.PAYLOAD_ON,
        config.state_off || config.payload_off || DEFAULT_PAYLOADS.PAYLOAD_OFF,
      );
    case 'binary_sensor':
      return toBinaryState(
        applyValueTemplate(config.value_template, message),
        config.payload_on || DEFAULT_PAYLOADS.PAYLOAD_ON,
        config.payload_off || DEFAULT_PAYLOADS.PAYLOAD_OFF,
      );
    case 'lock': {
      const value = applyValueTemplate(config.value_template, message);
      return toBinaryState(
        value,
        config.state_locked || DEFAULT_PAYLOADS.STATE_LOCKED,
        config.state_unlocked || DEFAULT_PAYLOADS.STATE_UNLOCKED,
      );
    }
    case 'climate':
      return binding.property === FEATURE_PROPERTIES.CURRENT_TEMPERATURE
        ? toNumber(applyValueTemplate(config.current_temperature_template, message))
        : toNumber(applyValueTemplate(config.temperature_state_template, message));
    case 'sensor':
      return toNumber(applyValueTemplate(config.value_template, message));
    default:
      return undefined;
  }
}

/**
 * @description Handle a new MQTT message on a state topic of a device
 * created through the Home Assistant discovery protocol.
 * @param {string} topic - The topic where the message was published.
 * @param {string} message - The MQTT message.
 * @example
 * this.handleHomeAssistantStateMessage('my-device/state', 'ON');
 */
function handleHomeAssistantStateMessage(topic, message) {
  const bindings = this.haStateBindings[topic] || [];
  bindings.forEach((binding) => {
    try {
      const state = parseHomeAssistantIncomingState(binding, message);
      if (state === undefined) {
        logger.debug(`MQTT Home Assistant: no state for feature ${binding.featureExternalId} in message ${message}`);
        return;
      }
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: binding.featureExternalId,
        state,
      });
    } catch (e) {
      logger.warn(`MQTT Home Assistant: unable to handle state message on topic ${topic}`);
      logger.warn(e);
    }
  });
}

module.exports = {
  handleHomeAssistantStateMessage,
  parseHomeAssistantIncomingState,
  rgbToInt,
  toBinaryState,
  toNumber,
};
