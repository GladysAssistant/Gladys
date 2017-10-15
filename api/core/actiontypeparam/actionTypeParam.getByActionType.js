var queries = require('./actionTypeParam.queries.js');

module.exports = function(options){
    return gladys.utils.sql(queries.getByActionType, [options.actiontype]);    
};
