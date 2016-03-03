var Promise = require('bluebird');

module.exports = function create (location){
  
  // first, we create the location
  return Location.create(location)
    .then(function(location){
        
        // we verify if the user is in a specified Area
        return [gladys.area.inArea(location), location];
    })
    .spread(function(areas, location){
        
        if(areas.length > 0){
            Promise.map(areas, function(area){
               return gladys.scenario.trigger({
                   eventName: 'inArea',
                   scope: area
               });
            });
        }
        
       return Promise.resolve(location); 
    });
};