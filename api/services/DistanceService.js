/**
 * Gladys Project
 * http://gladysproject.com
 * Software under licence Creative Commons 3.0 France 
 * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
 * You may not use this software for commercial purposes.
 * @author :: Pierre-Gilles Leymarie
 */
 
/**
 * Convert degrees to radian
 * @method deg2rad
 * @param {} deg
 * @return BinaryExpression
 */
function deg2rad (deg) {
		  return deg * (Math.PI/180)
}

module.exports = {
	
	/**
	 * calculate distance between two points, by lat and long
	 * @method getDistanceFromLatLon
	 * @param {} lat1
	 * @param {} lon1
	 * @param {} lat2
	 * @param {} lon2
	 * @return d
	 */
	getDistanceFromLatLon: function(lat1,lon1,lat2,lon2) {
		  var R = 6371; // Radius of the earth in km
		  var dLat = deg2rad(lat2-lat1);  // deg2rad below
		  var dLon = deg2rad(lon2-lon1); 
		  var a = 
		    Math.sin(dLat/2) * Math.sin(dLat/2) +
		    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
		    Math.sin(dLon/2) * Math.sin(dLon/2)
		    ; 
		  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
		  var d = R * c; // Distance in km
		  d *=1000; // distance in meters
		  return d;
	},
};