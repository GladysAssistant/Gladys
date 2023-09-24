const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description Save the location of the user.
 * @param {string} userSelector - The selector of the user.
 * @param {object} location - The location object.
 * @returns {Promise} Resolve with the created location.
 * @example
 * gladys.location.create('tony', {
 *    latitude: 12,
 *    longitude: 12,
 * });
 */
async function create(userSelector, location) {
  const user = await db.User.findOne({
    where: {
      selector: userSelector,
    },
  });
  if (user === null) {
    throw new NotFoundError('User not found');
  }
  const previousLocation = {
    latitude: user.last_latitude,
    longitude: user.last_longitude,
  };
  const locationWithUserId = { ...location, user_id: user.id };
  const createdLocation = await db.Location.create(locationWithUserId);
  const newLocation = {
    latitude: createdLocation.latitude,
    longitude: createdLocation.longitude,
  };
  await user.update({
    last_latitude: createdLocation.latitude,
    last_longitude: createdLocation.longitude,
    last_altitude: createdLocation.altitude,
    last_accuracy: createdLocation.accuracy,
    last_location_changed: createdLocation.created_at,
  });
  // emit a new location event to check area
  this.event.emit(EVENTS.USER.NEW_LOCATION, {
    userSelector: user.selector,
    previousLocation,
    newLocation,
  });
  // send websocket event
  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.LOCATION.NEW,
    payload: {
      id: user.id,
      last_latitude: createdLocation.latitude,
      last_longitude: createdLocation.longitude,
      last_location_changed: createdLocation.created_at,
    },
  });
  return createdLocation.get({ plain: true });
}

module.exports = {
  create,
};
