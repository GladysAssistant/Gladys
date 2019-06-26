const { SUPPORTED_LANGUAGES } = require('../../config/brain/index');

/**
 * @description Add a room to the named entity manager
 * @param {Object} room - The room object.
 * @example
 * brain.addRoom(room);
 */
function addRoom(room) {
  this.nlpManager.addNamedEntityText('room', room.id, SUPPORTED_LANGUAGES, [room.name]);
}

module.exports = {
  addRoom,
};
