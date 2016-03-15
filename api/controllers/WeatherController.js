/**
 * WeatherController
 *
 * @description :: Server-side logic for managing weathers
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    
    /**
     * Retrieve the weather, 
     * with given latitude and longitude in get parameters
     */
    index: function(req, res, next){
      gladys.weather.get(req.query)
        .then(function(weather){
            return res.json(weather);
        })
        .catch(next);
    },
	
};

