/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
* Contact.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

  	firstname:{
  		type:'string',
    	required:true
  	},

    lastname:{
      type:'string',
      required:true
    },

    type:{
    	type:'string'
    },

    fullname: function() {
      return this.firstname + ' ' + this.lastname;
    },

  	email:{
  		type:'string',
  		email:true,
  		unique:true
  	},

    birthdate :{
    	type:'date'
    },

    age: function() {
        var birth = new Date(this.birthdate);
        var now = new Date();
        return (now.getTime() - birth.getTime())/ (1000*60*60*24*365);
    },

    gender :{
      type:'integer'
    },

    user:{
      model:'User',
      required:true
    }
  }
};

