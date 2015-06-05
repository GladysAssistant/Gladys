/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
* MilightLamp.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

  	name:{
  		type:'string',
  		required:true
  	},

  	zone:{
  		type:'integer',
  		min:1,
  		max:4,
  		required:true
  	},
  	
  	status:{
  		type:'boolean',
  		defaultsTo:false
  	},

  	color:{
  		type:'integer',
  		min:0,
  		max:255
  	},

  	brightness:{
  		type:'integer',
  		min:0,
  		max:100
  	},

  	room:{
        model:'Room',
        required:true
    },

    milightwifi:{
        model:'MilightWifi',
        required:true
    }

  }
};

