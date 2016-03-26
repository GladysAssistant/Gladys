var queries = require('./user.queries.js');

module.exports = function getAdmin(){
    
    return gladys.utils.sql(queries.getAdmin, []);
};