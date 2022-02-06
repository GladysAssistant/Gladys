const logger = require('../../utils/logger');
const { OAUTH2 } = require('../../utils/constants');
const { Error500 } = require('../../utils/httpErrors');

/**
 * @description Delete client_id and secrei_id of current oauth2 integration.
 * @param {string} serviceId - Gladys serviceId of current integration.
 * @param {string} userId - Gladys userId of current session.
 * @returns {Promise} Resolve with current integration service id.
 * @example
 * oauth2.deleteClient(
 *  userId: fd81vs687f0bf3414e0fe3facfba7be9455109409a'
 *  serviceId: 'ffsdvs687f0bf3414e0fe3facfba7be945510fds09a'
 *  }
 * );
 */
async function deleteClient(serviceId, userId) {
  try {
    await this.gladys.variable.destroy(`${OAUTH2.VARIABLE.CLIENT_ID}`, serviceId, userId);
    await this.gladys.variable.destroy(`${OAUTH2.VARIABLE.CLIENT_SECRET}`, serviceId, userId);
    await this.gladys.variable.destroy(`${OAUTH2.VARIABLE.ACCESS_TOKEN}`, serviceId, userId);
  } catch (error) {
    logger.error(error.message);
    throw new Error500(error);
  }

  return { success: true };
}

module.exports = {
  deleteClient,
};
