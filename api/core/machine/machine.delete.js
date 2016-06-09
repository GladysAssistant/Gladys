var queries = require('./machine.queries.js');

module.exports = function(machine){
    return gladys.utils.sqlUnique(queries.delete, [machine.id]);    
};