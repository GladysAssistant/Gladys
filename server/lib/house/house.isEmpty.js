/**
 * @public
 * @description Return true or false if house is empty.
 * @param {string} selector - Selector of the house.
 * @returns {Promise} Resolve with true if house is empty.
 * @example
 * const empty = await gladys.house.isEmpty('my-house');
 */
async function isEmpty(selector) {
  const usersAtHome = await this.getUsersAtHome(selector);
  return usersAtHome.length === 0;
}

module.exports = {
  isEmpty,
};
