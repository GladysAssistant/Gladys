const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Get rooms in a house.
 * @param {string} selector - Selector of the house.
 * @returns {Promise<Array>} Resolve with list of rooms in house.
 * @example
 * const rooms = await gladys.house.getRooms('my-house');
 */
async function getRooms(selector) {
  const house = await db.House.findOne({
    where: {
      selector,
    },
    include: [
      {
        model: db.Room,
        as: 'rooms',
      },
    ],
  });

  if (house === null) {
    throw new NotFoundError('House not found');
  }

  const roomsPlain = house.rooms.map((room) => room.get({ plain: true }));
  return roomsPlain;
}

module.exports = {
  getRooms,
};
