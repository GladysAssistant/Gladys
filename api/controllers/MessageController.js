/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * MessageController
 *
 * @description :: Server-side logic for managing Messages
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

	/**
	 * Description
	 * @method send
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	send: function(req, res, next){	
		if (!req.isSocket) return res.badRequest();

		var socketId = sails.sockets.id(req.socket);
		
	  	var messageObj = {
	      text: req.param('text'),
	      sender: req.session.User.id,
	      receiver: req.param('receiver') 
	    };

	  		Message.create(messageObj, function MessageCreated(err,Message){
	  			if(err) return err;
	  			sails.sockets.emit(Message.receiver, 'Message', {from: Message.sender, text: Message.text});
				    res.json(Message);
	  		});
	},


	/**
	 * Description
	 * @method getLastMessages
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	getLastMessages: function(req, res, next){
		/*Message.query("SELECT DISTINCT(receiver), datetime, text FROM Message WHERE sender = " + req.session.User.id, function(err,messages){
				res.json(messages);
		});$*/
	}
	
};

