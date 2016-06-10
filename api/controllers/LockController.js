/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * LockController
 *
 * @description :: Server-side logic for managing locks
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

	/**
	 * Description
	 * @method index
	 * @param {} req
	 * @param {} res
	 * @return 
	 */
	index : function(req,res){
		req.session.authenticated = false;
		res.view('lock/index', {layout: null, User: req.session.User});
	}
	
};

