const moment = require('moment');
const Promise = require('bluebird');
var SunCalc = require('suncalc');

module.exports = function getTime(options){
    // foreach house
    return gladys.house.getById({id: options.house})
	.then(function(house){
            var now = new Date();
            var midi = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
            var times = SunCalc.getTimes(new Date(), house.latitude , house.longitude);
         
	    if (now < times.sunrise)
 		return {state: 'night'};
     	    if (now < midi)
		return {state: 'morning'};
	    if (now < times.sunset)
		return {state: 'afternoon'};
	    return {state: 'evening'};
         });
};