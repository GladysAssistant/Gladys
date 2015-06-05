/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
// config/serialport.js
/* To receive data from Arduino via USB
serial port name : the name of the USB serial port you have connected your Arduino to
timeBeforeNewReceive : time in ms before receive same value 
*/

module.exports.serialport = {
	  //name : '/dev/tty.usbmodem1411',
	  name : '/dev/tty.usbserial-A403MTP3',
	  timeBeforeNewReceive: 1000,
	  active : false,
	  waitingForConnectionTime : 30
};