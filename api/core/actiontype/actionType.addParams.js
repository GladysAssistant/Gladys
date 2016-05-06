var Promise = require('bluebird');
var queries = require('./actionType.queries.js');

module.exports = function(actionTypeId, params){
    
  // foreach param 
  return Promise.map(params, function(param){
      
     // we insert the param with the actiontype
     param.actiontype = actionTypeId;
     return createParam(param);
  });
};

// create the param
// only if the param does not already exist
function createParam(param){
    return gladys.utils.sql(queries.getParamByActionTypeAndVariable, [param.actiontype, param.variablename])
      .then(function(params){
          if(params.length){
              return Promise.resolve(params[0]);
          } else {
              
              sails.log.info(`ActionType : addParams : Inserting new param ${param.name}`);
              return ActionTypeParam.create(param);
          }
      })
}