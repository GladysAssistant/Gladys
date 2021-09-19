const exposesMap = require('../../exposes');
const { mapUnit } = require('./mapUnit');
const { completeFeature } = require('./completeFeature');

/**
 * @description Load feature from parent type.
 * @param {Object} types - Zigbee "expose" parent type features.
 * @param {string} parentType - Requested parent type.
 * @returns {Object} The related Gladys feature, or undefined.
 *
 * @example buildByParentType({ switch: {}, light: {}}, 'light');
 */
function buildByParentType(types = {}, parentType) {
  return types[parentType];
}

/**
 * @description Load feature from property name, completed by parent type.
 *
 * @param {Object} names - Zigbee "expose" proerty name features.
 * @param {string} name - Zigbee "expose" property name.
 * @param {string} parentType - Requested parent type.
 * @returns {Object} The related Gladys feature, or undefined.
 *
 * @example buildByName({ state: {}}, 'state', 'light');
 */
function buildByName(names = {}, name, parentType) {
  const { types = {}, feature } = names[name] || {};
  const byType = buildByParentType(types, parentType);

  if (!byType && !feature) {
    return undefined;
  }

  return { ...(feature || {}), ...(byType || {}) };
}

/**
 * @description Build a Gladys feature according to Zigbee "expose" values.
 * @param {string} deviceName - Device friendly name.
 * @param {Object} expose - Zigbee "expose" values.
 * @param {string} parentType - Requested parent type.
 * @returns {Object} The related Gladys feature, or undefined.
 *
 * @example buildFeature('MyDevice', {}, 'light');
 */
function buildFeature(deviceName, expose = {}, parentType) {
  const { type, name, property, access, value_min: minValue, value_max: maxValue, unit: deviceUnit, values } = expose;
  const { names = {}, feature } = exposesMap[type] || {};
  const byName = buildByName(names, name, parentType);

  if (!byName) {
    return undefined;
  }

  // Read only ?
  // eslint-disable-next-line no-bitwise
  const readOnly = (access & 2) === 0;

  // Has feedback ?
  // eslint-disable-next-line no-bitwise
  const hasFeedback = !readOnly && (access & 1) === 1;

  const createdFeature = { read_only: readOnly, has_feedback: hasFeedback, ...(feature || {}), ...(byName || {}) };

  // Min value
  const min = minValue !== undefined ? minValue : createdFeature.min;

  // Max value
  let { max } = createdFeature;
  if (maxValue !== undefined) {
    max = maxValue;
  } else if (values !== undefined) {
    max = values.length;
  }

  // Unit
  const unit = mapUnit(deviceUnit, createdFeature.unit);

  // Add missing properties
  return completeFeature(deviceName, { ...createdFeature, min, max, unit }, property);
}

module.exports = {
  buildByParentType,
  buildByName,
  buildFeature,
};
