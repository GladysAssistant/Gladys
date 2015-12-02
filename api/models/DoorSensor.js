/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Jean-Philippe Danrée
  */
  
/**
* DoorSensor.js
*
* @description :: This model describe the table structure for storing the Door Sensor devices.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
  	
  	name:{
  		type:'string'
  	},

  	code:{
  		type:'string',
  		required:true,
      unique:true
  	},

  	room:{
        model:'Room',
        required:true
    },

    motions:{
        collection: 'Door',
        via: 'doorsensor'
    }

  }
};

