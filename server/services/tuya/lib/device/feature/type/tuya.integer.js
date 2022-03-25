const { convertUnit } = require('../tuya.convertUnit');

/**
 * @description Transform Tuya device value to Gladys device feature value.
 * @param {number} valueFromDevice - Incoming device value.
 * @returns {number} Incoming argument.
 * @example
 * readValue(123);
 */
function readValue(valueFromDevice) {
  return valueFromDevice;
}

/**
 * @description Transform Gladys device feature value to Tuya device value.
 * @param {number} valueFromGladys - Outgoing device value.
 * @returns {number} Incoming argument.
 * @example
 * writeValue(123);
 */
function writeValue(valueFromGladys) {
  return valueFromGladys;
}

/**
 * @description Build default feature attributes.
 * @param {Object} tuyaValues - Tuya device details.
 * @returns {Object} Default feature attributes.
 * @example
 * getFeatureAttributes(details);
 */
function getFeatureAttributes(tuyaValues) {
  const { min, max, unit: tuyaUnit } = tuyaValues;
  const unit = convertUnit(tuyaUnit);
  return {
    min,
    max,
    unit,
  };
}

/**
 * @see https://developer.tuya.com/en/docs/iot/datatypedescription?id=K9i5ql2jo7j1k
 */
module.exports = {
  type: 'Integer',
  readValue,
  writeValue,
  getFeatureAttributes,
};
