/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  

module.exports = {

	/**
	 * Get the house where this server is
	 * @method getMyHouse
	 * @param {} callback
	 * @return 
	 */
	getMyHouse: function(callback){
		Machine.find({me:true}, function(err, machines){
			if(err) return callback(err);

			if(machines.length == 1)
				return callback(null, machines[0].house);
			else if(machines.length === 0)
				return callback('MachineService : getMyHouse : I don\'t know in which house I live :( ');
			else
				return callback('MachineService : getMyHouse : A machine can\'t be at multiple place at once ! :D ');
		});
	}

};