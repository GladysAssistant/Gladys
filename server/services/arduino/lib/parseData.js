var createStateRadio = require('./createStateRadio.js');

module.exports = function(data){

	sails.log.info('Received data from Arduino ' + data);
	
	try{
		var json = JSON.parse(data);

		// if the JSON is a 433Mhz value
		if(json.action && json.action == 'received' && json.hasOwnProperty('value')) {

			// we create the state and the device if he does not exist
			createStateRadio(json);
		} else if(json.hasOwnProperty('devicetype') && json.hasOwnProperty('value')) {

			// if the JSON is a raw deviceState, we create it
			gladys.deviceState.create(json);
		}

	} catch(e){
		sails.log.warn('Gladys serial : cannot parse JSON received from arduino : ' + e);
	}
};
