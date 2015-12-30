/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
/**
 * StartService 
 * @description :: onStart function called when Gladys server has just started and when all the functions are ready
 * @help :: See http://links.sailsjs.org/docs/controllers
 */

var fs = require('fs');

module.exports = {

	/**
	 * Description
	 * @method onStart
	 * @return 
	 */
	onStart: function(){
		// start listening to serial port (USB port)
		// to detect message from Arduino
		// if disabled, it will not start automaticaly
		//SerialPortService.startListening();
		//AlarmService.scheduleAllAlarms();
		SocketService.destroyAllSavedSockets();
		// import all music
		MusicService.importFolder(function(err){
			if(err) return sails.log.warn(err);
		});
		InstallationService.injectAll(function(err){
			if(err) return sails.log.warn(err);
		});
		//SchedulerService.startEvery30MinutesScheduler();
		
		// get version of Gladys from package.json
		try {
			var json = JSON.parse(fs.readFileSync('package.json'));
			gladys.version = json.version;
			sails.log.info('Gladys version : ' + gladys.version);
		} catch(e) {
			sails.log.warn('Cannot parse package.json');
		}
		
		// old way
		sails.config.Event.emit('sailsReady');
		// new way
		gladys.emit('sailsReady');
	}


};