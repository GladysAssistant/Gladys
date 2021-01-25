const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { EVENTS } = require('../../utils/constants');

/**
 * @public
 * @description Update a house.
 * @param {string} selector - The selector of the use to update.
 * @param {Object} newHouse - The object to update.
 * @example
 * gladys.house.update('my-house', {
 *    name: 'my-new-name'
 * });
 */
async function update(selector, newHouse) {
  const house = await db.House.findOne({
    where: {
      selector,
    },
  });

  if (house === null) {
    throw new NotFoundError('House not found');
  }

  await house.update(newHouse);

  this.event.emit(EVENTS.HOUSE.UPDATE);

  return house.get({ plain: true });
}

module.exports = {
  update,
};
