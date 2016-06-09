/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
/**
 * ActionTypeController
 *
 * @description :: Server-side logic for managing Actiontypes
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

	/**
	 * Get all ActionType
	 */
	index: function(req, res, next) {
		
		gladys.actionType.get()
		  .then(function(actionsTypes){
			  return res.json(actionsTypes);
		  })
		  .catch(next);	
	},
	
	
	/**
	 * Get all actionTypeParams of a specificActionType
	 */
	getParams: function(req, res, next){
		
		gladys.actionType.getParams({id: req.params.id})
		  .then(function(params){
			  return res.json(params);
		  })
		  .catch(next);
	}

};