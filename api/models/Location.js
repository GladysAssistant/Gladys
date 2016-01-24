/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
* Location.js
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

  	latitude:{
  		type:'float',
        required:true
  	},

    longitude :{
        type:'float',
        required:true
    },

    altitude:{
        type:'float'
    },

    accuracy:{
        type:'float'
    },

    user:{
        model:'User',
        required:true
    }

  },

   beforeValidate: function (values, next) {

    // If no datetime is set, set to actual time
    if (!values.datetime) {
        values.datetime = new Date();
    }

    // if no user is set, set to actual connected user
    if(!values.user){
        values.user = req.session.User.id;
    }

    next();
   }

};

