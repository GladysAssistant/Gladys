/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * LocationController
 *
 * @description :: Server-side logic for managing Location of Users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

	/**
	 * Create a new Location
	 * (Save the actual position of the user)
	 * @method create
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	create : function(req,res, next){
        
        var location;
        
        // request can be a get or post request
        if(req.query.latitude) {
            location = req.query;
        } else {
            location = req.body;
        }
        
        location.user = req.session.User.id;

        gladys.location.create(location)
          .then(function(location){
              return res.json(location);
          })
          .catch(next);
	}

};

