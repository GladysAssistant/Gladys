const queries = require('./message.queries');

module.exports = function getConversation(uuid) {
    return gladys.utils.sql(queries.getConversation, [uuid]);
};