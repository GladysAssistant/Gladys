const { COVER_STATE } = require('../../../utils/constants');

const coverStateLabels = {
  [COVER_STATE.OPEN]: 'open',
  [COVER_STATE.CLOSE]: 'closed',
  [COVER_STATE.STOP]: 'stopped',
};

/**
 * @description Format feature value for llm.
 * @param {object} feature - Feature to format.
 * @returns {object} Value formated and unit if necessary.
 * @example
 * formatValue(feature)
 */
function formatValue(feature) {
  switch (`${feature.category}:${feature.type}`) {
    case 'opening-sensor:binary':
      return {
        value: feature.last_value === 0 ? 'open' : 'closed',
        unit: null,
      };
    case 'light:binary':
    case 'switch:binary':
    case 'air-conditioning':
      return {
        value: feature.last_value === 0 ? 'off' : 'on',
        unit: null,
      };
    case 'shutter:state':
    case 'curtain:state':
      return {
        value: coverStateLabels[feature.last_value] ?? feature.last_value,
        unit: null,
      };
    default:
      return {
        value: feature.last_value,
        unit: feature.unit,
      };
  }
}

module.exports = {
  formatValue,
};
