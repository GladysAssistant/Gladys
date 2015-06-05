/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
* PushbulletNotification.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

  	datetime:{
  		type:'datetime',
  		required:true
  	},

  	type:{
  		type:'string',
  		required:true
  	},

  	title:{
  		type:'string'
  	},

  	body:{
  		type:'string'
  	},

  	address:{
  		type:'string'
  	},

  	items:{
  		type:'string'
  	},

  	url:{
  		type:'string',
  		url:true
  	},

  	notification:{
        model:'Notification',
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

