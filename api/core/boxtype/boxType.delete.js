var queries = require('./boxType.queries.js');

module.exports = function (boxType){
    return gladys.utils.sql(queries.delete, [boxType.id]);
};
