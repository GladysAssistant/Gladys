/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
module.exports = function(req, res, next) {
	
	var IPstart = sails.config.machine.IPStartWith;
	// If user is a human connecting to his dashboard
	if(req.session.authenticated && req.session.trueHuman) {
		// if he is connecting from the same network (so he is at home)
		if(req.ip === '127.0.0.1' || req.ip.substr(0,IPstart.length) == IPstart){
			
			async.waterfall([
			    function(callback) {
			    	// First, we find the house of the computer executing the code
			    	MachineService.getMyHouse(function(err, houseId){
			        	callback(err, houseId);
			        });
			    },
			    function(houseId, callback) {
			    	// Then, we find in which house is the user
			      	HouseService.whichHomeIsUser(req.session.User.id, function(err, houseUser){
			      		callback(err, houseId, houseUser);
			      	});
			    },
			    function(houseId, houseUser, callback) {
			    	// If the user is not saved in the same house that he is
			       	if(houseUser != houseId){
			       		// we say the user is back home! 
						HouseService.atHome(req.session.User.id, houseId, function(err){
							callback(err, true);
						});
					}else
						callback(null, false);
			    }
			], function (err, result) {
				if(err) sails.log.warn('sameNetworkPolicies : ' + err);
			});
		}
	}
	next();
};