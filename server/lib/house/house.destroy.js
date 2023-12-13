const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { EVENT_LOG_TYPES, EVENTS } = require('../../utils/constants');

/**
 * @public
 * @description Delete a house.
 * @param {string} selector - The selector of the use to delete.
 * @example
 * gladys.house.destroy('my-house');
 */
async function destroy(selector) {
  const house = await db.House.findOne({
    where: {
      selector,
    },
  });

  if (house === null) {
    throw new NotFoundError('House not found');
  }

  await house.destroy();
  this.event.emit(EVENTS.HOUSE.DELETED, house.get({ plain: true }));
  this.event.logger.add(EVENT_LOG_TYPES.HOUSE.DELETED, house.name);

}

module.exports = {
  destroy,
};
