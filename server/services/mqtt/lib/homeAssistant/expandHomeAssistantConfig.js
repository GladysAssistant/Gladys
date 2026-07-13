const { ABBREVIATIONS, DEVICE_ABBREVIATIONS, ORIGIN_ABBREVIATIONS } = require('./constants');

/**
 * @description Expand abbreviated keys of an object with the provided dictionary.
 * @param {object} object - Object with potentially abbreviated keys.
 * @param {object} dictionary - Abbreviation dictionary.
 * @returns {object} A new object with expanded keys.
 * @example
 * expandKeys({ mdl: 'Model' }, DEVICE_ABBREVIATIONS);
 */
function expandKeys(object, dictionary) {
  const expanded = {};
  Object.keys(object).forEach((key) => {
    expanded[dictionary[key] || key] = object[key];
  });
  return expanded;
}

/**
 * @description Expand a Home Assistant discovery configuration payload:
 * abbreviations are replaced by their full name, and the "~" base topic
 * is replaced in all topics.
 * See https://www.home-assistant.io/integrations/mqtt/#discovery-payload.
 * @param {object} config - Raw discovery configuration.
 * @returns {object} The expanded configuration.
 * @example
 * expandHomeAssistantConfig({ '~': 'my-device', stat_t: '~/state' });
 */
function expandHomeAssistantConfig(config) {
  const expanded = expandKeys(config, ABBREVIATIONS);

  if (expanded.device && typeof expanded.device === 'object') {
    expanded.device = expandKeys(expanded.device, DEVICE_ABBREVIATIONS);
  }

  if (expanded.origin && typeof expanded.origin === 'object') {
    expanded.origin = expandKeys(expanded.origin, ORIGIN_ABBREVIATIONS);
  }

  if (Array.isArray(expanded.availability)) {
    expanded.availability = expanded.availability.map((availability) => expandKeys(availability, ABBREVIATIONS));
  }

  // Replace the "~" base topic in all topic attributes
  const baseTopic = expanded['~'];
  if (baseTopic) {
    Object.keys(expanded).forEach((key) => {
      const value = expanded[key];
      if ((key === 'topic' || key.endsWith('_topic')) && typeof value === 'string') {
        if (value.startsWith('~')) {
          expanded[key] = `${baseTopic}${value.substring(1)}`;
        } else if (value.endsWith('~')) {
          expanded[key] = `${value.substring(0, value.length - 1)}${baseTopic}`;
        }
      }
    });
  }

  return expanded;
}

module.exports = {
  expandHomeAssistantConfig,
};
