const { similarity } = require('@nlpjs/similarity');
const logger = require('../../utils/logger');

const SIMILAR_THRESHOLD = 3;

/**
 * @description Return entity id by name.
 * @param {string} entity - The entity type.
 * @param {string} name - The name of the entity.
 * @returns {string} Return the id of the entity.
 * @example
 * brain.getEntityIdByName('room', 'salon');
 */
function getEntityIdByName(entity, name) {
  logger.debug(`Brain: Trying to find entity ${entity} with name ${name}`);
  // if no entity exist with this name
  if (!this.namedEntities[entity]) {
    return undefined;
  }
  // If we find an exact match, we resolve immediately
  const exactMatch = this.namedEntities[entity].get(name);
  if (exactMatch) {
    return exactMatch;
  }
  // If not, we calculate similarity
  const similars = [];
  this.namedEntities[entity].forEach((identifier, nameInDb) => {
    const similarNumber = similarity(nameInDb, name, true);
    if (similarNumber <= SIMILAR_THRESHOLD) {
      similars.push({ identifier, similarNumber });
    }
  });

  // if some similarity are found, we order by similarity
  if (similars.length > 0) {
    similars.sort((a, b) => a.similarNumber - b.similarNumber);
    logger.debug(similars);
    // and return the first one
    return similars[0].identifier;
  }

  return undefined;
}

module.exports = {
  getEntityIdByName,
};
