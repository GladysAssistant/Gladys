var queries = require('./house.queries.js');

module.exports = function(house){
    return gladys.utils.sqlUnique(queries.delete, [house.id]);
};