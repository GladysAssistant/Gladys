/**
 * @description Transform Tuya device value to Gladys device feature value.
 * @param {boolean} valueFromDevice - Incoming device value.
 * @returns {number} 1 if true, else 0.
 * @example
 * readValue(true);
 */
function readValue(valueFromDevice) {
  return valueFromDevice ? 1 : 0;
}

/**
 * @description Transform Gladys device feature value to Tuya device value.
 * @param {number} valueFromGladys - Outgoing device value.
 * @returns {boolean} True if 1, else false.
 * @example
 * writeValue(0);
 */
function writeValue(valueFromGladys) {
  return !!valueFromGladys;
}

/**
 * @description Build default feature attributes.
 * @returns {object} Default feature attributes.
 * @example
 * getFeatureAttributes();
 */
function getFeatureAttributes() {
  return {
    min: 0,
    max: 1,
  };
}

/**
 * @see https://developer.tuya.com/en/docs/iot/datatypedescription?id=K9i5ql2jo7j1k
 */
module.exports = {
  type: 'Boolean',
  readValue,
  writeValue,
  getFeatureAttributes,
};
