/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
 
var schedule = require('node-schedule');

// array of all the scheduleJob
var tabScheduler = [];

/**
 * Schedule a new event to ring
 * @rule : the rule of the Scheduler
 * @eventName : The name of the launcher to fire
 * @value : The value to fire
 * @method scheduleEvent
 * @param {} rule
 * @param {} eventName
 * @param {} value
 * @return MemberExpression
 */
function scheduleEvent(rule, eventName, value){
	tabScheduler[tabScheduler.length] = schedule.scheduleJob(rule, function(){
			ScenarioService.launcher(eventName, value);
	});
	return tabScheduler[tabScheduler.length];
}

module.exports = {
	
	/**
	 * Description
	 * @method scheduleEvent
	 * @param {} rule
	 * @param {} eventName
	 * @param {} value
	 * @return CallExpression
	 */
	scheduleEvent:function(rule,eventName, value){
		return scheduleEvent(rule,eventName,value);
	},
  
  /**
   * Description
   * @method startEvery30MinutesScheduler
   * @return 
   */
  startEvery30MinutesScheduler: function(){
    setInterval(function(){
      ScenarioService.launcher('every30Minutes', null);
    },30*60*1000); 
  },

};