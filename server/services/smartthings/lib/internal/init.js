const { VARIABLES } = require('../../utils/constants');
const logger = require('../../../../utils/logger');

/**
 * @description Initialize all needs to make SmartThings works.
 * @returns {Promise<boolean>} Indicates if well configured.
 * @example
 * await smartthingsHandler.init();
 */
async function init() {
  this.checkClient();

  try {
    const clientId = await this.gladys.variable.getValue(VARIABLES.SMT_PUBLIC_KEY, this.serviceId);
    const clientSecret = await this.gladys.variable.getValue(VARIABLES.SMT_SECRET_KEY, this.serviceId);

    this.createConnector(clientId, clientSecret);
    logger.info('SmartThings well configured.');
  } catch (e) {
    this.connector = null;
    logger.warn('SmartThings failed to configure due to missing credentials.');
    return false;
  }

  return true;
}

module.exports = {
  init,
};
