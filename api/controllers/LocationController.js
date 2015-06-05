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
		var locationObj = {
	      latitude: req.param('latitude'),
	      longitude: req.param('longitude'),
	      altitude: req.param('altitude'),
	      accuracy: req.param('accuracy'),
	      user: req.session.User.id,
	      datetime: new Date()
	    };

	  		Location.create(locationObj, function LocationCreated(err,Location){
	  			if(err) res.json(err);
	  			
	  			res.json(Location);
	  		});

	},

	getAllLastLocation:function(req,res,next){
		UserService.getUsersOneCanControl(req.session.User.id, function(err, users){
          if(err) return res.json(err);

          users.unshift(req.session.User);
          var locations = [];
          async.each(users, function(user, callback) {
          		LocationService.lastPreciseLocation(user.id, sails.config.googlegeocoder.localisationValidityTime, function(err, location){
          			if(!err){
          				location.firstname = user.firstname;
          				location.lastname = user.lastname;
          				locations.push(location);
          			}
          			callback();
          		});
			}, function(err){
			   	if(err){
			   		return res.json(err);
			   	}else{
			   		res.json(locations);
			   	}
			});
      });
	},

};

