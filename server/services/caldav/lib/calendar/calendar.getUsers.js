const { getUsersQuery } = require('./calendar.queries.js');

/**
 * @description Get all CalDAV users.
 * @example
 * getUsers();
 * @returns {Array} Array of user.
 */
function getUsers() {
    return this.gladys.utils.sql(getUsersQuery, ['CALDAV_URL']);
};

module.exports = {
    getUsers,
};