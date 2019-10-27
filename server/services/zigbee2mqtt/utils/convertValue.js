/**
 * @description Convert Zigbee2mqtt device state into Gladys compliant.
 * @param {string} feature - Device feature.
 * @param {number|string} state - Device state.
 * @returns {number} Gladys value.
 * @example
 * convertValue('state', 'ON');
 */
function convertValue(feature, state) {
  let result;

  switch (feature) {
    case 'state': {
      result = state === 'ON' ? 1 : 0;
      break;
    }
    default:
      if (typeof state === 'string') {
        throw new Error(`Zigbee2mqqt don't handle value "${state}" for feature "${feature}".`);
      }
      result = state;
  }

  return result;
}

module.exports = {
  convertValue,
};
