const logger = require('../../utils/logger');
const { BadParameters } = require('../../utils/coreErrors');

/**
 * @description Handle New Owntracks Location.
 * @param {Object} user - User object.
 * @param {Object} data - Owntracks data message.
 * @example
 * handleNewOwntracksLocation(user, data);
 */
async function handleNewOwntracksLocation(user, data) {
  if (!data || !data.latitude || !data.longitude) {
    throw new BadParameters('latitude and longitude are required.');
  }
  logger.debug(`Received new Owntracks location for user ${user.selector}`);
  const location = {
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: data.accuracy,
    altitude: data.altitude,
  };
  return this.create(user.selector, location);
}

module.exports = {
  handleNewOwntracksLocation,
};
