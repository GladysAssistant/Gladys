/**
* Mode.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
      
      code: {
          type:'string',
          required: true,
          unique: true
      },
      
      name: {
          type:'string',
          required: true
      },
      
      description: {
          type: 'string',
          required: true
      }
      
  }
};

