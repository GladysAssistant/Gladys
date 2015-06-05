/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
* DashboardBox.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

  	title:{
  		type:'string',
    	required:true
  	},
    
    ngController:{
      type:'string'
    },
    
    html:{
      type:'string',
    },

    icon:{
      type:'string',
      required:true
    },

    type:{
    	type:'string'
    },
    
   
  }
};

