module.exports = init;

var SunCalc = require('suncalc');
var Promise = require('bluebird');

function init(){
    
  // foreach house
  return gladys.house.getAll()
    .then(function(houses){
          
      // we schedule the sunset and the sunrise for this house
      return Promise.map(houses, function(house){
        return scheduleOne(house); 
      });
    });
}

// schedule sunset and sunrise for this house
function scheduleOne(house){
   
  // calculate at midday to fix bug in SunCalc library with timezone
  // see : https://github.com/mourner/suncalc/issues/11
  var date = new Date();
  var midday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0, 0);
  var times = SunCalc.getTimes(midday, house.latitude, house.longitude);
   
  var scheduledSunrise = {
    event:{
      code: 'sunrise',
      house: house.id
    },
    rule: times.sunrise
  };
   
  var scheduledSunset = {
    event:{
      code: 'sunset',
      house: house.id
    },
    rule: times.sunset
  };
   
   
  // scheduling sunrise time
  return gladys.scheduler.create(scheduledSunrise)
    .then(function(){
      sails.log.info(`Scheduled sunrise to ${times.sunrise.toLocaleString()}.`);
         
      // scheduling sunset time
      return gladys.scheduler.create(scheduledSunset);    
    })
    .then(function(){
         
      sails.log.info(`Scheduled sunset to ${times.sunset.toLocaleString()}.`);
    });
}