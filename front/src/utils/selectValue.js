/**
 * Value to give to a native `<select>` or to one of its `<option>`, as a string.
 *
 * The DOM only holds strings there (`select.value === '5'`), and Preact writes the property
 * again on every render where the prop is not strictly equal to it. A numeric state
 * (`last_value: 5`) is therefore written on each render, even an unrelated one — and Chrome on
 * Android closes and reopens the native picker of an open select whose value or options are
 * touched from script. A string that has not changed is left alone.
 *
 * `null` (no state yet) becomes '', which is what Preact writes for it anyway; `undefined` stays
 * `undefined`, so a select that was not controlled is still not controlled.
 *
 * @param {number|string|null|undefined} value - The state, or the value of an option.
 * @returns {string|undefined} The same value as the DOM holds it.
 * @example
 * <select value={toSelectValue(deviceFeature.last_value)}>
 *   <option value={toSelectValue(PILOT_WIRE_MODE.COMFORT)}>Comfort</option>
 * </select>
 */
const toSelectValue = value => {
  if (value === undefined) {
    return undefined;
  }
  return value === null ? '' : String(value);
};

export { toSelectValue };
