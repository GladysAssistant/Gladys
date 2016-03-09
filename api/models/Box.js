/**
* Box.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
      
      title: {
          type: 'string',
          required: true
      },
      
      x: {
          type: 'integer',
          required: true
      },
      
      y: {
          type: 'integer',
          required: true
      },
      
      ngcontroller: {
          type: 'string'
      },
      
      html: {
          type: 'text'
      },
      
      icon: {
          type: 'string'
      },
      
      user: {
          model: 'User',
          required: true
      }

  }
};

