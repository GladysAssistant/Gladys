const logger = require('../../utils/logger');

/**
 * @description Delete client_id and secrei_id of current oauth2 integration.
 * @param {string} integrationName - Name of oauth2 integration.
 * @param {string} serviceId - Gladys serviceId of current integration.
 * @param {string} userId - Gladys userId.
 * @returns {Promise} Resolve with current integration service id.
 * @example
 * oauth2.deleteVar(
 *  integrationName: 'withings',
 *  userId: fd81vs687f0bf3414e0fe3facfba7be9455109409a'
 *  }
 * );
 */
async function deleteVar(integrationName, serviceId, userId) {
  try {
    await this.gladys.variable.destroy(`${integrationName.toUpperCase()}_CLIENT_ID`, serviceId, userId);
    await this.gladys.variable.destroy(`${integrationName.toUpperCase()}_SECRET_ID`, serviceId, userId);
  } catch (error) {
    logger.error(error.message);
    return { success: false, errorMsg: error.message };
  }

  return { success: true };
}

module.exports = {
  deleteVar,
};
