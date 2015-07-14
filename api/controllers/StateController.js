/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * StateController
 * @description :: Server-side logic for managing states
 * @help :: See http://links.sailsjs.org/docs/controllers
 * @method haveRights
 * @param {} state
 * @param {} user
 * @param {} callback
 * @return 
 */
function haveRights(state, user,callback){
	State.findOne({id : state, user: user}, function(err, state){
		if(err) return callback(err);

		callback(false, state);
	});
}

module.exports = {

	/**
	 * Create a new State
	 * @method create
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	create : function(req,res,next){
		var stateObj = {
			state:req.param('state'),
			launcher:req.param('launcher'),
			operator: req.param('operator'),
			parametre:req.param('parametre'),
			user:req.session.User.id
		};

		State.create(stateObj, function(err, state){
			if(err) return res.json(err);

			res.json(state);
		});
	},

	/**
	 * Destroy a state
	 * @method destroy
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	destroy : function(req,res,next){
		haveRights(req.param('id'), req.session.User.id, function(err, state){
			if(err) return res.json(err);

			if(state){
				State.destroy({id:req.param('id')}, function(err, state){
					if(err) return res.json(err);

					res.json(state);
				});
			}else{
				res.json('not found');
			}
		});
	}
	
};

