/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
/* To verify if the user is connecting to a master (if not, return forbidden)
if the machine is a master, go next()
*/

module.exports = function(req, res, next) {
	if(sails.config.machine.master)
		return next();
	else
		res.forbidden('This is not a master, just a slave executing orders.');
};