/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * AccueilController
 *
 * @description :: Server-side logic for managing Accueils
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {


	/**
	 * Description
	 * @method index
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return
	 */
	index: function(req, res, next) {
		res.view('welcome/index', {
			layout: null
		});
	}
};