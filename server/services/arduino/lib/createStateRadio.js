
module.exports = function(json){
	
	var param = {
		device: {
			name: 'Sensor',
			protocol: '433Mhz',
			service: 'radioFrequency',
			identifier: json.value
		},
		types: [
			{
				type: 'motion',
				identifier: 'motion',
				sensor: true,
				min: 1,
				max: 1
			}
		]
	};

	var state = {
	  	value: 1
	};

	// try to create the state
	return gladys.deviceState.createByIdentifier(param.device.identifier, param.device.service, param.types[0].type, state)
		.catch(() => {


			// if it fails to create the state, the device does not exist
			return gladys.device.create(param)
				.then(function(result) {

					// we create the state
					return gladys.deviceState.createByIdentifier(param.device.identifier, param.device.service, param.types[0].type, state);
				});
		});
};