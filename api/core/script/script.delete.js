var queries = require('./script.queries.js');

module.exports = function(script){
   return gladys.utils.sql(queries.deleteScript, [script.id]); 
};