/**
* Answer.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
      
      uuid: {
          type:'string',
          uuid: true,
          required: true,
          unique: true
      },
      
      sentence: {
         type: 'string',
         uuid: true,
         required: true  
      },
      
      text: {
          type: 'string',
          required: true
      }

  }
};

