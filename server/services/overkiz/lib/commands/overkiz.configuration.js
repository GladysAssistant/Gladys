const logger = require('../../../../utils/logger');
const { OVERKIZ_SERVER_PARAM } = require('../overkiz.constants');

/**
 * @description Get Overkiz configuration.
 * @returns {Promise<object>} Return Overkiz configuration.
 * @example
 * overkiz.getConfiguration();
 */
async function getConfiguration() {
  logger.debug(`Overkiz : Config`);

  const overkizType = await this.gladys.variable.getValue(OVERKIZ_SERVER_PARAM.OVERKIZ_TYPE, this.serviceId);
  const overkizUsername = await this.gladys.variable.getValue(
    OVERKIZ_SERVER_PARAM.OVERKIZ_SERVER_USERNAME,
    this.serviceId,
  );
  const overkizPassword = await this.gladys.variable.getValue(
    OVERKIZ_SERVER_PARAM.OVERKIZ_SERVER_PASSWORD,
    this.serviceId,
  );
  return {
    overkizType,
    overkizUsername,
    overkizPassword,
  };
}

/**
 * @description Update Overkiz configuration.
 * @param {object} configuration - The Overkiz configuration.
 * @example
 * overkiz.updateConfiguration();
 */
async function updateConfiguration(configuration) {
  logger.debug(`Overkiz : Update configuration`);

  const { overkizType, overkizUsername, overkizPassword } = configuration;

  if (overkizType) {
    await this.gladys.variable.setValue(OVERKIZ_SERVER_PARAM.OVERKIZ_TYPE, overkizType, this.serviceId);
  }

  if (overkizUsername) {
    await this.gladys.variable.setValue(OVERKIZ_SERVER_PARAM.OVERKIZ_SERVER_USERNAME, overkizUsername, this.serviceId);
  }

  if (overkizPassword) {
    await this.gladys.variable.setValue(OVERKIZ_SERVER_PARAM.OVERKIZ_SERVER_PASSWORD, overkizPassword, this.serviceId);
  }
}

module.exports = {
  getConfiguration,
  updateConfiguration,
};
