const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Get house by selector.
 * @param {object} selector - Selector of the house.
 * @returns {Promise} Resolve with house object.
 * @example
 * const mainHouse = await gladys.house.getBySelector('main-house');
 */
async function getBySelector(selector) {
  const house = await db.House.findOne({
    where: {
      selector,
    },
  });

  if (house === null) {
    throw new NotFoundError('House not found');
  }

  return house.get({ plain: true });
}

module.exports = {
  getBySelector,
};
