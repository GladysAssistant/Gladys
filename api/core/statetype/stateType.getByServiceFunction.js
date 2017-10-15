const queries = require('./stateType.queries.js');    

module.exports = function getByServiceFunction(stateType){
    return gladys.utils.sqlUnique(queries.getByServiceFunction, [stateType.service, stateType.function]);
};