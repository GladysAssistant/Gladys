const logger = require('../../utils/logger');

/**
 * @description Save client_id and secrei_id of current oauth2 integration.
 * @param {string} clientId - The client_id of oauth2.
 * @param {string} secretId - The secret_id of oauth2. 
 * @param {string} integrationName - Name of oauth2 integration.
 * @param {string} serviceId - Gladys serviceId of current integration.
 * @param {string} userId - Gladys userId of current session.
 * @returns {Promise} Resolve with current integration service id.
 * @example
 * oauth2.saveVar(
 *  'b2f2c27f0bf3414e0fe3facfba7be9455109409a',
 *  '9d41fe14fz23414e0fe3facfba7be9455109409a',
 *  'withings',
 *  ffsdvs687f0bf3414e0fe3facfba7be945510fds09a'
 *  fd81vs687f0bf3414e0fe3facfba7be9455109409a'
 *  }
 * );
 */
async function saveVar(clientId, secretId, integrationName, serviceId, userId) {
  try {
    await this.gladys.variable.setValue(`${integrationName.toUpperCase()}_CLIENT_ID`, clientId, serviceId, userId);
    await this.gladys.variable.setValue(`${integrationName.toUpperCase()}_SECRET_ID`, secretId, serviceId, userId);
  } catch (error) {
    logger.error(error.message);
    return { success: false, errorMsg: error.message };
  }

  return { success: true };
}

module.exports = {
  saveVar,
};
