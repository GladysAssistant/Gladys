/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
/* To get the path for scripts 
*/

module.exports.scripts = {
	folder:'api/scripts',
	servicesFolder: './api/services',
	modelFolder: './api/models',
	vmOptions:{ 
	},
	defaultSandbox: {
		console:console,
		setTimeout:setTimeout,
		setInterval: setInterval,
		clearTimeout:clearTimeout,
		clearInterval:clearInterval
	}
};