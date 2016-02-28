var queries = require('./scenario.queries.js');
var template = require('es6-template-strings');
var Promise = require('bluebird');

module.exports = function(params){
     return gladys.utils.sql(queries.getLaunchersWithCode, [params.eventName])
           .then(function(launchers){
               return Promise.map(launchers, function(launcher){
                  return verifyCondition(launcher, params.scope); 
               });
           })
           .then(function(){
               
           })
           .catch(function(err){
              if(err.message !== 'condition_not_verified'){
                  throw err;
              }
           });
};


// verify a condition. Ex: temperature > 10. scope is an object injected in
// the template
function verifyCondition(launcher, scope){
    try {
        var result = template('${'+ launcher.condition +'}', scope);
        if(result == 'true') {
            return Promise.resolve(true);
        } else {
            return Promise.reject(new Error('condition_not_verified'));
        }
    } catch (e){
        return Promise.reject(new Error(e));
    }
}