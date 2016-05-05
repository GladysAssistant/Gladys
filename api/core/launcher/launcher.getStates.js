var queries = require('./launcher.queries.js');

module.exports = function(options){
    
  // we get all the states
  return gladys.utils.sql(queries.getStates, [options.id]);
};