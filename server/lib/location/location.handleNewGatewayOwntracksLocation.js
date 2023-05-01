const logger = require('../../utils/logger');
const { BadParameters } = require('../../utils/coreErrors');

/**
 * @description Handle New Gateway Owntracks Location.
 * @param {object} data - Gateway data message.
 * @returns {Promise<object>} Resolve with location created.
 * @example
 * handleNewGatewayOwntracksLocation(data);
 */
async function handleNewGatewayOwntracksLocation(data) {
  if (!data || !data.user_id || !data.latitude || !data.longitude) {
    throw new BadParameters('user_id, latitude and longitude are required.');
  }
  logger.debug(`Received new Owntracks location for user ${data.user_id}`);
  const user = await this.user.getById(data.user_id);
  const location = {
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: data.accuracy,
    altitude: data.altitude,
  };
  return this.create(user.selector, location);
}

module.exports = {
  handleNewGatewayOwntracksLocation,
};
