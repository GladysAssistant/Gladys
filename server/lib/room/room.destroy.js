const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Delete a room.
 * @param {string} selector - The selector of the room to delete.
 * @example
 * gladys.room.destroy('kitchen');
 */
async function destroy(selector) {
  const room = await db.Room.findOne({
    where: {
      selector,
    },
  });

  if (room === null) {
    throw new NotFoundError('Room not found');
  }

  this.brain.removeNamedEntity('room', room.id, room.name);

  await room.destroy();
}

module.exports = {
  destroy,
};
