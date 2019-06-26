/**
 * @description Return true if two objects are equal.
 * @param {Object} actual - The actual object.
 * @param {Object} newObject - The new object.
 * @param {Array} fields - The array of fields to compare.
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
 * @param {Object} actual - Current object.
 * @param {Array} fields - Array of fields to pick.
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
