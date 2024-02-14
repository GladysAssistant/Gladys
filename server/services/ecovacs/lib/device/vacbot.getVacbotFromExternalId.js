const logger = require('../../../../utils/logger');

/**
 * @description Get Vacbot Obj from Gladys device external Id.
 * @param {string} externalId - Gladys device external_id.
 * @returns {object} Vacbot object.
 * @example
 * vacbot.getVacbotFromExternalId(external_id);
 */
function getVacbotFromExternalId(externalId) {
  logger.debug(`Vacbot: Get Vacbot Obj from Gladys device external Id`);
  let vacbot;
  // get vacbot object TODO : improve this part (new util func ie: this.vacbots[device])
  this.vacbots.forEach((value, key) => {
    if (key.external_id === externalId) {
      vacbot = value;
    }
  });
  return vacbot;
}

module.exports = {
  getVacbotFromExternalId,
};
