const logger = require('../../../../utils/logger');
const { NotFoundError } = require('../../../../utils/coreErrors');
const { COVER_STATE } = require('../../../../utils/constants');
const { HOME_ASSISTANT, FEATURE_PROPERTIES, DEFAULT_PAYLOADS } = require('./constants');

/**
 * @description Convert a Gladys integer color to { r, g, b }.
 * @param {number} value - The color as integer.
 * @returns {object} The color as { r, g, b }.
 * @example
 * intToRgb(16711680);
 */
function intToRgb(value) {
  // eslint-disable-next-line no-bitwise
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

/**
 * @description Build the MQTT command (topic + payload) of a light entity.
 * @param {object} config - Expanded entity discovery configuration.
 * @param {string} property - Feature property (state, brightness...).
 * @param {number} value - The new value.
 * @returns {object} The { topic, payload } to publish.
 * @example
 * buildLightCommand({ command_topic: 'my/topic' }, 'state', 1);
 */
function buildLightCommand(config, property, value) {
  if (config.schema === 'json') {
    let payload;
    switch (property) {
      case FEATURE_PROPERTIES.BRIGHTNESS:
        payload = { state: 'ON', brightness: Math.round(value) };
        break;
      case FEATURE_PROPERTIES.COLOR_TEMP:
        payload = { state: 'ON', color_temp: Math.round(value) };
        break;
      case FEATURE_PROPERTIES.COLOR:
        payload = { state: 'ON', color: intToRgb(value) };
        break;
      default:
        payload = { state: value ? 'ON' : 'OFF' };
        break;
    }
    return { topic: config.command_topic, payload: JSON.stringify(payload) };
  }
  switch (property) {
    case FEATURE_PROPERTIES.BRIGHTNESS:
      return { topic: config.brightness_command_topic, payload: String(Math.round(value)) };
    case FEATURE_PROPERTIES.COLOR_TEMP:
      return { topic: config.color_temp_command_topic, payload: String(Math.round(value)) };
    case FEATURE_PROPERTIES.COLOR: {
      const { r, g, b } = intToRgb(value);
      return { topic: config.rgb_command_topic, payload: `${r},${g},${b}` };
    }
    default:
      return {
        topic: config.command_topic,
        payload: value
          ? config.payload_on || DEFAULT_PAYLOADS.PAYLOAD_ON
          : config.payload_off || DEFAULT_PAYLOADS.PAYLOAD_OFF,
      };
  }
}

/**
 * @description Build the MQTT command (topic + payload) of a cover entity.
 * @param {object} config - Expanded entity discovery configuration.
 * @param {string} property - Feature property (state or position).
 * @param {number} value - The new value.
 * @returns {object} The { topic, payload } to publish.
 * @example
 * buildCoverCommand({ command_topic: 'my/topic' }, 'state', 1);
 */
function buildCoverCommand(config, property, value) {
  if (property === FEATURE_PROPERTIES.POSITION) {
    const positionOpen = config.position_open !== undefined ? config.position_open : 100;
    const positionClosed = config.position_closed !== undefined ? config.position_closed : 0;
    const position = Math.round(positionClosed + (value / 100) * (positionOpen - positionClosed));
    return { topic: config.set_position_topic, payload: String(position) };
  }
  let payload;
  if (value === COVER_STATE.OPEN) {
    payload = config.payload_open || DEFAULT_PAYLOADS.PAYLOAD_OPEN;
  } else if (value === COVER_STATE.CLOSE) {
    payload = config.payload_close || DEFAULT_PAYLOADS.PAYLOAD_CLOSE;
  } else {
    payload = config.payload_stop || DEFAULT_PAYLOADS.PAYLOAD_STOP;
  }
  return { topic: config.command_topic, payload };
}

/**
 * @description Build the MQTT command (topic + payload) for a Home Assistant entity.
 * @param {string} component - Home Assistant component.
 * @param {object} config - Expanded entity discovery configuration.
 * @param {string} property - Feature property.
 * @param {number} value - The new value.
 * @returns {object} The { topic, payload } to publish.
 * @example
 * buildHomeAssistantCommand('switch', { command_topic: 'my/topic' }, 'state', 1);
 */
function buildHomeAssistantCommand(component, config, property, value) {
  switch (component) {
    case 'light':
      return buildLightCommand(config, property, value);
    case 'cover':
      return buildCoverCommand(config, property, value);
    case 'lock':
      return {
        topic: config.command_topic,
        payload: value
          ? config.payload_lock || DEFAULT_PAYLOADS.PAYLOAD_LOCK
          : config.payload_unlock || DEFAULT_PAYLOADS.PAYLOAD_UNLOCK,
      };
    case 'button':
      return { topic: config.command_topic, payload: config.payload_press || DEFAULT_PAYLOADS.PAYLOAD_PRESS };
    case 'climate':
      return { topic: config.temperature_command_topic, payload: String(value) };
    case 'switch':
      return {
        topic: config.command_topic,
        payload: value
          ? config.payload_on || DEFAULT_PAYLOADS.PAYLOAD_ON
          : config.payload_off || DEFAULT_PAYLOADS.PAYLOAD_OFF,
      };
    default:
      return { topic: undefined, payload: undefined };
  }
}

/**
 * @description Control a device created through the Home Assistant discovery protocol.
 * @param {object} device - The device to control.
 * @param {object} deviceFeature - The device feature to control.
 * @param {string|number} value - The new value.
 * @returns {Promise} Resolve when the message is published.
 * @example
 * setValueHomeAssistant(device, deviceFeature, 1);
 */
async function setValueHomeAssistant(device, deviceFeature, value) {
  const params = device.params || [];
  // Find the entity configuration matching this feature.
  // The longest matching base is kept, in case entity keys share a prefix.
  let match = null;
  params
    .filter((param) => param.name.startsWith(HOME_ASSISTANT.DEVICE_PARAM_PREFIX))
    .forEach((param) => {
      const entityKey = param.name.substring(HOME_ASSISTANT.DEVICE_PARAM_PREFIX.length);
      const externalIdBase = `${device.external_id}:${entityKey}`;
      const matches =
        deviceFeature.external_id === externalIdBase || deviceFeature.external_id.startsWith(`${externalIdBase}:`);
      if (matches && (!match || entityKey.length > match.entityKey.length)) {
        match = { entityKey, externalIdBase, param };
      }
    });

  if (!match) {
    throw new NotFoundError(
      `MQTT Home Assistant: no entity configuration found for feature ${deviceFeature.external_id}`,
    );
  }

  const config = JSON.parse(match.param.value);
  const [component] = match.entityKey.split(':');
  const property =
    deviceFeature.external_id === match.externalIdBase
      ? FEATURE_PROPERTIES.STATE
      : deviceFeature.external_id.substring(match.externalIdBase.length + 1);

  const { topic, payload } = buildHomeAssistantCommand(component, config, property, value);
  if (!topic) {
    throw new NotFoundError(`MQTT Home Assistant: no command topic found for feature ${deviceFeature.external_id}`);
  }

  logger.debug(`MQTT Home Assistant: publishing "${payload}" on ${topic}`);
  this.publish(topic, payload);
}

module.exports = {
  setValueHomeAssistant,
  buildHomeAssistantCommand,
};
