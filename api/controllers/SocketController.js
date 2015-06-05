/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * SocketController
 *
 * @description :: Server-side logic for managing sockets
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

	
	/**
	 * Subscribe to all the sockets room the user is concerned by
	 * @method subscribeToMyRooms
	 * @param {} req
	 * @param {} res
	 * @return 
	 */
	subscribeToMyRooms: function(req, res) {
		// if request is not a socket, bad request
		if (!req.isSocket) return res.badRequest();

		// Get socket Id
		var socketId = sails.sockets.id(req.socket);

		var socketObj = {
			socketId:socketId,
			user: req.session.User.id
		};

		// creating socket in database
		Socket.create(socketObj, function socketCreated(err, Socket){
			if(err) return sails.log.warn(err);
		});

		UserHouseRelation.find({ user: req.session.User.id,userhouserelationtype: sails.config.userhouserelationtype.Admin })
	      .populate('house')
	      .exec(function foundHouses(err,userHouseRelations) {
	         	if (err)  return sails.log.warn(err);
	        	if(userHouseRelations)
				{
					for(var i =0; i<userHouseRelations.length;i++)
					{
						sails.sockets.join(req.socket, 'House' + userHouseRelations[i].house.id );
						sails.log.info(req.session.User.firstname +  " successfully connected to room : " + 'House' + userHouseRelations[i].house.id  );
					}
				}

				res.json('ok');
	      });
		 
	}


	
};

