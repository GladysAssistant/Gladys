const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description User seen in house.
 * @param {string} houseSelector - The selector of the house.
 * @param {string} userSelector - The selector of the user.
 * @example
 * gladys.house.userSeen('main-house', 'john');
 */
async function userSeen(houseSelector, userSelector) {
  const house = await db.House.findOne({
    where: {
      selector: houseSelector,
    },
  });

  if (house === null) {
    throw new NotFoundError('House not found');
  }

  const user = await db.User.findOne({
    attributes: ['id', 'firstname', 'lastname', 'selector', 'email', 'current_house_id', 'last_house_changed'],
    where: {
      selector: userSelector,
    },
  });

  if (user === null) {
    throw new NotFoundError('User not found');
  }

  const userPlain = user.get({ plain: true });

  // user was not in this house before
  if (user.current_house_id !== house.id) {
    await user.update({ current_house_id: house.id, last_house_changed: new Date() });
    // so we emit back at home event
    this.event.emit(EVENTS.USER_PRESENCE.BACK_HOME, userPlain);
    // and we emit websocket event so that the change is sent to UI
    this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.USER_PRESENCE.BACK_HOME,
      payload: userPlain,
    });
  } else {
    // otherwise, we just emit user seen event
    this.event.emit(EVENTS.USER_PRESENCE.SEEN_AT_HOME, userPlain);
  }

  return userPlain;
}

module.exports = {
  userSeen,
};
