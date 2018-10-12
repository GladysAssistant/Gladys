var Promise = require('bluebird');

module.exports = function(actionTypes){
  
  // foreach actionTypes
  return Promise.map(actionTypes, function(actionType){
    
    // we insert the action and it's params
    return insertActionAndParams(actionType);
  });
};

function insertActionAndParams(actionType){
  var params = actionType.params;
  delete actionType.params;
    
  // we create the actionType
  return gladys.actionType.create(actionType)
    .then(function(newActionType){
          
        
      // and all params
      return gladys.actionType.addParams(newActionType.id, params);
    });
}