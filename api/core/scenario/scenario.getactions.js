var queries = require('./scenario.queries.js');
var Promise = require('bluebird');

module.exports = function(params){
    
    // we get all the actions of a specific launcher
    return gladys.utils.sql(queries.getActionsLauncher, [params.launcher.id])
        .then(function(actions){
            
           // for each action, we get the params
           return getParams(actions);
        });
};

function getParams(actions){
   return Promise.map(actions, function(action, index){
       
        // we get the params
        return gladys.utils.sql(queries.getActionParams, [action.id])
                    .then(function(actionsparams){
                        actions[index].actionsparams = actionsparams;
                    });
    })
    .then(function(){
        return actions;
    });
}