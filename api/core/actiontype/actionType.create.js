var uuid = require('uuid');
var queries = require('./actionType.queries.js');
    
module.exports = function(actionType){
    
  // we test if the actionType already exist
  return gladys.utils.sql(queries.getByUuid, [actionType.uuid])
    .then(function(actionTypes){
         
      if(actionTypes.length){
        return ActionType.update(actionTypes[0].id, actionType)
          .then((actionTypes) => actionTypes[0]);
      } else {
             
        // inserting new actiontype
        actionType.uuid = actionType.uuid || uuid.v4();
             
        sails.log.info(`ActionType : create : Inserting new ActionType ${actionType.name}`);
        return ActionType.create(actionType);
      }
    });
};