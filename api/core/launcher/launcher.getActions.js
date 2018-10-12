var queries = require('./launcher.queries.js');
var Promise = require('bluebird');

module.exports = function(options){
    
  // we get all the actions
  return gladys.utils.sql(queries.getActions, [options.id])
    .then(function(actions){
        
      // foreach action, we get all it params
      return Promise.map(actions, function(action){
        return getParams(action); 
      });
    });  
};


function getParams(action){
  return gladys.utils.sql(queries.getActionParams, [action.id])
    .then(function(params){
      action.params = params;
      return action; 
    });
}