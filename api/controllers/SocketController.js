
module.exports = {

	
	/**
	 * Subscribe to all the sockets room the user is concerned by
	 */
	subscribe: function(req, res) {
		
        // if request is not a socket, bad request
		if (!req.isSocket) return res.badRequest();

		// Get socket Id
		var socketId = sails.sockets.getId(req);
        gladys.socket.join(req.session.User.id, socketId); 
    }
	
};

