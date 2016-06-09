var queries = require('./paramUser.queries.js');
var shared = require('./paramUser.shared.js');

module.exports = function(paramUser){
    
    // delete in database
    return gladys.utils.sql(queries.deleteValue, [paramUser.name, paramUser.user])
      .then(function(){
          
          // then delete in cache
          if(shared.cache[paramUser.user] && shared.cache[paramUser.user][paramUser.name]){
              delete shared.cache[paramUser.user][paramUser.name];
          }
      });  
};