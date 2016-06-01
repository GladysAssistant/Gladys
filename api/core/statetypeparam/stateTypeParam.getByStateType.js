var queries = require('./stateTypeParam.queries.js');

module.exports = function(options){
    return gladys.utils.sql(queries.getByStateType, [options.statetype]);    
};