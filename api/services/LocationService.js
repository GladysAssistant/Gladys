/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
// /services/LocationService.js

/**
 * Callback the most accurate location of an array of locations
 * @method getMostAccurateLocation
 * @param {} locations
 * @return indMin
 */
function getMostAccurateLocation (locations){
	// we get the most accurate localization
	var indMin = 0;
	var minAccuracy = locations[0].accuracy;
				    
	for(var i=0; i<locations.length;i++){
		if(locations[i].accuracy < minAccuracy){
			minAccuracy = locations[i].accuracy;
			indMin = i;
		}
	}
	return indMin;
}


 /**
  * Take an array of locations, and returns the optimal location 
  * (not too old, but precize enough)
  * @method getOptimizedLocation
  * @param {} locations
  * @return idMinByRange
  */
 function getOptimizedLocation (locations){
	
	var idMinByRange = 0;
	var minRange = 10000000;

	for(var i=0; i<locations.length;i++){
		var actualDate = new Date();
		var timeBetween = (actualDate.getTime() - locations[i].datetime.getTime())/1000/60;
		locations[i].range = timeBetween*sails.config.googlegeocoder.timeRatio + (locations[i].accuracy/33)*sails.config.googlegeocoder.accuracyRatio;
					 		
		if(locations[i].range < minRange){
			minRange = locations[i].range;
			idMinByRange = i;
		}

	}

	return idMinByRange;
}



module.exports = {

	/**
	 * Description
	 * @method lastPreciseLocation
	 * @param {} userId
	 * @param {} localisationValidityTime
	 * @param {} callback
	 * @return 
	 */
	lastPreciseLocation : function(userId, localisationValidityTime, callback){
		// we want to get all the locations in the last X minutes (X = localisationValidityTime)
		var request = "SELECT * FROM Location ";
		request += " WHERE user = ? AND datetime >= DATE_SUB(NOW(), INTERVAL ? MINUTE) ";
		request += " ORDER BY datetime DESC LIMIT 5";
		
		Location.query(request, [userId, localisationValidityTime ], function(err,locations){
					if(err) return callback('Err while looking for location');

					if(locations.length > 0){
						
						var idMinByRange = getOptimizedLocation(locations);
						//var indMin = getMostAccurateLocation(locations); 

						callback(null, locations[idMinByRange]);
					}else{
					    callback('No location found');
					}
		});
	},


	/**
	 * Description
	 * @method isUserInArea
	 * @param {} userId
	 * @param {} latitude
	 * @param {} longitude
	 * @param {} range
	 * @param {} callback
	 * @return 
	 */
	isUserInArea: function(userId, latitude, longitude, range, callback){
		LocationService.lastPreciseLocation(userId, sails.config.googlegeocoder.localisationValidityTime, function(err, location){
			if(err) return callback(err);

			var distance = DistanceService.getDistanceFromLatLon(latitude, longitude, location.latitude, location.longitude);
			// if (distance <= range + accuracy) , user in area so callback with true
			callback(null, (distance <= (range+location.accuracy) ) );
		});
	},

};