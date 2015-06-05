/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * MilightLampController
 *
 * @description :: Server-side logic for managing Milightlamps
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {


	/**
	 * Get all the milightLamp a user is allowed to control
	 * @method index
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	index: function(req,res,next){
		var request = "SELECT milightlamp.id, milightlamp.status, milightlamp.color, milightlamp.brightness, CONCAT(milightlamp.name, ' ', room.name) AS name ";
		request+= " FROM milightlamp ";
		request+= " JOIN room ON(milightlamp.room = room.id) ";
		request+= " WHERE ( room.house IN ( SELECT house FROM userhouserelation WHERE userhouserelationtype = 1 AND user = ? )) ";
		request+= " OR ( room.id IN ( SELECT room_sleepers FROM room_sleepers__user_roomwheresleep WHERE user_roomwheresleep = ? ) AND room.permission <= ?) ";
		request+= " OR ( room.house IN ( SELECT house FROM userhouserelation WHERE userhouserelationtype = ? AND user = ? ) AND room.permission = ? )  ";
		request+= " OR room.permission = ? ";

		MilightLamp.query(request, [req.session.User.id,req.session.User.id, sails.config.permissionroom.sleeper, sails.config.userhouserelationtype.Habitant, req.session.User.id, sails.config.permissionroom.habitant, sails.config.permissionroom.everybody ], function(err, milightlamps){
			if(err) return res.json(err);
			
			res.json(milightlamps);
			if(milightlamps){
				for(var i=0;i<milightlamps.length;i++){
					SocketService.joinRoom(req.session.User.id, 'MilightLamp'+milightlamps[i].id, function(err){
						if(err) sails.log.error(err);
					});
					
				}
			}
		});

	},

	/**
	 * TurnOn a Milight Lamp
	 * @method turnOn
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	turnOn:function(req,res,next){
		if(!req.param('id'))
			return res.json('Missing parametres');

		MilightService.turnOn(req.session.User.id, req.param('id'), function(err){
			if(err) return res.json({error : err});

			res.json('ok');
		});
	},

	/**
	 * TurnOff a Milight Lamp
	 * @method turnOff
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	turnOff:function(req,res,next){
		if(!req.param('id'))
			return res.json('Missing parametres');

		MilightService.turnOff(req.session.User.id, req.param('id'), function(err){
			if(err) return res.json({error : err});

			res.json('ok');
		});
	},


	/**
	 * Change the Hue of the last controlled Milight Lamp
	 * @method hue
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	hue:function(req,res,next){
		if(!req.param('value'))
			return res.json('Missing parametres');

		if(req.param('value') < 0 || req.param('value') > 255)
			return res.json('Wrong value');

		MilightService.hue(req.session.User.id, req.param('value'), function(result){
			res.json(result);
		});
	},


	/**
	 * Change the brightness of the last controlled MilightLamp
	 * @method brightness
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	brightness:function(req,res,next){
		if(!req.param('value'))
			return res.json('Missing parametres');

		if(req.param('value') < 1 || req.param('value') > 100)
			return res.json('Wrong value');

		MilightService.brightness(req.session.User.id, req.param('value'),function(result){
			res.json(result);
		});
	},

	/**
	 * Switch to the next effect mode of the last controlled MilightLamp
	 * @method effectModeNext
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	effectModeNext:function(req,res,next){
		MilightService.effectModeNext(req.session.User.id, function(result){
			res.json(result);
		});
	},

	/**
	 * Switch to White Mode the last controlled MilightLamp
	 * @method whiteMode
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	whiteMode:function(req,res,next){
		MilightService.whiteMode(req.session.User.id, function(result){
			res.json(result);
		});
	}

	
	
};

