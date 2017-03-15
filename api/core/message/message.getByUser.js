const queries = require('./message.queries.js');

module.exports = function getByUser(user, options) {
    options = options || {};
    options.skip = parseInt(options.skip) || 0;
    options.take = parseInt(options.take) || 50;

    // if user is NULL, we want gladys messages
    if(options.user === null) return gladys.utils.sql(queries.getGladysMessages, [user.id, user.id, options.take, options.skip]);

    // if user is not null, we want messages from another user
    return gladys.utils.sql(queries.getByUser, [user.id, options.user, user.id, options.user, options.take, options.skip]);
};