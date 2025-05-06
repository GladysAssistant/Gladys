const fs = require('fs');
const logger = require('../../utils/logger');

/**
 * @description Return true if process is running inside Docker & can use the Docker API.
 * @returns {Promise<boolean>} Resolve with true if inside Docker and can use the Docker API.
 * @example
 * gladys.system.isDocker();
 */
async function isDocker() {
  try {
    await fs.promises.access('/.dockerenv', fs.constants.F_OK);
    logger.info('System.isDocker: This system is running inside Docker.');
    return !!this.dockerode;
  } catch (err) {
    logger.debug(err);
    logger.info('System.isDocker: This system is not running inside Docker.');
    return false;
  }
}

module.exports = {
  isDocker,
};
