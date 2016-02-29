var Promise = require('bluebird');

module.exports = function exec (params) {
    
    // we get all the actions to execute
    return gladys.scenario.getActions(params)
           .then(function(actions){
               
               // foreach action, we execute it
               return Promise.map(actions, function(actiontype){
                    return gladys.scenario.execAction({actiontype: actiontype, scope: params.scope}); 
               });
           });
};