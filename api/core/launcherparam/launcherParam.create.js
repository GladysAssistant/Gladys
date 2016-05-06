var queries = require('./launcherParam.queries.js');

module.exports = function(param){
    
    // we test if the param already exist
    return gladys.utils.sql(queries.getByEventTypeAndVariable, [param.eventtype, param.variablename])
      .then(function(params){
          
          // if yes, no need to insert it again
          if(params.length){
              return Promise.resolve(params[0]);
          } else {
              
              sails.log.info(`LauncherParam : create : Inserting LauncherParam : ${param.name}`);
              // if no, we insert the param
              return LauncherParam.create(param);
          }
      });
};