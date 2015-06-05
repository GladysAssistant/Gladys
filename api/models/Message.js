/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
* Message.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

  	text:{
  		type:'string',
  		required:true
  	},

  	datetime:{
  		type:'datetime',
  		required:true
  	},

  	isRead:{
  		type:'boolean',
  		defaultsTo:false
  	},

  	sender:{
        model:'User',
        required:true
    },

    receiver:{
        model:'User',
        required:true
    }

  },

   beforeValidate: function (values, next) {

    // If no datetime is set, set to actual time
    if (!values.datetime) {
     	 	values.datetime = new Date();
    }
    next();
  }

};

