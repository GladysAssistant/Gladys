/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * TokenController
 *
 * @description :: Server-side logic for managing tokens
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */
var crypto = require('crypto');

module.exports = {

	/**
	 * Get all the tokens of the current user
	 * @method index
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	index : function(req,res,next) {
		Token.find()
		.where({ user : req.session.User.id })
		.exec(function foundTokens(err,Tokens ) {
				if (err)  return res.json(err);
				
				return res.json(Tokens);
		});
	},

	/**
	 * Create a new token
	 * @method create
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	create : function(req, res, next) {

		var seed = crypto.randomBytes(20);
		var token = crypto.createHash('sha1').update(seed).digest('hex');

		var tokenObj = {
			name : req.param('name'),
			value: token,
			user : req.session.User.id 
		};

		Token.create(tokenObj, function tokenCreated(err,token){
			  if(err) return res.json(err);

			  return res.json(token);
		});

	},

	/**
	 * Destroy a Token
	 * @method destroy
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	destroy : function(req,res,next) {
		Token.destroy({ id: req.param('id'), user:req.session.User.id}, function tokenDestroyed(err, token){
			if(err) return res.json(err);

			return res.json(token);
		});
	},

	/**
	 * Update the status of a token
	 * (switch active from true to false, or from false to true)
	 * @method updateStatus
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	updateStatus: function(req,res,next) {

		Token.update({ id: req.param('id'), user:req.session.User.id}, { status : req.param('status') }, function tokenUpdated(err, token){
			if(err) return res.json(err);

			return res.json(token);
		});
	}
	
};

