const { SUPPORTED_LANGUAGES } = require('../../config/brain/index');

/**
 * @description Add an entity to the named entity manager.
 * @param {string} entity - The entity type.
 * @param {string} identifier - The identifier of the entity.
 * @param {string} name - The name of the entity.
 * @example
 * brain.addNamedEntity('room', '1794c473-fc19-403f-bff7-a7fe667b4604', 'living room');
 */
function addNamedEntity(entity, identifier, name) {
  this.namedEntities[entity].set(name, identifier);
  this.nlpManager.addNamedEntityText(entity, identifier, SUPPORTED_LANGUAGES, [name]);
}

module.exports = {
  addNamedEntity,
};
