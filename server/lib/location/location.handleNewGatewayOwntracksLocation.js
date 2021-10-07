const logger = require('../../utils/logger');
const { BadParameters } = require('../../utils/coreErrors');

/**
 * @description Handle New Gateway Owntracks Location.
 * @param {Object} data - Gateway data message.
 * @example
 * handleNewGatewayOwntracksLocation(data);
 */
async function handleNewGatewayOwntracksLocation(data) {
  if (!data || !data.user_id || !data.latitude || !data.longitude) {
    throw new BadParameters('user_id, latitude and longitude are required.');
  }
  logger.debug(`Received new Owntracks location through Gateway for user ${data.user_id}`);
  const user = await this.user.getById(data.user_id);
  return this.handleNewOwntracksLocation(user, data);
}

module.exports = {
  handleNewGatewayOwntracksLocation,
};
