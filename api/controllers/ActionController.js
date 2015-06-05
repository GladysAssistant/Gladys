/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
/**
 * ActionController
 * @description :: Server-side logic for managing Actions
 * @help :: See http://links.sailsjs.org/docs/controllers
 */

/**
 * @method haveRights
 * @param {} action
 * @param {} user
 * @param {} callback
 * @return 
 */
var haveRights = function(action, user,callback){
	Action.findOne({id : action, user: user}, function(err, action){
		if(err) return callback(err);

		callback(false, action);
	});
}

module.exports = {

	/**
	 * Description
	 * @method create
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	create : function(req,res,next){
		var actionObj = {
			action:req.param('action'),
			launcher:req.param('launcher'),
			parametre:req.param('parametre'),
			user:req.session.User.id
		};
		
		Action.create(actionObj, function(err, action){
			if(err) return res.json(err);

			res.json(action);
		});
	},

	/**
	 * Description
	 * @method destroy
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	destroy : function(req,res,next){
		haveRights(req.param('id'), req.session.User.id, function(err, action){
			if(err) return res.json(err);

			if(action){
				Action.destroy({id:req.param('id')}, function(err, action){
					if(err) return res.json(err);

					res.json(action);
				});
			}else{
				res.json('not found');
			}
		});
	}
	 
};

