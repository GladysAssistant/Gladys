/**
 * @description Compare 2 value.
 * @param {string|number|boolean} value - Number.
 * @param {string|number|boolean} newValue - New number.
 * @returns {boolean} Return param.
 * @example
 * compareValue({
 *  params: [{ value: 1, value: 2 }]
 * }, false);
 * compareValue({
 *  params: [{ value: true, value: true }]
 * }, false);
 * compareValue({
 *  params: [{ value: 1.00, value: 2.00 }]
 * }, false);
 */
function compareValue(value, newValue) {
  if (value === null || newValue === null) {
    return false;
  }
  if (Number.isInteger(newValue) && Number.isInteger(value)) {
    if (parseInt(value, 10) !== parseInt(newValue, 10)) {
      return true;
    }
    return false;
  }

  if (typeof newValue === 'boolean') {
    if (Boolean(value) !== newValue) {
      return true;
    }
    return false;
  }
  if (parseFloat(value) !== parseFloat(newValue)) {
    return true;
  }
  return false;
}

module.exports = {
  compareValue,
};
