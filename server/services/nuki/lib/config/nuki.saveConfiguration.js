const logger = require('../../../../utils/logger');
const { CONFIGURATION } = require('../utils/nuki.constants');

/**
 * @description Return Nuki status.
 * @param {object} [configuration] - Nuki configuration.
 * @param {string} [configuration.login] - Nuki username.
 * @param {string} [configuration.password] -  Nuki password.
 * @returns {any} Null.
 * @example
 * nuki.saveConfiguration();
 */
async function saveConfiguration({ login, password }) {
  logger.debug(`Nuki: save config`);
  logger.debug(
    `Nuki: save config with ${CONFIGURATION.NUKI_LOGIN_KEY}=${login},${CONFIGURATION.NUKI_PASSWORD_KEY}=${password}`,
  );
  await this.gladys.variable.setValue(CONFIGURATION.NUKI_LOGIN_KEY, login, this.serviceId);
  await this.gladys.variable.setValue(CONFIGURATION.NUKI_PASSWORD_KEY, password, this.serviceId);
  return null;
}

module.exports = {
  saveConfiguration,
};
