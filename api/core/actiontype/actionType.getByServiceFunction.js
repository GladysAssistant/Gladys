const queries = require('./actionType.queries.js');    

module.exports = function getByServiceFunction(actionType){
    return gladys.utils.sqlUnique(queries.getByServiceFunction, [actionType.service, actionType.function]);
};