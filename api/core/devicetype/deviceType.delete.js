var queries = require('./deviceType.queries.js');

module.exports = function (deviceType){
  return gladys.utils.sqlUnique(queries.delete, [deviceType.id]);  
};