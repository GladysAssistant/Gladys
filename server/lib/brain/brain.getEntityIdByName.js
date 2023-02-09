/**
 * @description Return entity id by name
 * @param {string} entity - The entity type.
 * @param {string} name - The name of the entity.
 * @returns {string} Return the id of the entity.
 * @example
 * brain.addRoom(room);
 */
function getEntityIdByName(entity, name) {
  if (entity === 'room') {
    return this.roomsToId.get(name.toLowerCase());
  }
  return undefined;
}

module.exports = {
  getEntityIdByName,
};
