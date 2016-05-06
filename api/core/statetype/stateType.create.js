var queries = require('./stateType.queries.js');

module.exports = function(stateType){
    
   // we test if the stateType already exist in DB
   return gladys.utils.sql(queries.betByUuid, [stateType.uuid])
     .then(function(stateTypes){
        
        // if yes
        if(stateTypes.length){
            return stateTypes[0];
        } else {
            
            sails.log.info(`StateType : create : Inserting stateType ${stateType.name}`);
            return StateType.create(stateType); 
        }
     });
   
};