var queries = require('./state.queries.js');

module.exports = function(state){
  sails.log.info(`State : deleting state ${state.id}`);
    
  return gladys.utils.sql(queries.delete, [state.id]);
};