---
to: ./services/<%= module %>/lib/config/<%= module %>.saveConfiguration.js
---
const logger = require('../../../../utils/logger');
const { CONFIGURATION } = require('../utils/<%= module %>.constants');

/**
 * @description Return <%= className %> status.
 * @param {Object} configuration - <%= className %> configuration.
 * @param {string} [configuration.login] - <%= className %> username.
 * @param {string} [configuration.password] -  <%= className %> password.
 * @returns {any} Null.
 * @example
 * <%= module %>.saveConfiguration();
 */
async function saveConfiguration({ login, password }) {
  logger.debug(`<%= className %>: save config`);
  await this.gladys.variable.setValue(CONFIGURATION.<%= constName %>_LOGIN_KEY, login, this.serviceId);
  await this.gladys.variable.setValue(CONFIGURATION.<%= constName %>_COUNTRY_KEY, password, this.serviceId);
  return null;
}

module.exports = {
  saveConfiguration,
};
