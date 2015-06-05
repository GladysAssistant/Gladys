/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * ScenarioController
 *
 * @description :: Server-side logic for managing Scenarios
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	/**
	 * Get all scenarios 
	 * (Launcher + states + actions)
	 * @method index
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	index: function(req,res,next){
		Launcher.find({user: req.session.User.id})
				.populate('states')
				.populate('actions')
				.populate('launcher')
				.exec(function(err,launcher){
					if(err) return res.json(err);

					return res.json(launcher);
				});

	},

};

