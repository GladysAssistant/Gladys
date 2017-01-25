module.exports = isNight;

var SunCalc = require('suncalc');
var Promise = require('bluebird');

function isNight(options){
    
    // foreach house
    return gladys.house.getAll()
      .then(function(houses){
          
          // we look for the right house
          return Promise.map(houses, function(house){
             if(house.id === options.id) return sunState(house); 
          });
      });
}

// verify if it's night or day
function sunState(house){
   var times = SunCalc.getTimes(new Date(), house.latitude , house.longitude);
   var now = new Date();
   
   return now > times.sunset || now < times.sunrise;
}
