const get = require('get-value');
const logger = require('../../../../utils/logger');

// Extract the "value_json.my.attribute" path from a Jinja2 template
const VALUE_JSON_PATH_REGEX = /value_json(?:\.([a-zA-Z0-9_.-]+)|\[['"]([^'"]+)['"]\])/;

/**
 * @description Apply a Home Assistant value template to an incoming MQTT message.
 * Gladys does not embed a Jinja2 engine: the common "{{ value_json.attribute }}"
 * and "{{ value }}" patterns are supported, other templates return the raw message.
 * @param {string} template - The Home Assistant value template.
 * @param {string} message - The raw MQTT message.
 * @returns {any} The extracted value.
 * @example
 * applyValueTemplate('{{ value_json.temperature }}', '{"temperature": 21.5}');
 */
function applyValueTemplate(template, message) {
  if (!template) {
    return message;
  }

  const valueJsonMatch = template.match(VALUE_JSON_PATH_REGEX);
  if (valueJsonMatch) {
    const path = valueJsonMatch[1] || valueJsonMatch[2];
    try {
      return get(JSON.parse(message), path);
    } catch (e) {
      logger.debug(`MQTT Home Assistant: unable to parse JSON message "${message}" for template "${template}"`);
      return undefined;
    }
  }

  // Template based on the raw value ("{{ value }}"), or unsupported template: return raw message
  return message;
}

module.exports = {
  applyValueTemplate,
};
