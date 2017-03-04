/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Jean-Philippe Danrée
  */
  
/**
* Door.js
*
* @description :: This model describe the table structure for storing the Door Sensor value get from devices.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

  	datetime:{
  		type:'datetime',
  		required:true
  	},

  	doorsensor:{
        model:'DoorSensor',
        required:true
    },

  },

  beforeValidate: function (values, next) {

    // If no datetime is set, set to actual time
    if (!values.datetime) {
     	 	values.datetime = new Date();
    }
    next();
  }
  
};

