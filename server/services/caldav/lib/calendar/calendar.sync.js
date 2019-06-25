const logger = require('../../../../utils/logger');

/**
 * @description Sync calendars.
 * @param {string} userId - User id to sync.
 * @returns {Promise} All calendars are sync.
 * @example
 * sync(user.id);
 */
async function sync(userId) {
  try {
    return this.syncUser(userId);
  } catch (err) {
    logger.warn(`CalDAV - Calendar : Unable to sync user ID ${userId}. ${err}`);
    return Promise.reject(err);
  };
};

module.exports = {
  sync,
};