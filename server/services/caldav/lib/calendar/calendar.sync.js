const logger = require('../../../../utils/logger');
// const { getUsers } = require('./calendar.getUsers.js');
const { syncUser } = require('./calendar.syncUser.js');

/**
 * @description Sync calendars.
 * @param {string} userId - User id to sync.
 * @returns {Promise} All calendars are sync.
 * @example
 * sync();
 */
async function sync(userId) {
    // const users = await getUsers();
    // logger.info(`CalDAV - Calendar : Syncing ${users.length} users.`);
    const user = await this.gladys.user.getById(userId);
    // return Promise.map(users, (user) => {
    try {
        return syncUser(user);
    } catch (err) {
        logger.warn(`CalDAV - Calendar : Unable to sync user ID ${user.id}. ${err}`);
        return Promise.reject(err);
    };
    // }, { concurrency: 1 });
};

module.exports = {
    sync,
};