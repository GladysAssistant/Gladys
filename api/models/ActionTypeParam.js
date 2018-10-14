/**
 * ActionTypeParam.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  attributes: {
    name: {
      type: 'string',
      required: true
    },

    variablename: {
      type: 'string',
      required: true
    },

    path: {
      type: 'string'
    },

    actiontype: {
      model: 'ActionType',
      required: true
    }
  }
};
