/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
* Timer.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

   types: {
    // new time type because time does not exist in sails
    time: function(time){
      re = /^[0-2]\d:[0-5]\d$/  ;

      	return (time !== '' && time.match(re));
    },
  },

  attributes: {
  	
  	name:{
  		type:'string'
  	},

  	duration:{
  		type:'string',
  		time:true,
  		required:true
  	},

  	status:{
  		type:'boolean',
  		defaultsTo:false
  	},

  	idTimeout:{
  		type:'integer'
  	},

  	estimateFinish:{
  		type:'datetime'
  	},

  	user:{
  		model:'User',
  		required:true
  	}


  }
};

