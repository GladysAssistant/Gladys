const valueBinders = {
  bool: {
    transform: (value) => value !== '0' && !!value,
    normalize: (value) => value,
  },
};
const typeBinders = Object.keys(valueBinders);

/**
 * @description Is there any Binder for this type?
 *
 * @param {string} type - Type to look for.
 *
 * @returns {boolean} True if any. False otherwise.
 *
 * @example hasBinder('bool');
 */
function hasBinder(type) {
  return typeBinders.indexOf(type) !== -1;
}

/**
 * @description Transform a Normalized value (used by Gladys domain) to
 * a zWave value.
 *
 * @param {string} type - ZWave type.
 * @param {any} value - Normalized value.
 *
 * @returns {any} The transformed value for zWave.
 *
 * @example
 *  const val = transformValue('bool', value);
 */
function transformValue(type, value) {
  if (!hasBinder(type)) {
    return value;
  }

  return valueBinders[type].transform(value);
}

/**
 * @description Normalized a value (to be used by Gladys domain)
 *
 * @param {string} type - ZWave type.
 * @param {any} value - ZWave value.
 *
 * @returns {any} The normalized value.
 *
 * @example
 *  const val = normalizeValue('bool', value);
 */
function normalizeValue(type, value) {
  if (!hasBinder(type)) {
    return value;
  }

  return valueBinders[type].normalize(value);
}

module.exports = {
  transformValue,
  normalizeValue,
};
