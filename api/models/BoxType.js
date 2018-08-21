/**
* BoxType.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

 /**
 * @public
 * @name BoxType
 * @class
 */

module.exports = {

  attributes: {
      
      uuid: {
        type: 'string',
        uuid: true,
        required: true,
        unique: true  
      },
      
      title: {
          type: 'string',
          required: true
      },

      path: {
        type: 'string'
      },
      
      // the view where the module should be displayed
      view: {
          type:'string',
          enum: ['dashboard', 'module-param'],
          required: true
      }

  }
};

