/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */


/**
 * Description
 * @method getUserSocketsId
 * @param {} userId
 * @param {} callback
 * @return 
 */
function getUserSocketsId (userId,callback){
		Socket.find({user : userId}, function(err,sockets){
			if(err) return callback('SocketService : getUserSocketId : ' + err);

			callback(null, sockets);
		});
}

module.exports = {

	/**
	 * Description
	 * @method sendChromeOrderRoom
	 * @param {} roomName
	 * @param {} data
	 * @param {} callback
	 * @return 
	 */
	sendChromeOrderRoom: function(roomName, data, callback){
		sails.sockets.broadcast(roomName, 'chromeOrder', data);
		if(callback)
			callback(null);
	},

	/**
	 * Description
	 * @method sendChromeOrderClient
	 * @param {} socketId
	 * @param {} data
	 * @param {} callback
	 * @return 
	 */
	sendChromeOrderClient: function(socketId, data,callback){
		sails.sockets.emit(socketId, 'chromeOrder', data);
		if(callback)
			callback(null);
	},

	/**
	 * Description
	 * @method sendDesktopMessageClient
	 * @param {} socketId
	 * @param {} data
	 * @param {} callback
	 * @return 
	 */
	sendDesktopMessageClient : function(socketId,data,callback){
		sails.sockets.emit(socketId, 'desktopMessage', data);
		if(callback)
			callback(null);
	},

	/**
	 * Description
	 * @method sendCustomMessageClient
	 * @param {} socketId
	 * @param {} type
	 * @param {} data
	 * @param {} callback
	 * @return 
	 */
	sendCustomMessageClient : function(socketId,type,data,callback){
		sails.sockets.emit(socketId, type, data);
		if(callback)
			callback(null);
	},

	/**
	 * Description
	 * @method sendDesktopMessageUser
	 * @param {} userId
	 * @param {} eventName
	 * @param {} data
	 * @param {} callback
	 * @return 
	 */
	sendDesktopMessageUser: function(userId, eventName ,data,callback){
		getUserSocketsId(userId,function(err, sockets){
			if(err) return callback(err);
			
			// if user is not connected
			if(!sockets) return callback(null, 0);
			
			// else, send plenty of socket message to the clients !
			for(var i = 0;i<sockets.length;i++){
				sails.sockets.emit(sockets[i].socketId, eventName, data);
			}
			callback(null, i);
		});
	},

	/**
	 * Description
	 * @method joinRoom
	 * @param {} userId
	 * @param {} roomName
	 * @param {} callback
	 * @return 
	 */
	joinRoom: function(userId, roomName,callback){
		getUserSocketsId(userId,function(sockets){
			if(!sockets || sockets.length === 0) return callback(null, 0);
			
			for(var i = 0;i<sockets.length;i++){
				//sails.sockets.join(sockets[i].socketId, roomName);
			}
			
			callback(null, i);
		});
		
	},
	
	/**
	 * Description
	 * @method destroyAllSavedSockets
	 * @return 
	 */
	destroyAllSavedSockets: function(){
		Socket.destroy()
			  .exec(function(err, sockets){
				  if(err) return sails.log.error(err);
			  });
	}



};