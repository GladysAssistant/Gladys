var queries = require('./param.queries.js');
var shared = require('./param.shared.js');

module.exports = function(param){
    
    // delete cache entry
    if(shared.cache.hasOwnProperty(param.name)){
        delete shared.cache[param.name];
    }
    
    // delete in db
    return gladys.utils.sql(queries.delete, [param.name]);
};