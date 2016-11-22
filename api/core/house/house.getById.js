var queries = require('./house.queries.js');

module.exports = function getById(options){
    
    return gladys.utils.sqlUnique(queries.getById, [options.id]);
};