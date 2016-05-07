var Promise = require('bluebird');

module.exports = function create (location){
    
   location.datetime = location.datetime || new Date();
  
  // we check if the user did not enter a new area
  return gladys.area.enterArea(location)
    .then(function(areas){
        
       if(areas.length > 0){
            Promise.map(areas, function(area){
               return gladys.event.create({
                   code: 'enter-area',
                   user: location.user,
                   value: area.name,
                   scope: area
               });
            });
        }
        
        // we create the location in database
        return Location.create(location);
    });
};