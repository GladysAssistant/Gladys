/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * UserHouseRelationTypeController
 *
 * @description :: Server-side logic for managing UserHouserelationtypes
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

	/**
	 * Get all the types of relation between a house and a user
	 * (Admin, inhabitant, guest, ...)
	 * @method index
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	index: function(req,res,next){
		var tab = [];
		for (var prop in sails.config.userhouserelationtype) {
	    if( sails.config.userhouserelationtype.hasOwnProperty( prop ) ) {
	      	tab.push({ name : req.__(prop), id: sails.config.userhouserelationtype[prop] });
	      }
	    } 
		res.json(tab);
	}
	
};

