const { SUPPORTED_LANGUAGES } = require('../../config/brain/index');

/**
 * @description Remove a room
 * @param {Object} room - The old room object to remove.
 * @example
 * brain.removeRoom(room);
 */
function removeRoom(room) {
  this.nlpManager.removeNamedEntityText('room', room.id, SUPPORTED_LANGUAGES, [room.name]);
}

module.exports = {
  removeRoom,
};
