var queries = require('./house.queries.js');

module.exports = function get (options){
    
    return gladys.utils.sql(queries.isUserAsleep, [options.house, options.user])
      .then((rows) => {
          
          // if user is asleep, 
          // we have a row
          return (rows.length > 0);
        });
};