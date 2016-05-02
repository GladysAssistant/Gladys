var queries = require('./scenario.queries.js');
var template = require('es6-template-strings');
var Promise = require('bluebird');

module.exports = function(params) {
    
    sails.log.info(`New event : ${params.code}`);

    // we get all launchers with this code
    return gladys.utils.sql(queries.getLaunchersWithCode, [params.code])
        .then(function(launchers) {

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
            }
        });
}


// verify a condition. Ex: temperature > 10. scope is an object injected in
// the template
function verifyLauncherCondition(launcher, scope) {
    try {
        var result = template('${' + launcher.condition_template + '}', scope);
        if (result == 'true') {
            return Promise.resolve(true);
        } else  {
            return Promise.reject(new Error('conditions_not_verified'));
        }
    } catch (e) {
        return Promise.reject(new Error(e));
    }
}
