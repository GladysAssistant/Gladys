/**
 * @description Transform Tuya device value to Gladys device feature value.
 * @param {string} valueFromDevice - Incoming device value.
 * @param {object} tuyaValues - Tuya device details.
 * @returns {number} Gladys value.
 * @example
 * readValue("white", { range: ["white", "colour"] });
 */
function readValue(valueFromDevice, tuyaValues) {
  const { range = [] } = tuyaValues;
  return range.indexOf(valueFromDevice);
}

/**
 * @description Transform Gladys device feature value to Tuya device value.
 * @param {number} valueFromGladys - Outgoing device value.
 * @param {object} tuyaValues - Tuya device details.
 * @returns {number} Tuya value.
 * @example
 * writeValue(1, { range: ["white", "colour"] });
 */
function writeValue(valueFromGladys, tuyaValues) {
  const { range = [] } = tuyaValues;
  return range[valueFromGladys];
}

/**
 * @description Build default feature attributes.
 * @param {object} tuyaValues - Tuya device details.
 * @returns {object} Default feature attributes.
 * @example
 * getFeatureAttributes(details);
 */
function getFeatureAttributes(tuyaValues) {
  const { range = [] } = tuyaValues;
  return {
    min: 0,
    max: range.length - 1,
  };
}

/**
 * @see https://developer.tuya.com/en/docs/iot/datatypedescription?id=K9i5ql2jo7j1k
 */
module.exports = {
  type: 'Enum',
  readValue,
  writeValue,
  getFeatureAttributes,
};
