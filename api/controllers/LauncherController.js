/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * LauncherController
 * @description :: Server-side logic for managing launchers
 * @help :: See http://links.sailsjs.org/docs/controllers
 */

 /**
 * Test if the user is allowed to modify a given Launcher
 * @method haveRights
 * @param {} launcher
 * @param {} user
 * @param {} callback
 * @return 
 */
function haveRights(launcher, user,callback){
	Launcher.findOne({id : launcher, user: user}, function(err, launcher){
		if(err) return callback(err);

		callback(false, launcher);
	});
}

/**
 * Test if the user is allowed to modify a given action
 * @method haveRightsAction
 * @param {} action
 * @param {} user
 * @param {} callback
 * @return 
 */
var haveRightsAction = function(action, user,callback){
	Action.findOne({id : action, user: user}, function(err, action){
		if(err) return callback(err);

		callback(false, action);
	});
}

/**
 * Test if the user is allowed to modify a given state
 * @method haveRightsState
 * @param {} state
 * @param {} user
 * @param {} callback
 * @return 
 */
var haveRightsState = function(state, user,callback){
	State.findOne({id : state, user: user}, function(err, state){
		if(err) return callback(err);

		callback(false, state);
	});
}



module.exports = {

	/**
	 * Create a new launcher
	 * @method create
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	create : function(req,res,next){
		var launcherObj = {
			launcher:req.param('launcher'),
			operator: req.param('operator'),
			parametre:req.param('parametre'),
			user:req.session.User.id
		};

		Launcher.create(launcherObj, function(err, launcher){
			if(err) return res.json(err);

			res.json(launcher);
		});
	},

	/**
	 * Destroy a launcher
	 * @method destroy
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	destroy : function(req,res,next){
		haveRights(req.param('id'), req.session.User.id, function(err, launcher){
			if(err) return res.json(err);

			if(launcher){
				Launcher.destroy({id:req.param('id')}, function(err, launcher){
					if(err) return res.json(err);

					Action.destroy({launcher:req.param('id')}, function(err, action){
						if(err) return res.json(err);

						State.destroy({launcher:req.param('id')}, function(err, state){
							if(err) return res.json(err);

							res.json(launcher);
						});
					});
					
				});
			}else{
				res.json('not found');
			}
		});
	},

	/**
	 * Associate an action to a launcher
	 * @method addAction
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	addAction : function(req,res,next){
		haveRights(req.param('id'), req.session.User.id, function(err, launcher){
			if(err) return res.json(err);

			if(launcher){
				haveRightsAction(req.param('action'), req.session.User.id, function(err, action){
					if(err) return res.json(err);

					if(action){
					
					  launcher.actions.add(req.param('action'));

					  
					  launcher.save(function(err) {
					  		if(err) return res.json(err);

					  		res.json(launcher);
					  });
					}else{
						res.json('not found');
					}
					  
				});
				
			}else{
				res.json('not found');
			}
		});
	},

	/**
	 * Associate a state to a launcher
	 * @method addState
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	addState : function(req,res,next){
		haveRights(req.param('id'), req.session.User.id, function(err, launcher){
			if(err) return res.json(err);

			if(launcher){
				haveRightsState(req.param('state'), req.session.User.id, function(err, state){
					if(err) return res.json(err);

					if(state){
					
					  launcher.states.add(req.param('state'));

					  
					  launcher.save(function(err) {
					  		if(err) return res.json(err);

					  		res.json(launcher);
					  });
					}else{
						res.json('not found');
					}
					  
				});
				
			}else{
				res.json('not found');
			}
		});
	},
	
};

