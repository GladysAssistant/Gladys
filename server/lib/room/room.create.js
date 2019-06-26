const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Create a room in a house.
 * @param {string} selector - The selector of a house.
 * @param {Object} room - The room to create.
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
  const roomCreated = await db.Room.create(room);
  const roomPlain = roomCreated.get({ plain: true });

  // add room to the brain
  this.brain.addRoom(roomPlain);

  return roomPlain;
}

module.exports = {
  create,
};
