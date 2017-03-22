const queries = require('./location.queries');

module.exports = function getUser(user, options) {
    options = options || {};
    options.accuracy = options.accuracy  || 300;

    return gladys.utils.sqlUnique(queries.getLastLocationOneUser, [user.id, options.accuracy]);
};