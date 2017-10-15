var queries = require('./sentence.queries.js');

module.exports = function(){
  return gladys.utils.sql(queries.getLabels, []);  
};