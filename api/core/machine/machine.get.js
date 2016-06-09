var queries = require('./machine.queries.js');

module.exports = function get(){
    return gladys.utils.sql(queries.get, []);
};