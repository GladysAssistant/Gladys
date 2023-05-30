const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description User seen in house.
 * @param {string} houseSelector - The selector of the house.
 * @param {string} userSelector - The selector of the user.
 * @returns {Promise} Resolve with updated user.
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

  let userFinal = user;

  // user was not in this house before
  if (user.current_house_id !== house.id) {
    // we check if the house was empty before
    const usersInThisHouseBeforeTheUserCameBack = await db.User.count({
      where: {
        current_house_id: house.id,
      },
    });
    userFinal = await user.update({
      current_house_id: house.id,
      last_house_changed: new Date(),
    });
    // so we emit back at home event
    this.event.emit(EVENTS.TRIGGERS.CHECK, {
      type: EVENTS.USER_PRESENCE.BACK_HOME,
      user: userSelector,
      house: houseSelector,
    });
    // and we emit websocket event so that the change is sent to UI
    this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.USER_PRESENCE.BACK_HOME,
      payload: userFinal.get({ plain: true }),
    });
    // the house was empty before, but no longer empty
    // because the user came back, we start related scenes
    if (usersInThisHouseBeforeTheUserCameBack === 0) {
      this.event.emit(EVENTS.TRIGGERS.CHECK, {
        type: EVENTS.HOUSE.NO_LONGER_EMPTY,
        house: houseSelector,
      });
    }
  } else {
    // otherwise, we just emit user seen event
    this.event.emit(EVENTS.USER_PRESENCE.SEEN_AT_HOME, userFinal.get({ plain: true }));
  }

  return userFinal.get({ plain: true });
}

module.exports = {
  userSeen,
};
