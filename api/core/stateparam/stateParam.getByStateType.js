var queries = require('./stateParam.queries.js');

module.exports = function(options){
    return gladys.utils.sql(queries.getByStateType, [options.statetype]);    
};