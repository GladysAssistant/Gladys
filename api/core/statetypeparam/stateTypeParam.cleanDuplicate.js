var queries = require('./stateTypeParam.queries.js');

module.exports = function(){
    return gladys.utils.sql(queries.cleanDuplicateStateTypeParams, []);    
};