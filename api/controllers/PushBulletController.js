/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * PushBulletController
 *
 * @description :: Server-side logic for managing PushBullet
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
	
	index: function(req,res,next){
		PushBulletParametre.find({user:req.session.User.id}, function(err, pushbulletParametres){
			if(err) return res.json(err);
			
			return res.json(pushbulletParametres);
		});
	},
	
	create: function(req,res,next){
		PushBulletParametre.create({token:req.param('token'), user:req.session.User.id}, function(err, pushbulletParametre){
			if(err) return res.json(err);
			
			return res.json(pushbulletParametre);
		});
	},
	
	destroy: function(req,res,next){
		PushBulletParametre.destroy({id:req.param('id'), user:req.session.User.id}, function(err, pushbulletParametre){
			if(err) return res.json(err);
			
			return res.json(pushbulletParametre);
		});
	},
};

