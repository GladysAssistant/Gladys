module.exports = isNight;

var SunCalc = require('suncalc');
var Promise = require('bluebird');

function isNight(data){
    
    // foreach house
    return gladys.house.getAll()
      .then(function(houses){
          
          // we look for the right house
          return Promise.map(houses, function(house){
             if(house.id === data.id) return sunState(house); 
          });
      });
}

// verify if it's night or day
function sunState(house){
   var times = SunCalc.getTimes(new Date(), house.latitude , house.longitude);
   var now = new Date();
   
   return Promise.resolve(now > times.sunset || now < times.sunrise);
}
