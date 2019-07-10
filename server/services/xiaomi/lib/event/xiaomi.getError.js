const logger = require('../../../../utils/logger');

/**
 * @description Get Error
 * @param {string} e - Error.
 * @example
 * getError('One Error');
 */
async function getError(e) {
  logger.debug(`${e}`);
}

module.exports = {
  getError,
};
