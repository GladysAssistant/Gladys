/**
 * @description Return true if two objects are equal.
 * @param {object} actual - The actual object.
 * @param {object} newObject - The new object.
 * @param {Array} fields - The array of fields to compare.
 * @returns {boolean} Return true if objects are equal.
 * @example
 * const shouldBeFalse = areObjectsEqual({ name: 'test'}, { name: 'modified' }, ['name']);
 */
function areObjectsEqual(actual, newObject, fields) {
  let equal = true;
  let i = 0;
  while (equal && i < fields.length) {
    equal = actual[fields[i]] === newObject[fields[i]];
    i += 1;
  }
  return equal;
}

/**
 * @description Pick only properties in fields array.
 * @param {object} actual - Current object.
 * @param {Array} fields - Array of fields to pick.
 * @returns {object} Return object with selected properties.
 * @example
 * const newObject = pick({ name: 'test', id: 1 }, ['id']);
 */
function pick(actual, fields) {
  const newObject = {};
  fields.forEach((field) => {
    newObject[field] = actual[field];
  });
  return newObject;
}

module.exports = {
  areObjectsEqual,
  pick,
};
