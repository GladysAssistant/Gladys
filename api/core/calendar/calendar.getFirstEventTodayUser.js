const queries = require('./calendar.queries.js');

module.exports = function getFirstEventTodayUser(userId) {
    return gladys.utils.sqlUnique(queries.getFirstEventTodayUser, [userId]);
};