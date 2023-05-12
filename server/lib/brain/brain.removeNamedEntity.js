const { SUPPORTED_LANGUAGES } = require('../../config/brain/index');

/**
 * @description Remove a room.
 * @param {string} entity - The entity type.
 * @param {string} identifier - The identifier of the entity.
 * @param {string} name - The name of the entity.
 * @example
 * brain.removeNamedEntity(room);
 */
function removeNamedEntity(entity, identifier, name) {
  this.namedEntities[entity].delete(name);
  this.nlpManager.removeNamedEntityText(identifier, identifier, SUPPORTED_LANGUAGES, [name]);
}

module.exports = {
  removeNamedEntity,
};
