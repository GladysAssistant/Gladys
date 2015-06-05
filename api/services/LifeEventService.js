/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */

module.exports = {
	/**
	 * Description
	 * @method saveEvent
	 * @param {} eventType
	 * @param {} userId
	 * @param {} param
	 * @param {} callback
	 * @return 
	 */
	saveEvent: function(eventType,userId, param,callback){
		EventType.findOne({name:eventType}).exec(function(err, eventtype) {
			if(err) return callback(err); 

			if(eventtype){
		  		eventtype.lifeevents.add({user:userId, param:param});

		 	 	eventtype.save(function(err) {
		 	 		if(err) return callback(err);
					  
					// fire the event
					ScenarioService.launcher(eventType, param, function(){});
					
		 	 		callback(null, true);
		 	 	});
		 	}else{
		 		callback('eventType ' + eventtype + ' not found');
		 	}
		});
	}
};
