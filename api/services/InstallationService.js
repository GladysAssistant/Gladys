/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */

var async = require('async');

/**
 * Description
 * @method importAndInjectEventTypes
 * @param {} callback
 * @return 
 */
function importAndInjectEventTypes(callback){
	var lifeEventsObj = sails.config.lifeevent;
	var lifeEventsArray = [];
	for(var index in lifeEventsObj) { 
	   if (lifeEventsObj.hasOwnProperty(index)) {
	       lifeEventsArray.push(lifeEventsObj[index]);
	   }
	}
	EventType.create(lifeEventsArray)
		.exec(callback);
}

/**
 * Description
 * @method importAndInjectActionTypes
 * @param {} callback
 * @return 
 */
function importAndInjectActionTypes(callback){
	ActionType.create(sails.config.actionTypes)
		.exec(callback);
}

/**
 * Description
 * @method importAndInjectLauncherTypes
 * @param {} callback
 * @return 
 */
function importAndInjectLauncherTypes(callback){
	LauncherType.create(sails.config.launcherTypes)
		.exec(callback);
}


module.exports = {
	
	/**
	 * Inject all into the database
	 * @method injectAll
	 * @param {} callback
	 * @return 
	 */
	injectAll: function(callback){
		async.parallel([
			function(callback){
				InstallationService.injectLifeEventTypes(callback);
			},
		    function(callback){
				InstallationService.injectActionTypes(callback);
			},
			function(callback){
				InstallationService.injectLauncherTypes(callback);
			}
		], callback);
	},
	
	/**
	 * Description
	 * @method injectLifeEventTypes
	 * @param {} callback
	 * @return 
	 */
	injectLifeEventTypes: function(callback){
		EventType.find()
			.exec(function(err, eventtypes){
				if(err) return callback(err);
				
				if(eventtypes.length === 0){
					importAndInjectEventTypes(callback);
				}else{
					callback(null);
				}
			});
	},
	
	/**
	 * Description
	 * @method injectActionTypes
	 * @param {} callback
	 * @return 
	 */
	injectActionTypes: function(callback){
		ActionType.find()
			.exec(function(err, actiontypes){
				if(err) return callback(err);
				
				if(actiontypes.length === 0){
					importAndInjectActionTypes(callback);
				}else{
					callback(null);
				}
			});
	},
	
	/**
	 * Description
	 * @method injectLauncherTypes
	 * @param {} callback
	 * @return 
	 */
	injectLauncherTypes: function(callback){
		LauncherType.find()
			.exec(function(err, launchertypes){
				if(err) return callback(err);
				
				if(launchertypes.length === 0){
					importAndInjectLauncherTypes(callback);
				}else{
					callback(null);
				}
			});
	}		
	
};