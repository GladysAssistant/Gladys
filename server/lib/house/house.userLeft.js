const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description User left the house.
 * @param {string} houseSelector - The selector of the house.
 * @param {string} userSelector - The selector of the user.
 * @returns {Promise} Resolve with updated user.
 * @example
 * gladys.house.userLeft('main-house', 'john');
 */
async function userLeft(houseSelector, userSelector) {
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
  let userPlainFinal = userFinal.get({ plain: true });

  // user was in the house before
  if (userPlainFinal.current_house_id === house.id) {
    logger.debug(`User ${userSelector} left home ${houseSelector}`);
    userFinal = await user.update({
      current_house_id: null,
      last_house_changed: new Date(),
    });
    userPlainFinal = userFinal.get({ plain: true });
    // we update the user in RAM
    this.stateManager.setState('user', userPlainFinal.selector, userPlainFinal);
    this.stateManager.setState('userById', userPlainFinal.id, userPlainFinal);
    // so we emit left home event
    this.event.emit(EVENTS.TRIGGERS.CHECK, {
      type: EVENTS.USER_PRESENCE.LEFT_HOME,
      user: userSelector,
      house: houseSelector,
    });
    // and we emit websocket event so that the change is sent to UI
    this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.USER_PRESENCE.LEFT_HOME,
      payload: userPlainFinal,
    });
    // we check if the house is now empty
    const usersStillInThisHouse = await db.User.count({
      where: {
        current_house_id: house.id,
      },
    });
    // the house is empty
    if (usersStillInThisHouse === 0) {
      this.event.emit(EVENTS.TRIGGERS.CHECK, {
        type: EVENTS.HOUSE.EMPTY,
        house: houseSelector,
      });
    }
  }

  return userPlainFinal;
}

module.exports = {
  userLeft,
};
