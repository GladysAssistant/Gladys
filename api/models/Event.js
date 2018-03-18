/**
* Event.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

/**
 * @public
 * @name Event
 * @class
 */

module.exports = {

  attributes: {
      
        datetime: {
            type: 'datetime',
            required: true
        },

        value: {
            type: 'string'
        },

        user: {
            model: 'User'
        },
        
        house: {
            model:'House'
        },
        
        room: {
            model: 'Room'
        },

        eventtype: {
            model: 'EventType',
            required: true
        }

  }
};

