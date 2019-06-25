/**
 * @description Init room.
 * @example
 * room.init();
 */
async function init() {
  const rooms = await this.getAll();

  rooms.forEach((room) => {
    this.brain.addRoom(room);
  });
}

module.exports = {
  init,
};
