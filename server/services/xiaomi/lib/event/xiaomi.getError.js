const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');
/**
 * @description Add node
 * @param {string} e - Error.
 * @example
 * getError(true);
 */
async function getError(e) {
  logger.debug(`${e}`);
}

module.exports = {
  getError,
};
