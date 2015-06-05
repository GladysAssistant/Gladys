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
	 * Description
	 * @method todayTemp
	 * @param {} latitude
	 * @param {} longitude
	 * @param {} lang
	 * @param {} callback
	 * @return 
	 */
	todayTemp : function(latitude,longitude,lang,callback){
		var url = sails.config.openweather.url + '&units=' + sails.config.openweather.units + '&lang=' + lang + '&lat=' + latitude + '&lon=' + longitude;
		
		request(url, function(err, response, body){
				try{
			  		var result = JSON.parse(body);
			  		var temp = result.list[0].temp.day;
			  		
			  		if(callback)
			  			callback(temp);
			  	}catch(e){
			  		sails.log.warn('Fail to parse JSON from OpenWeather ' + e);
			  		console.log(url + '        ' +body);
			  	}
		});
	}
};