var queries = require('./house.queries.js');

module.exports = function get (options){
    
    return gladys.utils.sql(queries.getAll, []);
};