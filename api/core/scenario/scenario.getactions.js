var queries = require('./scenario.queries.js');
var Promise = require('bluebird');

module.exports = function(params) {

  // we get all the actions of a specific launcher
  return gladys.utils.sql(queries.getActionsLauncher, [params.launcher.id])
    .then(function(actions) {
            
      // for each action, we get the params
      return getParams(actions);
    });
};

function getParams(actions) {
    
  // foreach action, we get it params 
  return Promise.map(actions, function(action, index) {

    // we get the params
    return gladys.utils.sql(queries.getActionParams, [action.actionId])
      .then(function(actionparams) {
                
        // we init the param object
        actions[index].params = {};
                
        // foreach actionParams
        actionparams.forEach(function(param){
                    
          // we set the value of the param
          actions[index].params[param.variablename] = param.value;
        });
      });
  })
    .then(function() {
      return actions;
    });
}
