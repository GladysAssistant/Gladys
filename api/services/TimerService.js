/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
//services/TimerService.js

var timeoutArray=[];
var nbTimeout = 0;

/**
 * Description
 * @method timeStringToSeconds
 * @param {} time
 * @return BinaryExpression
 */
function timeStringToSeconds (time) {
  var hoursMinutes = time.split(/[.:]/);
  var hours = parseInt(hoursMinutes[0], 10);
  var minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;

  return (hours*60 + minutes)*60;
}

module.exports = {

	/**
	 * Description
	 * @method start
	 * @param {} timer
	 * @param {} callback
	 * @return 
	 */
	start:function(timer,callback){
		var durationSeconds = timeStringToSeconds(timer.duration);
		var date = new Date(new Date().getTime() + durationSeconds*1000);
		timeoutArray[nbTimeout] = setTimeout(function(){ 
									callback(); 
									ScenarioService.launcher('timerEnd',timer.id);
													}, durationSeconds*1000);
		nbTimeout++;
		Timer.update(timer.id,{estimateFinish : date, status:true, idTimeout:nbTimeout-1}, function updatedTimer(err,Timer){
				if (err) return sails.log.warn('TimerService, start(), error while saving : ' + err);

		});	
	},

	/**
	 * Description
	 * @method stop
	 * @param {} timer
	 * @param {} callback
	 * @return 
	 */
	stop:function(timer,callback){
		clearTimeout(timeoutArray[timer.idTimeout]);
		Timer.update(timer.id,{estimateFinish : null, status:false, idTimeout:null}, function updatedTimer(err,Timer){
				if (err) return sails.log.warn('TimerService, stop(), error while saving : ' + err);

				if(callback)
					callback();

		});	
		
	}



};