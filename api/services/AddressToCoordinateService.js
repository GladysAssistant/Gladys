/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
var request = require("request");

module.exports = {

	/**
	 * Convert an address in plain text to latitude and longitude
	 * @method geocode
	 * @param {} address
	 * @param {} callback
	 * @return 
	 */
	geocode: function(address,callback){    
		// requesting google to get geocode from address
		request(sails.config.googlegeocoder.url + encodeURIComponent(address), function(err, response, body) {
				if(err) return callback('Fail to get geocode from address : ' + err);
			  	
			  	try{
			  		var result = JSON.parse(body);

			  		var latitude = result.results[0].geometry.location.lat;
			  		var longitude = result.results[0].geometry.location.lng;

			  		if(callback){
			  			callback(null, latitude,longitude);
			  		}

			  	}catch(e){
			  		sails.log.warn('Fail to parse JSON from Google Geocode ' + e);
			  		if(callback)
			  			callback(e);
			  	}
		});
	},

	/**
	 * Convert a latitude and a longitude to an address in plain text
	 * @method reversegeocode
	 * @param {} latitude
	 * @param {} longitude
	 * @param {} callback
	 * @return 
	 */
	reversegeocode: function(latitude, longitude,callback){
		// requesting google to get geocode from address
		request(sails.config.googlegeocoder.reverseGeocode + encodeURIComponent(latitude + ',' + longitude), function(err, response, body) {
				if(err) return sails.log.warn('Fail to get address from latitude longitude : ' + err);
			  	
			  	try{
			  		var result = JSON.parse(body);

			  		var address = result.results[0].formatted_address;

			  		if(callback)
			  		{
			  			callback(false, address);
			  		}

			  	}catch(e){
			  		sails.log.warn('Fail to parse JSON from Google Geocode (reverse) ' + e);
			  		if(callback)
			  			callback(e);
			  	}
		});
	}

};