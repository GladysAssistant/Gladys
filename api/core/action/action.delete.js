var queries = require('./action.queries.js');

module.exports = function(action){
    
  // first we delete actionsParams
  return gladys.utils.sql(queries.deleteParams, [action.id])
     .then(function(){
         
         sails.log.info(`Action : deleting action ${action.id}`);
         
         // then we delete actions
         return gladys.utils.sql(queries.delete, [action.id]);
     });
};