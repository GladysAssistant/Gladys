/**
 * @description Convert Zigbee2mqtt device state into Gladys compliant.
 * @param {string} feature - Device feature.
 * @param {number|string|boolean} state - Device state.
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
    // Case for Button devices
    case 'click': {
      result = state;
      break;
    }

    default: {
      if (typeof state === 'string') {
        throw new Error(`Zigbee2mqqt don't handle value "${state}" for feature "${feature}".`);
      }
      // General case : true or false => 1 or 0
      if (typeof state === 'boolean') {
        result = state ? 1 : 0;
      }
      if (typeof state === 'number') {
        result = state;
      }
    } 
  }

  return result;
}

module.exports = {
  convertValue,
};
