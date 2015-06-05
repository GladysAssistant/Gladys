/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
var WifiBoxModule = require('./Milight/wifibox.js');
var cmd = require('./Milight/commands.js');
var lastLampId = null;

/**
 * Description
 * @method connectWifiBox
 * @param {} lampId
 * @param {} callback
 * @return 
 */
function connectWifiBox (lampId,callback){
	MilightLamp.findOne({id : lampId})
			   .populate('milightwifi')
			   .exec(function LampFound(err, Lamp) {
				   		if(err){
				   			sails.log.warn(err);
				   			return callback(false);
				   		}

				   		if(!Lamp){
				   			sails.log.warn('No Lamp');
				   			return callback(false);
				   		}

				   		if(!Lamp.milightwifi){
				   			sails.log.warn('No Milightwifi');
				   			return callback(false);
				   		}
				   		
				   		var box = new WifiBoxModule(Lamp.milightwifi.ip, Lamp.milightwifi.port);
						if(callback)
							callback(true,box,Lamp.zone);
		});
}


module.exports = {

	/**
	 * Description
	 * @method state
	 * @param {} lampId
	 * @param {} callback
	 * @return 
	 */
	state: function(lampId,callback){
		var req = "SELECT name FROM eventtype ";
		req += " JOIN lifeevent ON (eventtype.id = lifeevent.eventtype) ";
		req += " WHERE param = ? ";
		req += " AND ( name = ? OR name = ? ) ";
		req += " ORDER BY datetime DESC ";
		req += " LIMIT 0,1 ";

		LifeEvent.query(req, [lampId, sails.config.lifeevent.milightOn.name, sails.config.lifeevent.milightOff.name], function (err, lifeevents){
			if(err) return callback(err);

			if(lifeevents && lifeevents[0].name == sails.config.lifeevent.milightOn.name){
				callback(null, true);
			}else{
				callback(null, false);
			}
		});
	},

	/**
	 * Description
	 * @method turnOn
	 * @param {} userId
	 * @param {} lampId
	 * @param {} callback
	 * @return 
	 */
	turnOn: function(userId,lampId,callback){
		connectWifiBox(lampId, function (success, box, zone){
			// if we can't find the wifi module associated with the lamp
			if(!success) return callback("Can't find associated to wifiBox");

			box.command(cmd.rgbw.on(zone));
			lastLampId = lampId;
			if(callback)
				callback(false);

			LifeEventService.saveEvent(sails.config.lifeevent.milightOn.name, userId, lampId, function(err){
				if(err) sails.log.warn(err);
			});
		});
	},

	/**
	 * Description
	 * @method turnOff
	 * @param {} userId
	 * @param {} lampId
	 * @param {} callback
	 * @return 
	 */
	turnOff: function(userId,lampId,callback){
		connectWifiBox(lampId, function (success, box, zone){
			// if we can't find the wifi module associated with the lamp
			if(!success) return callback("Can't find associated to wifiBox");

			box.command(cmd.rgbw.off(zone));
			lastLampId = lampId;
			if(callback)
				callback(false);
			
			LifeEventService.saveEvent(sails.config.lifeevent.milightOff.name, userId, lampId, function(err){
				if(err) sails.log.warn(err);
			});
		});
	},

	
	/**
	 * Hue range 0-255 [targets last ON() activated bulb(s)] 
	 * @method hue
	 * @param {} userId
	 * @param {} color
	 * @param {} callback
	 * @return 
	 */
	hue: function(userId,color,callback){
		if(lastLampId == null) return callback(false);
		
		connectWifiBox(lastLampId, function (success, box, zone){
			// if we can't find the wifi module associated with the lamp
			if(!success) return callback(false);

			box.command(cmd.rgbw.hue(color));

			if(callback)
				callback(true);
		});
	},

	/**
	 * Brightness range 1-100 [targets last ON() activated bulb(s)]
	 * @method brightness
	 * @param {} userId
	 * @param {} brightness
	 * @param {} callback
	 * @return 
	 */
	brightness: function (userId,brightness, callback){
		if(lastLampId == null) return callback(false);
		
		connectWifiBox(lastLampId, function (success, box, zone){
			// if we can't find the wifi module associated with the lamp
			if(!success) return callback(false);

			box.command(cmd.rgbw.brightness(brightness));

			if(callback)
				callback(true);
		});
	},

	/**
	 * Description
	 * @method effectModeNext
	 * @param {} userId
	 * @param {} callback
	 * @return 
	 */
	effectModeNext: function(userId,callback){
		if(lastLampId == null) return callback(false);

		connectWifiBox(lastLampId, function (success, box, zone){
			// if we can't find the wifi module associated with the lamp
			if(!success) return callback(false);

			box.command(cmd.rgbw.effectModeNext());

			if(callback)
				callback(true);
		});
	},

	/**
	 * Description
	 * @method whiteMode
	 * @param {} userId
	 * @param {} callback
	 * @return 
	 */
	whiteMode: function(userId,callback){
		if(lastLampId == null) return callback(false);

		connectWifiBox(lastLampId, function (success, box, zone){
			// if we can't find the wifi module associated with the lamp
			if(!success) return callback(false);

			box.command(cmd.rgbw.whiteMode());

			if(callback)
				callback(true);
		});
	}

};