const db = require('../../models');

/**
 * @description Get all rooms.
 * @returns {Promise<Array>} Resolve with list of rooms.
 * @example
 * const rooms = await room.getAll();
 */
async function getAll() {
  const rooms = await db.Room.findAll();
  const roomsPlain = rooms.map((room) => room.get({ plain: true }));
  return roomsPlain;
}

module.exports = {
  getAll,
};
