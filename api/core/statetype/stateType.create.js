var queries = require('./stateType.queries.js');
var Promise = require('bluebird');

module.exports = function(stateType){
    
   // we test if the stateType already exist in DB
   return gladys.utils.sql(queries.getByUuid, [stateType.uuid])
     .then(function(stateTypes){
        
        // if yes
        if(stateTypes.length){
            return stateTypes[0];
        } else {
            
            sails.log.info(`StateType : create : Inserting stateType ${stateType.name}`);
            return StateType.create(stateType); 
        }
     })
     .then(function(newStateType){
         
        if(stateType.params){
            return insertParams(newStateType, stateType.params);
        } else {
            return newStateType;
        }
         
     })
     .then(function(newStateType){
        
        if(stateType.templateParams){
            return insertTemplateParams(newStateType, stateType.templateParams);
        } else {
            return newStateType;
        }
     });
   
};

// insert stateTypeParams
function insertParams(stateType, params){
    return Promise.each(params, function(param){
       param.statetype = stateType.id;
       return gladys.stateTypeParam.create(param); 
    })
    .then(function(){
        return stateType;
    });
}

// insert stateTemplateParams
function insertTemplateParams(stateType, params){
    return Promise.each(params, function(param){
       param.statetype = stateType.id;
       return gladys.stateTemplateParam.create(param); 
    })
    .then(function(){
        return stateType;
    });
}