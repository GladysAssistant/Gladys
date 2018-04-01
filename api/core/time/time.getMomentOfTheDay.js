const moment = require('moment');
const Promise = require('bluebird');
var SunCalc = require('suncalc');

module.exports = function getTime(options){

    return gladys.house.getById({id: options.house})
		.then((house) => {
			
			var now = new Date();
			var midday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
			var times = SunCalc.getTimes(new Date(), house.latitude , house.longitude);
			
			if(now < times.sunrise) {
				return {state: 'night'};
			} 
			else if(now < midday) {
				return {state: 'morning'};
			}
			else if(now < times.sunset) {
				return {state: 'afternoon'};
			}
			else {
				return {state: 'evening'};
			}
		});
};