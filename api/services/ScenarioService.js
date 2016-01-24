/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * Can trigger an event (ex: alarmRing), then analyse all the consequence of this launcher
 * (Ex: for alarm => turnOn the light, turnOn the music, etc...)
 * Then launch Actions relative to this launcher
 * @method launchFunction
 * @param {} serviceName
 * @param {} functionName
 * @param {} parameters
 * @return 
 */
function launchFunction (serviceName, functionName, parameters) {
	var fn = global[serviceName][functionName];
	if (typeof fn === "function"){
		fn.apply(null, parameters);
	}else{
		sails.log.warn(serviceName + ' ' + functionName + ' is not a function');
	}
}

/**
 * Description
 * @method formatParam
 * @param {} parameters
 * @return parameters
 */
function formatParam(parameters) {
	if (!(parameters instanceof Array)) {
		try {
			parameters = JSON.parse(parameters);
		} catch (e) {
			// it was not a JSON String
			parameters = [parameters];
		}
	}
	if (!(parameters instanceof Array)) {
		parameters = [parameters];
	}
	return parameters;
}

 /**
  * launch multiple actions
  * @method launchActions
  * @param {} actions
  * @return 
  */
 function launchActions(actions) {
	for (var j = 0; j < actions.length; j++) {
		ScenarioService.launchAction(actions[j].user, actions[j].action, actions[j].parametre);
	}
}

/**
 * Description
 * @method getValuestate
 * @param {} name
 * @return result
 */
function getValuestate(name) {

	/**
	 * Description
	 * @method addZero
	 * @param {} i
	 * @return i
	 */
	var addZero = function(i) {
		if (i < 10) {
			i = "0" + i;
		}
		return i;
	};
	var result;
	switch (name) {
		case 'hour':
			var d = new Date();
			result = addZero(d.getHours()) + ':' + addZero(d.getMinutes());
			break;
		default:
			result = null;
			sails.log.warn('ScenarioService : state : Could not find state ' + name);
			break;
	}
	return result;
}

/**
 * Description
 * @method compare
 * @param {} operator
 * @param {} a
 * @param {} b
 * @return result
 */
function compare(operator, a, b) {
	// boolean result
	var result;
	switch (operator) {
		case '==':
			result = (a == b);
			break;
		case '!=':
			result = (a != b);
			break;
		case '>=':
			result = (a >= b);
			break;
		case '<=':
			result = (a <= b);
			break;
		case '>':
			result = (a > b);
			break;
		case '<':
			result = (a < b);
			break;
		default:
			result = false;
			break;
	}
	return result;
}

module.exports = {

	/**
	 * Fire an event "code" with the value given
	 * The function will check if there is a scenario
	 * which start with this event
	 * @method launcher
	 * @param {} code
	 * @param value
	 * @param {} callback
	 * @return 
	 */
	launcher: function(code, value, callback) {

		// emit an event for modules
		gladys.emit(code, value);
		
		sails.log.info('ScenarioService : launcher : ' + code + ' : ' + value);
		LauncherType.findOne({
			code: code
		}, function(err, launcher) {
			if (err) return sails.log.warn('ScenarioService : launcher : ' + err);

			if (!launcher)
				return sails.log.warn('ScenarioService : launcherType ' + code + ': Launcher does not exist');

			Launcher
				.find()
				.where({
					launcher: launcher.id,
					active: true
				})
				.populate('actions')
				.populate('states')
				.exec(function foundlauncher(err, launchers) {
					if (launchers) {

						for (var i = 0; i < launchers.length; i++) {
							var test;
							// if launcher has a parametres (if not, launcher is true by default)
							if (launchers[i].parametre.length > 0) {
								test = compare(launchers[i].operator, value, launchers[i].parametre);
							} else
								test = true;

							if (test) { // if the launchers is valid, we have to verify the states

								// all state are valid first
								var allstateValid = true;
								var k = 0;
								while (allstateValid && k < launchers[i].states.length) { // for each state, check if the state is true here
									var stateTest;
									stateTest = compare(launchers[i].states.operator, getValuestate(launchers[i].states.name), launchers[i].states.parametre);
									// if state is not true, we can go out of the while()
									if (!stateTest)
										allstateValid = false;
									k++;
								}

								//if all states were true, we can launch actions
								if (allstateValid)
									launchActions(launchers[i].actions);
							}
						}

						if (callback)
							callback();

					}
				});

		});

	},

	/**
	 * Start an action
	 * @method launchAction
	 * @param {} userId
	 * @param {} actionId
	 * @param {} parameters
	 * @return 
	 */
	launchAction: function(userId, actionId, parameters) {
		ActionType.findOne({
			id: actionId
		}, function(err, actionType) {
			if (err) return sails.log.warn('ScenarioService : launchActions : ' + err);

			if (!actionType)
				return sails.log.warn('ScenarioService : launchActions : can\'t find action');

			sails.log.info("Launch action : " + actionType.serviceName + " " + actionType.functionName + " " + parameters);
			launchFunction(actionType.serviceName, actionType.functionName, formatParam(parameters));
		});
	},


};