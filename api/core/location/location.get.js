const queries = require('./location.queries');

module.exports = function get(){

    return gladys.utils.sql(queries.getLastLocationUser, []);
};