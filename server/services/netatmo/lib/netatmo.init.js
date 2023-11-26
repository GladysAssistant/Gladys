const logger = require('../../../utils/logger');

/**
 * @description Initialize service with properties and connect to devices.
 * @example
 * await init();
 */
async function init() {
  const configuration = await this.getConfiguration();
}

module.exports = {
  init,
};
