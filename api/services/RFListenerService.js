/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */


var WaitingForConnection = false;
var timeout;
var durationSeconds = sails.config.serialport.waitingForConnectionTime;

/**
 * Description
 * @method getTimeLeft
 * @param {} timeout
 * @return CallExpression
 */
function getTimeLeft (timeout) {
	return Math.ceil((timeout._idleStart + timeout._idleTimeout - Date.now()) / 1000);
}

/**
 * Description
 * @method disableTimer
 * @return 
 */
function disableTimer () {
	try {
		clearTimeout(timeout);
	} catch (e) {
		sails.log.warn('RFListenerService : disableTimer : no timeout to disable');
	}
	WaitingForConnection = false;
}

module.exports = {

	/**
	 * Description
	 * @method addSensor
	 * @param {} code
	 * @return 
	 */
	addSensor: function(code) {
		var sensorObj = {
			code: code
		};

		SocketService.sendCustomMessageClient(WaitingForConnection, 'newMotionSensor', sensorObj);
		disableTimer();
	},

	/**
	 * Description
	 * @method switchToWaitingMode
	 * @param {} socketId
	 * @return 
	 */
	switchToWaitingMode: function(socketId) {
		WaitingForConnection = socketId;
		timeout = setTimeout(function() {
			WaitingForConnection = false;
		}, durationSeconds * 1000);
	},

	/**
	 * Description
	 * @method disableWaitingMode
	 * @return 
	 */
	disableWaitingMode: function() {
		disableTimer();
	},

	/**
	 * Description
	 * @method isWaiting
	 * @return WaitingForConnection
	 */
	isWaiting: function() {
		return WaitingForConnection;
	}

};