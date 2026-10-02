const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { buildUniqueSelector } = require('../../utils/addSelector');

/**
 * @description Create a room in a house.
 * @param {string} selector - The selector of a house.
 * @param {object} room - The room to create.
 * @returns {Promise<object>} Resolve with created room.
 * @example
 * gladys.room.create('my-house', {
 *    name: 'Kitchen'
 * });
 */
async function create(selector, room) {
  const house = await db.House.findOne({
    where: {
      selector,
    },
  });

  if (house === null) {
    throw new NotFoundError('House not found');
  }

  room.house_id = house.id;
  // the name is only unique per house: a second "Living room" in another house
  // gets a free selector ("living-room-2"), the selector being the room
  // identifier instance-wide
  room.selector = await buildUniqueSelector(db.Room, room.selector || room.name);
  const roomCreated = await db.Room.create(room);
  return roomCreated.get({ plain: true });
}

module.exports = {
  create,
};
