/**
 * @description Compare two values with one operator.
 * @param {string} operator - The comparaison operator.
 * @param {*} a - The first value.
 * @param {*} b - The second value.
 * @returns {boolean} Return true or false.
 * @example
 * const result = compare('=', 1, 2); // return false.
 */
function compare(operator, a, b) {
  switch (operator) {
    case '=':
      return a === b;
    case '<':
      return a < b;
    case '>':
      return a > b;
    case '<=':
      return a <= b;
    case '>=':
      return a >= b;
    case '!=':
      return a !== b;
    // "changed" is not a comparaison against a value configured by the user: it compares the
    // new value of a device feature with its previous one, so that a trigger can react to any
    // state change without a value to pick.
    case 'changed':
      return a !== b;
    default:
      throw new Error(`Operator ${operator} not found`);
  }
}

module.exports = {
  compare,
};
