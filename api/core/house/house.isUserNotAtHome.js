var queries = require('./house.queries.js');

module.exports = function isUserNotAtHome(options){
    
    return gladys.utils.sql(queries.isUserAtHome, [options.house, options.user])
      .then((rows) => {
          
          // if user is not present in house, return true
          if(rows.length) return false;

          return true;
        });
};