const queries = require('./calendar.queries.js');

module.exports = function getNextEventUser(user) {
    return gladys.utils.sqlUnique(queries.getNextEventUser, [user.id]);
};