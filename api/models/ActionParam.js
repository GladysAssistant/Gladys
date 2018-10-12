/**
 * ActionParam.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  attributes: {
    value: {
      type: 'string'
    },

    action: {
      model: 'Action',
      required: true
    },

    actiontypeparam: {
      model: 'ActionTypeParam',
      required: true
    }
  }
};
