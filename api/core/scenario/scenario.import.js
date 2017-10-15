const Promise = require('bluebird');

module.exports = function(params) {

    var result = {};

    // we get the id of the eventtype in DB
    return gladys.eventType.getByCode({code: params.trigger.code})
        .then((eventType) => {

            sails.log.info(`Scenario : import : creating launcher with code "${eventType.code}"`);

            var launcher = {
                eventtype: eventType.id,
                title: params.trigger.title,
                condition_template: params.trigger.condition_template,
                active: params.trigger.active,
                user: params.trigger.user
            };

            // if we want to create the launcher with a specific idea, it's possible
            if(params.trigger.id) launcher.id = params.trigger.id;
            
            return gladys.launcher.create(launcher);
        })
        .then((launcher) => {

            result.launcher = launcher;

            sails.log.info(`Scenario : import : Launcher created. Creating now ${params.conditions.length} conditions`);

            // foreach condition
            return Promise.map(params.conditions, function(condition){

                var splitted = condition.code.split('.');
                
                // create state in DB
                return gladys.stateType.getByServiceFunction({service: splitted[0], function: splitted[1]})
                    .then(stateType => gladys.state.create({
                        state: stateType.id,
                        condition_template: condition.condition_template,
                        active: condition.active,
                        launcher: launcher.id,
                        params: condition.params
                    }));
            });
        })
        .then((states) => {

            result.states = states;

            sails.log.info(`Scenario : import : Conditions inserted with success, creating ${params.actions.length} actions.`);

            return Promise.map(params.actions, function(action){
                var splitted = action.code.split('.');
                return gladys.actionType.getByServiceFunction({service: splitted[0], function: splitted[1]})
                    .then((actionType) => gladys.action.create({
                        action: actionType.id,
                        launcher: result.launcher.id,
                        params: action.params
                    }));
            });
        })
        .then((actions) => {
            result.actions = actions;
            sails.log.info(`Scenario : import : Action inserted with success !`);
            
            return {
                trigger: result.launcher,
                conditions: result.states,
                actions: result.actions
            };
        });
    
};