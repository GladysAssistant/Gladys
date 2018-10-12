var queries = require('./stateTemplateParam.queries.js');

module.exports = function(options){
  return gladys.utils.sql(queries.getByStateType, [options.statetype]);    
};