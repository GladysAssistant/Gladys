/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  

module.exports.lifeevent = {
	gladysInstallation : { name: 'gladysInstallation', BeautifulName:'Gladys installed', faIcon : 'fa fa-desktop', iconColor: 'bg-black'},
	gladysUpdate : { name: 'gladysUpdate', BeautifulName:'Gladys updated',  faIcon : 'fa fa-wrench', iconColor: 'bg-black'},
	wakeUp : { name: 'wakeUp', BeautifulName:'WakeUp',  faIcon : 'fa fa-bed', iconColor: 'bg-yellow'},
	goingToSleep: { name: 'goingToSleep', BeautifulName:'Going To Sleep',  faIcon : 'fa fa-bed', iconColor: 'bg-blue'} ,
	milightOn: { name: 'milightOn', BeautifulName:'Milight Lamp Turned On', faIcon : 'fa fa-power-off', iconColor: 'bg-yellow'},
	milightOff: { name: 'milightOff', BeautifulName:'Milight Lamp turned Off ',  faIcon : 'fa fa-power-off', iconColor: 'bg-black'},
	milightBrightnessChange: { name: 'milightBrightnessChange',BeautifulName:'Milight Lamp Brightness changed',  faIcon : 'fa fa-sliders', iconColor: 'bg-light-blue'},
	milightColorChange: { name: 'milightColorChange', BeautifulName:'Milight Lamp color changed', faIcon : 'fa fa-sliders', iconColor: 'bg-purple'},
	playMusic : { name: 'playMusic', BeautifulName:'Playing Music', faIcon : 'fa fa-music', iconColor:'bg-orange' },
	sendMail : {name: 'sendMail', BeautifulName:'Mail sent', faIcon: 'fa fa-paper-plane', iconColor:'bg-green' },
	motion: {name: 'motion',BeautifulName:'Motion detected',  faIcon: 'fa fa-rss', iconColor:'bg-green' },
	motionRoom: {name: 'motionRoom', BeautifulName:'Motion detected in room', faIcon: 'fa fa-rss', iconColor:'bg-green' },
	received433UnknownValue: {name: 'received433UnknownValue', BeautifulName:'Unknow 433Mhz signal received', faIcon: 'fa fa-rss', iconColor:'bg-green', display:'none'},
	backAtHome : {name: 'backAtHome', BeautifulName:'Back at home', faIcon: 'fa fa-home', iconColor:'bg-light-blue'},
	leftHome : {name: 'leftHome', BeautifulName:'Left Home', faIcon: 'fa fa-home', iconColor:'bg-light-blue'},	
};