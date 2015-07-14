/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * TimerController
 *
 * @description :: Server-side logic for managing timers
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

	/**
	 * Create a new Timer
	 * @method create
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	create:function(req,res,next){
		if(!req.param('duration'))
			return res.json('Missing parametres');

		// defaults name
		var name = 'Timer';
		if(req.param('name'))
			name = req.param('name');

		var timerObj = {
			name:name,
			duration:req.param('duration'),
			user:req.session.User.id
		};

		Timer.create(timerObj, function timerCreated(err, Timer){
				if(err) return res.json(err);

				res.json(Timer);
		});
	},

	/**
	 * Destroy a given Timer
	 * @method destroy
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	destroy:function(req,res,next){
		if(!req.param('id'))
			return res.json('Mising parametres');

		Timer.destroy(req.param('id'), function timerDestroyed(err, Timer){
				if(err) return res.json(err);

				res.json(Timer);
		});	
	},

	/**
	 * Update a Timer
	 * @method update
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	update:function(req,res,next){
		if(!req.param('name') || !req.param('duration') || !req.param('id'))
			return res.json('Missing parametres');

		Timer.update(req.param('id'), {name: req.param('name'), duration:req.param('duration')}, function timerUpdated(err, Timer){
			if(err) return res.json(err);

			res.json(Timer);
		});
	},

	/**
	 * Start a Timer
	 * @method start
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	start:function(req,res,next){
		if(!req.param('id'))
			return res.json('Missing parametres');

		Timer.findOne(req.param('id'), function foundTimer(err,Timer){
				if(err) return res.json(err);

				if(!Timer)
					return res.json('Timer does not exist');

				TimerService.start(Timer, function (){
						ScenarioService.launcher('timer', Timer.id);
				});	

				res.json('Timer started');
		});

		
	},

	/**
	 * Stop a Timer
	 * @method stop
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	stop:function(req,res,next){
		if(!req.param('id'))
			return res.json('Missing parametres');

		Timer.findOne(req.param('id'), function foundTimer(err,Timer){
				if(err) return res.json(err);

				if(!Timer)
					return res.json('Timer does not exist');

				TimerService.stop(Timer, function (){
						
				});	

				res.json('Timer stopped');
		});
	}
	
};

