const { COVER_STATE } = require('../../../utils/constants');
const { intToHex } = require('../../../utils/colors');

const coverStateLabels = {
  [COVER_STATE.OPEN]: 'open',
  [COVER_STATE.CLOSE]: 'closed',
  [COVER_STATE.STOP]: 'stopped',
};

const ONE_MINUTE_IN_MS = 60 * 1000;
const ONE_HOUR_IN_MS = 60 * ONE_MINUTE_IN_MS;
const ONE_DAY_IN_MS = 24 * ONE_HOUR_IN_MS;

/**
 * @description Format how long ago a feature value was last updated.
 * The LLM has no other way to tell a live reading from the last value of a
 * sensor that stopped reporting (dead battery, unplugged, sensor removed),
 * so every state we expose carries its age.
 * @param {object} feature - Feature to format.
 * @param {number} now - Current timestamp in ms.
 * @returns {string|null} Compact age such as '12min', '3h', '6d', or null when unknown.
 * @example
 * formatAge({ last_value_changed: new Date() }, Date.now());
 */
function formatAge(feature, now) {
  const { last_value_changed: lastValueChanged } = feature;

  // Only an absent value means "unknown": 0 is the Unix epoch, a valid date.
  if (lastValueChanged === null || lastValueChanged === undefined) {
    return null;
  }

  const lastValueChangedTimestamp = new Date(lastValueChanged).getTime();
  if (Number.isNaN(lastValueChangedTimestamp)) {
    return null;
  }

  // A value dated in the future means a clock skew, report it as fresh.
  const ageInMs = Math.max(0, now - lastValueChangedTimestamp);

  if (ageInMs < ONE_HOUR_IN_MS) {
    return `${Math.floor(ageInMs / ONE_MINUTE_IN_MS)}min`;
  }
  if (ageInMs < ONE_DAY_IN_MS) {
    return `${Math.floor(ageInMs / ONE_HOUR_IN_MS)}h`;
  }

  return `${Math.floor(ageInMs / ONE_DAY_IN_MS)}d`;
}

/**
 * @description Format the raw feature value into something readable by the llm.
 * @param {object} feature - Feature to format.
 * @returns {object} Value formated and unit if necessary.
 * @example
 * formatRawValue(feature)
 */
function formatRawValue(feature) {
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
    case 'light:color':
      return {
        value: feature.last_value === null ? null : `#${intToHex(feature.last_value)}`,
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

/**
 * @description Format feature value for llm.
 * @param {object} feature - Feature to format.
 * @param {number} [now] - Current timestamp in ms, mainly for tests.
 * @returns {object} Value formated, unit if necessary, and age of the value.
 * @example
 * formatValue(feature)
 */
function formatValue(feature, now = Date.now()) {
  return {
    ...formatRawValue(feature),
    age: formatAge(feature, now),
  };
}

module.exports = {
  formatValue,
  formatAge,
};
