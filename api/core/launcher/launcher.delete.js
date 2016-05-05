var queries = require('./launcher.queries.js');
var Promise = require('bluebird');

module.exports = function(launcher){
    
   // first, we delete all actions
  return deleteAllActions(launcher)
    .then(function(){
        
        // then, we delete all states
        return deleteAllStates(launcher);
    })
    .then(function(){
        
        // finally, we delete the launcher
       return gladys.utils.sql(queries.delete, [launcher.id]); 
    });
};

// delete all states associated with the launcher
function deleteAllStates(launcher){
  return gladys.launcher.getStates(launcher)
    .then(function(states){
       return Promise.map(states, function(state){
          return gladys.state.delete(state); 
       });
    });  
}

// delete all the actions associated with the launcher
function deleteAllActions(launcher){
   return gladys.launcher.getActions(launcher)
    .then(function(actions){
       return Promise.map(actions, function(action){
          return gladys.action.delete(action); 
       });
    });
}