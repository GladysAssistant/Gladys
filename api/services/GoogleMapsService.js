/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
/* 
*/
var gm = require('googlemaps');

module.exports = {
    
    /**
     * Calculate the duration to go from address "Start" to address "End", 
     * and callback with a time in seconds
     * @method itineraryTime
     * @param {} start
     * @param {} end
     * @param {} callback
     * @return 
     */
    itineraryTime: function (start, end, callback){
        gm.directions(start, end , 
        function(err, data){
            if(err) return callback(err);
            
            // calculate the duration in seconds
            var duration = data.routes[0].legs[0].duration.value;
            callback(null, duration);
        });
        
    }
};