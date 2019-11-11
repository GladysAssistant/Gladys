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
    // case 'water_leak': {
    //   result = state === true ? 1 : 0;
    //   break;
    // }
    // case 'contact': {
    //   result = contact === true ? 1 : 0;
    //   break;
    // }

    default: {
      if (typeof state === 'string') {
        throw new Error(`Zigbee2mqqt don't handle value "${state}" for feature "${feature}".`);
      }
      // On généralise le cas où l'état vaut true ou false => 1 ou 0
      if (typeof state === 'boolean') {
        if ( state === true ) { 
          result = 1; 
        } else if (state === false) {
          result = 0;
        }
      }
      // Cas des valeurs numériques comme le niveau de batterie
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
