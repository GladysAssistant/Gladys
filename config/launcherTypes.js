/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  

module.exports.launcherTypes = [
	{code: 'motion',name:'Motion', description:'Fire when a movement is detected', 'optionspath': '/room/index'},
	{code: 'alarmRing',name:'Alarm Ring', description:'Fire when an alarm ring', 'optionspath': '/alarm/index'},
	{code: '433ReceivedSerialPort',name:'433 Mhz signal received', description:'Fire when a signal is received on serial port', 'optionspath': ''},
	{code: 'leftHome',name:'Leaving Home', description:'Fire when someone left the house', 'optionspath': '/user/index'},
	{code: 'backAtHome',name:'Back Home', description:'Fire when someone is back home', 'optionspath': '/user/index'},
	{code: 'gointToSleep',name:'Going to sleep', description:'Fire when someone is going to sleep', 'optionspath': '/user/index'},
	{code: 'wakeUp',name:'Wake Up', description:'Fire when someone is going waking up', 'optionspath': '/user/index'},
  {code: 'every30Minutes',name:'Every 30 minutes', description:'Fire every 30 minutes ! Can be a good idea to refresh frequently something.', 'optionspath': ''}
];