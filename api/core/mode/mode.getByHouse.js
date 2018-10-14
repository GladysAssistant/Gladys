
var queries = require('./mode.queries.js');

module.exports = function(house){
  
  // get last events from a specific house
  return gladys.utils.sql(queries.getByHouse, [house.id, 'house-mode-changed'])
    .then(function(events){
       
      // if there are some events
      if(events.length){
           
        // return the last events (it's ordered by datetime DESC)
        return Promise.resolve(events[0]);
      } else {
           
        // else return defauls as it does not have 
        return Promise.resolve({value: 'default'});
      }
    });
};