module.exports = getState;

var SunCalc = require('suncalc');
var Promise = require('bluebird');

function getState(options){
    // foreach house
    return gladys.house.getById({id: options.house})
      .then(function(house){
          var now = new Date();
          var times = SunCalc.getTimes(new Date(), house.latitude , house.longitude);

          if(now > times.sunset || now < times.sunrise) return {state: 'night'};
          return {state: 'day'};
      });
}
