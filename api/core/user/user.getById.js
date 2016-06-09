var Promise = require('bluebird');
var queries = require('./user.queries.js');

module.exports = function (params){
    
    // get user by id
    return gladys.utils.sqlUnique(queries.getById, [params.id]);
};