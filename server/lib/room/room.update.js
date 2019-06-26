const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Update a room.
 * @param {string} selector - The selector of the room.
 * @param {Object} room - The new room.
 * @example
 * gladys.room.update('kitchen', {
 *    name: 'New Kitchen'
 * });
 */
async function update(selector, room) {
  const existingRoom = await db.Room.findOne({
    where: {
      selector,
    },
  });

  if (existingRoom === null) {
    throw new NotFoundError('Room not found');
  }

  const oldName = existingRoom.name;

  await existingRoom.update(room);

  const updatedRoomPlain = existingRoom.get({ plain: true });

  if (oldName !== updatedRoomPlain.name) {
    this.brain.removeRoom({
      id: updatedRoomPlain.id,
      name: oldName,
    });
    this.brain.addRoom(updatedRoomPlain);
  }

  return updatedRoomPlain;
}

module.exports = {
  update,
};
