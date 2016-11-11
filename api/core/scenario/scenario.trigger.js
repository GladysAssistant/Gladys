var queries = require('./scenario.queries.js');
var template = require('es6-template-strings');
var clone = require('clone');
var Promise = require('bluebird');

module.exports = function(params) {
    
    // clone params so that original object is not affected
    params = clone(params);

    sails.log.info(`Scenario : Trigger : New event : ${params.code}`);

    // we get all launchers with this code
    return gladys.utils.sql(queries.getLaunchersWithCode, [params.code])
        .then(function(launchers) {
            
            sails.log.info(`Scenario : Trigger : Found ${launchers.length} launchers with code ${params.code}.`);

            // initialize scope
            params.scope = params.scope || {};
            if(params.house) params.scope.house = params.house;
            if(params.user) params.scope.user = params.user;
            if(params.room) params.scope.room = params.room;
            if(params.value) params.scope.value = params.value;
            if(params.datetime) params.scope.datetime = params.datetime;

            // foreach launcher, we verify if the condition is satisfied
            // and if yes, start all the actions
            return Promise.map(launchers, function(launcher) {
                return verifyAndStart(launcher, params.scope);
            });
        });

};


function verifyAndStart(launcher, scope) {

    // first, we verify the launcher condition
    return verifyLauncherCondition(launcher, scope)
        .then(function() {
            // then, we verify the states conditions 
            return gladys.scenario.verifyConditions({
                launcher: launcher
            });
        })
        .then(function(conditions) {
            
            sails.log.info(`Scenario : Trigger : Conditions verified, starting all actions.`);
            
            // it's ok, so we start all the actions
            var obj = {
                launcher: launcher,
                scope: gladys.utils.concatArray(conditions, scope)
            };
            return gladys.scenario.exec(obj);
        })
        .catch(function(err) {
            
            // if the error is not a conditions_not_verified error, 
            // we propagate the error
            if (err.message !== 'conditions_not_verified') {
                sails.log.error(err);
            } else {
                sails.log.info(`Scenario : Trigger : Condition not verified.`);
            }
        });
}


// verify a condition. Ex: temperature > 10. scope is an object injected in
// the template
function verifyLauncherCondition(launcher, scope) {
    try {
        var result = template('${' + launcher.condition_template + '}', scope);
        if (result == 'true') {
            
            sails.log.info(`Scenario : Trigger : Launcher condition verified.`);  
            return Promise.resolve(true);
        } else  {
            return Promise.reject(new Error('conditions_not_verified'));
        }
    } catch (e) {
        return Promise.reject(new Error(e));
    }
}
